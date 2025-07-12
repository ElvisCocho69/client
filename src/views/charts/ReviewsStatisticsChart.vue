<script setup>
import { ref, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { $api } from '@/utils/api'

const loading = ref(true)
const ratings = ref([])

const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

// Obtener ratings de la API
const fetchRatings = async () => {
  try {
    loading.value = true
    const response = await $api('/ratings?size=1000', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    ratings.value = response.content || []
  } catch (error) {
    console.error('Error al obtener ratings:', error)
  } finally {
    loading.value = false
  }
}

// Sumar estrellas por mes
const getStarsSumByMonth = () => {
  const sums = Array(12).fill(0)
  ratings.value.forEach(rating => {
    if (rating.createdAt && rating.rating) {
      const date = new Date(rating.createdAt)
      const month = date.getMonth()
      sums[month] += rating.rating
    }
  })
  return sums
}

const reviewStatChartSeries = ref([
  { name: '', data: [] }
])

const reviewStatChartConfig = {
  chart: {
    height: 160,
    width: '100%',
    type: 'bar',
    toolbar: { show: false },
  },
  legend: { show: false },
  grid: {
    show: false,
    padding: { top: -25, bottom: -12 },
  },
  colors: [
    'rgba(34,197,94,0.5)',
    'rgba(34,197,94,0.5)',
    'rgba(34,197,94,0.5)',
    'rgba(34,197,94,0.5)',
    'rgba(34,197,94,1)',
    'rgba(34,197,94,0.5)',
    'rgba(34,197,94,0.5)',
    'rgba(34,197,94,0.5)',
    'rgba(34,197,94,0.5)',
    'rgba(34,197,94,0.5)',
    'rgba(34,197,94,0.5)',
    'rgba(34,197,94,0.5)',
  ],
  plotOptions: {
    bar: {
      barHeight: '75%',
      columnWidth: '35%',
      borderRadius: 5,
      distributed: true,
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: months,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: {
        colors: 'rgba(60,60,60,0.6)',
        fontSize: '13px',
      },
    },
  },
  yaxis: { labels: { show: false } },
  tooltip: {
    y: {
      formatter: val => `Total de estrellas: ${val}`
    },
    marker: { show: false },
    x: { show: true },
    shared: false,
    custom: undefined,
    enabled: true,
    followCursor: true,
    fillSeriesColor: false,
    style: { fontSize: '14px' },
    fixed: { enabled: false },
  },
  legend: { show: false },
}

onMounted(async () => {
  await fetchRatings()
  reviewStatChartSeries.value[0].data = getStarsSumByMonth()
})
</script>

<template>
  <VProgressLinear v-if="loading" indeterminate color="primary" />
  <div v-else>
    <VueApexCharts
      type="bar"
      height="150"
      :options="reviewStatChartConfig"
      :series="reviewStatChartSeries"
    />
  </div>
</template> 