<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import { getPolarChartConfig } from '@core/libs/chartjs/chartjsConfig'
import PolarAreaChart from '@core/libs/chartjs/components/PolarAreaChart'
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

const vuetifyTheme = useTheme()
const chartConfig = computed(() => getPolarChartConfig(vuetifyTheme.current.value))

const movements = ref([])
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

// Función para obtener los movimientos
const fetchMovements = async (start, end) => {
  try {
    loading.value = true
            const formattedStartDate = formatDateForAPI(start, false)
    const formattedEndDate = formatDateForAPI(end, true)

    const params = new URLSearchParams({
      size: 1000,
      movementType: 'OUT',
    })

    if (formattedStartDate) params.append('startDate', formattedStartDate)
    if (formattedEndDate) params.append('endDate', formattedEndDate)

    const response = await $api(`/materials/movements?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    movements.value = response.content || []
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
  } finally {
    loading.value = false
  }
}

// Computed property para procesar los datos del gráfico
const chartData = computed(() => {
  if (!movements.value.length) {
    return {
      labels: ['Sin datos'],
      datasets: [{
        borderWidth: 0,
        label: 'Salidas',
        data: [0],
        backgroundColor: [props.colors.polarChartGrey],
      }]
    }
  }

  // Filtrar solo movimientos de salida
  const outputMovements = movements.value.filter(movement => 
    movement.movementtype === 'OUT'
  )
  
  console.log('Movimientos de salida filtrados:', outputMovements)

  // Agrupar por material y contar movimientos (no sumar cantidades)
  const materialOutputs = {}
  const materialDetails = {}
  
  outputMovements.forEach(movement => {
    const materialName = movement.material?.name || 'Material sin nombre'
    const quantity = parseFloat(movement.quantity) || 0    
    
    if (!materialOutputs[materialName]) {
      materialOutputs[materialName] = 0
      materialDetails[materialName] = []
    }
    
    // Contar el número de movimientos de salida, no sumar cantidades
    materialOutputs[materialName] += 1
    materialDetails[materialName].push({
      quantity,
      date: movement.movementdate,
      description: movement.description
    })
  })

  // Ordenar por número de movimientos de salida (descendente) y tomar los top 6
  const sortedMaterials = Object.entries(materialOutputs)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)

  console.log('Materiales ordenados por número de movimientos:', sortedMaterials)

  const labels = sortedMaterials.map(([name]) => name)
  const data = sortedMaterials.map(([, count]) => count)

  // Colores para el gráfico
  const backgroundColors = [
    props.colors.primary,
    props.colors.yellow,
    props.colors.polarChartWarning,
    props.colors.polarChartInfo,
    props.colors.polarChartGrey,
    props.colors.polarChartGreen,
  ]

  return {
    labels,
    datasets: [{
      borderWidth: 0,
      label: 'Número de Salidas',
      data,
      backgroundColor: backgroundColors.slice(0, labels.length),
    }]
  }
})

// Observar cambios en las fechas
watch([() => props.startDate, () => props.endDate], ([newStartDate, newEndDate]) => {
  fetchMovements(newStartDate, newEndDate)
})

// Cargar datos al montar el componente
onMounted(() => {
  fetchMovements(props.startDate, props.endDate)
})
</script>

<template>
  <div>
    <VProgressLinear
      v-if="loading"
      indeterminate
      color="primary"
    />
    
    <PolarAreaChart
      v-else
      :height="400"
      :chart-data="chartData"
      :chart-options="chartConfig"
    />
  </div>
</template> 