<script setup>
import MaterialsOutputChart from '@/views/charts/MaterialsOutputChart.vue'
import MaterialsByCategoryChart from '@/views/charts/MaterialsByCategoryChart.vue'
import CustomerRatingsChart from '@/views/charts/CustomerRatingsChart.vue'
import ReviewsStatisticsChart from '@/views/charts/ReviewsStatisticsChart.vue'
import OrdersOverview from '@/components/fammeba/dashboard/OrdersOverview.vue'
import { ref, onMounted } from 'vue'
import { $api } from '@/utils/api'

const chartJsCustomColors = {
  white: '#fff',
  yellow: '#ffe802',
  primary: '#836af9',
  areaChartBlue: '#2c9aff',
  barChartYellow: '#ffcf5c',
  polarChartGrey: '#4f5d70',
  polarChartInfo: '#299aff',
  lineChartYellow: '#d4e157',
  polarChartGreen: '#28dac6',
  lineChartPrimary: '#9e69fd',
  lineChartWarning: '#ff9800',
  horizontalBarInfo: '#26c6da',
  polarChartWarning: '#ff8131',
  scatterChartGreen: '#28c76f',
  warningShade: '#ffbd1f',
  areaChartBlueLight: '#84d0ff',
  areaChartGreyLight: '#edf1f4',
  scatterChartWarning: '#ff9f43',
}

// Estados para el resumen
const summaryData = ref({
  customers: 0,
  materials: 0,
  movements: 0
})
const loading = ref(true)

// Fechas para el filtro de materiales con más salidas
const startDate = ref(null)
const endDate = ref(null)

// Función para obtener los datos del resumen
const fetchSummaryData = async () => {
  try {
    loading.value = true
    
    const customersResponse = await $api('/clients?size=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    const materialsResponse = await $api('/materials?size=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    const movementsResponse = await $api('/materials/movements?size=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    summaryData.value = {
      customers: customersResponse.totalElements || 0,
      materials: materialsResponse.totalElements || 0,
      movements: movementsResponse.totalElements || 0
    }
  } catch (error) {
    console.error('Error al obtener datos del resumen:', error)
  } finally {
    loading.value = false
  }
}

// Cargar datos al montar el componente
onMounted(() => {
  fetchSummaryData()
})
</script>

<template>
  <!-- 👉 Resumen de estadísticas -->
  <VRow class="mb-6">
    <!-- 👉 Número de Clientes -->
    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="summary-card"
        elevation="4"
      >
        <VCardText class="d-flex align-center justify-space-between pa-6">
          <div class="d-flex flex-column">
            <span class="text-h3 font-weight-bold mb-2 text-primary">{{ summaryData.customers }}</span>
            <span class="text-h6 font-weight-medium text-high-emphasis">Clientes</span>
            <span class="text-body-2 text-medium-emphasis mt-1">Registrados en el sistema</span>
          </div>
          <VAvatar
            size="64"
            class="summary-avatar"
            color="primary"
          >
            <VIcon
              size="32"
              icon="ri-user-3-line"
              color="white"
            />
          </VAvatar>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Número de Materiales -->
    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="summary-card"
        elevation="4"
      >
        <VCardText class="d-flex align-center justify-space-between pa-6">
          <div class="d-flex flex-column">
            <span class="text-h3 font-weight-bold mb-2" style="color: #1565C0;">{{ summaryData.materials }}</span>
            <span class="text-h6 font-weight-medium text-high-emphasis">Materiales</span>
            <span class="text-body-2 text-medium-emphasis mt-1">En inventario</span>
          </div>
          <VAvatar
            size="64"
            class="summary-avatar"
            style="background-color: #1565C0;"
          >
            <VIcon
              size="32"
              icon="ri-box-3-line"
              color="white"
            />
          </VAvatar>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Número de Movimientos -->
    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="summary-card"
        elevation="4"
      >
        <VCardText class="d-flex align-center justify-space-between pa-6">
          <div class="d-flex flex-column">
            <span class="text-h3 font-weight-bold mb-2 text-warning">{{ summaryData.movements }}</span>
            <span class="text-h6 font-weight-medium text-high-emphasis">Movimientos</span>
            <span class="text-body-2 text-medium-emphasis mt-1">Registrados</span>
          </div>
          <VAvatar
            size="64"
            class="summary-avatar"
            color="warning"
          >
            <VIcon
              size="32"
              icon="ri-exchange-line"
              color="white"
            />
          </VAvatar>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- 👉 Filtros y Calificaciones -->
  <VRow class="mb-6">
    <!-- 👉 Filtros Generales -->
    <VCol
      cols="12"
      md="6"
    >
      <VCard title="Filtros Generales">
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="startDate"
                type="date"
                label="Fecha de inicio"
                density="compact"
                clearable
                :max="endDate || undefined"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="endDate"
                type="date"
                label="Fecha de fin"
                density="compact"
                clearable
                :min="startDate || undefined"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Calificaciones de Clientes -->
    <VCol
      cols="12"
      md="6"
    >
      <VCard title="Calificaciones de Clientes">
        <VCardText>
          <CustomerRatingsChart
            :colors="chartJsCustomColors"
            :start-date="startDate"
            :end-date="endDate"
          />
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VRow id="chartjs-wrapper">
    <!-- 👉 Materiales por Categoría -->
    <VCol
      cols="12"
      md="6"
    >
      <VCard title="Materiales por categoría">
        <VCardText>
          <MaterialsByCategoryChart :colors="chartJsCustomColors" />
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Materiales con más salidas -->
    <VCol
      cols="12"
      md="6"
    >
      <VCard title="Materiales con más salidas">
        <VCardText>
          <MaterialsOutputChart
            :colors="chartJsCustomColors"
            :start-date="startDate"
            :end-date="endDate"
          />
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VRow class="match-height">
    <!-- 👉 Resumen de Órdenes -->
    <VCol cols="12">
      <OrdersOverview />
    </VCol>
  </VRow>
</template>

<style lang="scss">
.date-picker-wrapper {
  inline-size: 10.5rem;
}

#chartjs-wrapper {
  .v-card-item__append {
    padding-inline-start: 0;
  }
}

// Estilos para las tarjetas de resumen
.summary-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    
    .summary-avatar {
      transform: scale(1.1) rotate(5deg);
    }
  }
  
  .summary-avatar {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .v-card-text {
    position: relative;
    z-index: 1;
  }
}

// Animación de entrada para las tarjetas
.summary-card {
  animation: slideInUp 0.6s ease-out;
  
  &:nth-child(1) {
    animation-delay: 0.1s;
  }
  
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  &:nth-child(3) {
    animation-delay: 0.3s;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>