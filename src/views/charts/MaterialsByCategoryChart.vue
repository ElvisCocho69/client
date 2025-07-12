<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTheme } from 'vuetify'
import { getHorizontalBarChartConfig } from '@core/libs/chartjs/chartjsConfig'
import BarChart from '@core/libs/chartjs/components/BarChart'
import { $api } from '@/utils/api'

const props = defineProps({
  colors: {
    type: null,
    required: true,
  },
})

const vuetifyTheme = useTheme()
const chartConfig = computed(() => getHorizontalBarChartConfig(vuetifyTheme.current.value))

const materials = ref([])
const loading = ref(true)

// Función para obtener los materiales
const fetchMaterials = async () => {
  try {
    loading.value = true
    const response = await $api('/materials?size=1000', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    materials.value = response.content || []
    console.log('Materiales obtenidos:', materials.value)
  } catch (error) {
    console.error('Error al obtener materiales:', error)
  } finally {
    loading.value = false
  }
}

// Computed property para procesar los datos del gráfico
const chartData = computed(() => {
  if (!materials.value.length) {
    return {
      labels: ['Sin datos'],
      datasets: [{
        label: 'Materiales',
        data: [0],
        backgroundColor: [props.colors.polarChartGrey],
      }]
    }
  }

  // Agrupar materiales por categoría
  const categoryCounts = {}
  materials.value.forEach(material => {
    const categoryName = material.materialcategory?.name || 'Sin categoría'
    if (!categoryCounts[categoryName]) {
      categoryCounts[categoryName] = 0
    }
    categoryCounts[categoryName]++
  })

  console.log('Materiales agrupados por categoría:', categoryCounts)

  // Ordenar por cantidad de materiales (descendente) y tomar los top 8
  const sortedCategories = Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)

  console.log('Categorías ordenadas:', sortedCategories)

  const labels = sortedCategories.map(([name]) => name)
  const data = sortedCategories.map(([, count]) => count)

  return {
    labels,
    datasets: [{
      label: 'Cantidad de Materiales',
      data,
      backgroundColor: props.colors.primary,
      borderWidth: 0,
    }]
  }
})

// Cargar datos al montar el componente
onMounted(() => {
  fetchMaterials()
})
</script>

<template>
  <div>
    <VProgressLinear
      v-if="loading"
      indeterminate
      color="primary"
    />
    
    <BarChart
      v-else
      :height="400"
      :chart-data="chartData"
      :chart-options="chartConfig"
    />
  </div>
</template> 