<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { $api } from '@/utils/api'

const props = defineProps({
  colors: {
    type: null,
    required: true,
  },
  startDate: {
    type: String,
    default: null,
  },
  endDate: {
    type: String,
    default: null,
  },
})

const ratings = ref([])
const loading = ref(true)

// Función para formatear la fecha para la API
const formatDateForAPI = (date, isEndDate = false) => {
  if (!date) return null

  const [year, month, day] = date.split('-').map(Number)
  const hours = isEndDate ? 23 : 0
  const minutes = isEndDate ? 59 : 0
  const seconds = isEndDate ? 59 : 0
  const milliseconds = isEndDate ? 999 : 0

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
}

// Función para obtener las calificaciones
const fetchRatings = async (start, end) => {
  try {
    loading.value = true

    const formattedStartDate = formatDateForAPI(start, false)
    const formattedEndDate = formatDateForAPI(end, true)

    const params = new URLSearchParams({
      size: 1000,
    })

    if (formattedStartDate) params.append('startDate', formattedStartDate)
    if (formattedEndDate) params.append('endDate', formattedEndDate)

    const response = await $api(`/ratings?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    ratings.value = response.content || []
    console.log('Calificaciones obtenidas:', ratings.value)
  } catch (error) {
    console.error('Error al obtener calificaciones:', error)
  } finally {
    loading.value = false
  }
}

// Computed properties para las estadísticas
const ratingStats = computed(() => {
  if (!ratings.value.length) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: [
        { rating: 5, value: 0 },
        { rating: 4, value: 0 },
        { rating: 3, value: 0 },
        { rating: 2, value: 0 },
        { rating: 1, value: 0 },
      ],
      positivePercentage: 0
    }
  }

  // Calcular promedio
  const totalRating = ratings.value.reduce((sum, rating) => sum + (rating.rating || 0), 0)
  const averageRating = (totalRating / ratings.value.length).toFixed(2)
  
  // Distribución por estrellas
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratings.value.forEach(rating => {
    const stars = rating.rating || 0
    if (distribution[stars] !== undefined) {
      distribution[stars]++
    }
  })

  const ratingDistribution = [
    { rating: 5, value: distribution[5] },
    { rating: 4, value: distribution[4] },
    { rating: 3, value: distribution[3] },
    { rating: 2, value: distribution[2] },
    { rating: 1, value: distribution[1] },
  ]

  // Calcular porcentaje de calificaciones positivas (4-5 estrellas)
  const positiveReviews = distribution[4] + distribution[5]
  const positivePercentage = Math.round((positiveReviews / ratings.value.length) * 100)

  return {
    averageRating,
    totalReviews: ratings.value.length,
    ratingDistribution,
    positivePercentage
  }
})

// Observar cambios en las fechas
watch([() => props.startDate, () => props.endDate], ([newStartDate, newEndDate]) => {
  fetchRatings(newStartDate, newEndDate)
})

// Cargar datos al montar el componente
onMounted(() => {
  fetchRatings(props.startDate, props.endDate)
})
</script>

<template>
  <div>
    <VProgressLinear
      v-if="loading"
      indeterminate
      color="primary"
    />
    
    <div v-else>
      <VRow>
        <VCol
          cols="12"
          sm="6"
        >
          <div :class="$vuetify.display.smAndUp ? 'border-e' : 'border-b'">
            <div class="d-flex align-center gap-x-2">
              <h4 class="text-h3 text-primary">
                {{ ratingStats.averageRating }}
              </h4>
              <VIcon
                icon="ri-star-smile-line"
                color="primary"
                size="32"
              />
            </div>
            <h6 class="my-2 text-h6">
              Total {{ ratingStats.totalReviews }} reviews
            </h6>
        
            <VChip
              color="primary"
              size="small"
              :class="$vuetify.display.smAndUp ? '' : 'mb-4'"
            >
              {{ ratingStats.positivePercentage }}% Positivas
            </VChip>
          </div>
        </VCol>

        <VCol
          cols="12"
          sm="6"
        >
          <div
            v-for="(item, index) in ratingStats.ratingDistribution"
            :key="index"
            class="d-flex align-center gap-2 mb-3"
          >
            <div class="text-sm text-no-wrap">
              {{ item.rating }} Estrella{{ item.rating !== 1 ? 's' : '' }}
            </div>
            <div class="w-100">
              <VProgressLinear
                color="primary"
                height="8"
                :model-value="ratingStats.totalReviews > 0 ? (item.value / ratingStats.totalReviews) * 100 : 0"
                rounded
              />
            </div>
            <div class="text-sm">
              {{ item.value }}
            </div>
          </div>
        </VCol>
      </VRow>
    </div>
  </div>
</template> 