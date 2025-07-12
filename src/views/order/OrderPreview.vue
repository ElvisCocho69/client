<script setup>
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, watch } from 'vue'
import { $api } from '@/utils/api'
import InvoiceSendInvoiceDrawer from '@/views/order/InvoiceSendInvoiceDrawer.vue'

const route = useRoute()
const router = useRouter()
const orderData = ref(null)
const clientData = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchOrderData = async () => {
  try {
    const tempOrderData = localStorage.getItem('tempOrderData')
    if (!tempOrderData) {
      throw new Error('No hay datos de orden para mostrar')
    }
    const parsedData = JSON.parse(tempOrderData)
    orderData.value = parsedData

    // Obtener los datos del cliente seleccionado
    if (parsedData.clientId) {
      const response = await $api(`/clients/${parsedData.clientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      clientData.value = response
    }
  } catch (err) {
    error.value = err.message || 'Error al cargar los datos de la orden'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

// Agregar watcher para cambios en localStorage
watch(() => localStorage.getItem('tempOrderData'), (newValue) => {
  if (newValue) {
    try {
      const parsedData = JSON.parse(newValue)
      orderData.value = parsedData
      // Actualizar datos del cliente si cambió el clientId
      if (parsedData.clientId && (!clientData.value || clientData.value.id !== parsedData.clientId)) {
        fetchClientData(parsedData.clientId)
      }
    } catch (err) {
      console.error('Error al actualizar datos:', err)
    }
  }
}, { deep: true })

// Extraer la lógica de obtener datos del cliente a una función separada
const fetchClientData = async (clientId) => {
  try {
    const response = await $api(`/clients/${clientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    clientData.value = response
  } catch (err) {
    console.error('Error al obtener datos del cliente:', err)
  }
}

onMounted(() => {
  fetchOrderData()
})

const goBack = () => {
  localStorage.removeItem('tempOrderData')
  router.back()
}

const goToEdit = () => {
  router.push({ name: 'order-add-new-order' })
}

const downloadPDF = () => {
  // TODO: Implementar descarga de PDF
  console.log('Descargar PDF')
}

const isSendPaymentSidebarVisible = ref(false)

// Función simple de impresión
const printOrder = () => {
  window.print()
}

// Calcular totales
const calculateSubtotal = computed(() => {
  if (!orderData.value?.orderDetails) return 0
  return orderData.value.orderDetails.reduce((total, detail) => {
    return total + (detail.quantity * detail.unitprice)
  }, 0)
})

const calculateIGV = computed(() => calculateSubtotal.value * 0.18)
const calculateTotal = computed(() => calculateSubtotal.value * 1.18)
</script>

<template>
  <VRow>
    <!-- 👉 Order Preview Content -->
    <VCol cols="12" md="9">
      <VCard class="order-preview-wrapper pa-sm-12 pa-6">
        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-center align-center pa-6">
          <VProgressCircular indeterminate />
        </div>

        <!-- Error State -->
        <VAlert
          v-if="error"
          type="error"
          class="ma-4"
        >
          {{ error }}
        </VAlert>

        <!-- Content -->
        <template v-if="orderData && !loading">
          <!-- Header Section -->
          <div class="order-header-preview d-flex flex-wrap justify-space-between align-sm-center flex-column flex-sm-row print-row bg-var-theme-background gap-6 rounded pa-6 mb-6">
            <!-- Left Content -->
            <div>
              <div class="app-logo mb-6">
                <VNodeRenderer :nodes="themeConfig.app.logo" />
                <h1 class="app-logo-title">
                  {{ themeConfig.app.title }}
                </h1>
              </div>

              <!-- Address -->
              <p class="text-high-emphasis mb-0 text-body-1">
                Oficina 237, Av. América Sur 1234, Urb. La Merced
              </p>
              <p class="text-high-emphasis mb-0 text-body-1">
                Trujillo, La Libertad 13007, Perú
              </p>
              <p class="text-high-emphasis mb-0 text-body-1">
                +51 44 123 4567, +51 944 987 654
              </p>
            </div>

            <!-- Right Content -->
            <div class="d-flex gap-2 flex-column">
              <!-- Order Number -->
              <div class="d-flex align-start align-sm-center font-weight-medium justify-sm-end flex-column flex-sm-row text-lg">
                <span class="text-high-emphasis me-4" style="inline-size: 5.625rem;">Pedido</span>
                <span class="text-h6">#{{ orderData.ordernumber }}</span>
              </div>

              <!-- Order Date -->
              <div class="d-flex align-start align-sm-center justify-sm-end flex-column flex-sm-row">
                <span class="text-high-emphasis me-4" style="inline-size: 7rem;">Fecha Pedido:</span>
                <span class="text-body-1">{{ orderData.orderdate }}</span>
              </div>

              <!-- Delivery Date -->
              <div class="d-flex align-start align-sm-center justify-sm-end flex-column flex-sm-row">
                <span class="text-high-emphasis me-4" style="inline-size: 7rem;">Fecha Entrega:</span>
                <span class="text-body-1">{{ orderData.deliverydate || 'No especificada' }}</span>
              </div>
            </div>
          </div>

          <!-- Client Section -->
          <div class="mb-6">
            <h6 class="text-h6 mb-4">Datos del Cliente:</h6>
            <div v-if="clientData" class="pa-4 rounded bg-var-theme-background">
              <p class="mb-2 text-body-1">
                <strong>Cliente:</strong> 
                {{ clientData.clientType === 'NATURAL' 
                  ? `${clientData.name} ${clientData.lastname}`
                  : clientData.razonsocial }}
              </p>
              <p class="mb-2 text-body-1">
                <strong>Dirección:</strong> {{ clientData.address }}
              </p>
              <p class="mb-2 text-body-1">
                <strong>Documento:</strong> 
                {{ clientData.clientType === 'NATURAL' ? 'DNI' : 'RUC' }}: 
                {{ clientData.documentnumber }}
              </p>
              <p class="mb-2 text-body-1">
                <strong>Contacto:</strong> {{ clientData.contact }}
              </p>
              <p class="mb-0 text-body-1">
                <strong>Email:</strong> {{ clientData.email }}
              </p>
            </div>
            <div v-else class="pa-4 rounded bg-var-theme-background">
              <p class="text-body-1 mb-0">No se ha seleccionado un cliente</p>
            </div>
          </div>

          <!-- Description and Special Notes -->
          <div class="mb-6">
            <VRow>
              <VCol cols="12" md="6">
                <div class="pa-4 rounded bg-var-theme-background">
                  <h6 class="text-h6 mb-2">Descripción:</h6>
                  <p class="text-body-1 mb-0">{{ orderData.description || 'Sin descripción' }}</p>
                </div>
              </VCol>
              <VCol cols="12" md="6">
                <div class="pa-4 rounded bg-var-theme-background">
                  <h6 class="text-h6 mb-2">Notas Especiales:</h6>
                  <p class="text-body-1 mb-0">{{ orderData.specialnotes || 'Sin notas especiales' }}</p>
                </div>
              </VCol>
            </VRow>
          </div>

          <!-- Order Details Table -->
          <div class="mb-6">
            <h6 class="text-h6 mb-4">Detalles de la Orden:</h6>
            <VTable>
              <thead>
                <tr>
                  <th>Estructura</th>
                  <th>Descripción</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-end">Precio Unit.</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(detail, index) in orderData.orderDetails" :key="index">
                  <td>{{ detail.structure.name }}</td>
                  <td>{{ detail.structure.description }}</td>
                  <td class="text-center">{{ detail.quantity }}</td>
                  <td class="text-end">S/. {{ detail.unitprice.toFixed(2) }}</td>
                  <td class="text-end">S/. {{ (detail.quantity * detail.unitprice).toFixed(2) }}</td>
                </tr>
              </tbody>
            </VTable>
          </div>

          <!-- 👉 Total Amount -->
          <div class="d-flex justify-space-between flex-wrap flex-column flex-sm-row print-row">
            <div class="mb-6 mb-sm-0">
              <h6 class="text-h6 mb-4">Estado del Pedido:</h6>
              <VChip
                :color="orderData.status === 'PENDIENTE' ? 'warning' : 
                       orderData.status === 'EN_PREPARACION' ? 'info' :
                       orderData.status === 'ENTREGADO' ? 'success' : 'error'"
                class="text-capitalize"
              >
                {{ orderData.status.toLowerCase().replace('_', ' ') }}
              </VChip>
            </div>

            <div>
              <table class="w-100">
                <tbody>
                  <tr>
                    <td class="pe-16 text-body-1">Subtotal:</td>
                    <td class="text-end">
                      <h6 class="text-h6">S/. {{ calculateSubtotal.toFixed(2) }}</h6>
                    </td>
                  </tr>
                  <tr>
                    <td class="pe-16 text-body-1">IGV (18%):</td>
                    <td class="text-end">
                      <h6 class="text-h6">S/. {{ calculateIGV.toFixed(2) }}</h6>
                    </td>
                  </tr>
                </tbody>
              </table>

              <VDivider class="my-2" />

              <table class="w-100">
                <tbody>
                  <tr>
                    <td class="pe-16 text-body-1">Total:</td>
                    <td class="text-end">
                      <h6 class="text-h6">S/. {{ calculateTotal.toFixed(2) }}</h6>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </VCard>
    </VCol>

    <!-- 👉 Right Column: Order Actions -->
    <VCol
      cols="12"
      md="3"
      class="d-print-none"
    >
      <VCard>
        <VCardText>
          <!-- 👉 Edit -->
          <VBtn
            block
            color="primary"
            class="mb-4"
            prepend-icon="ri-edit-line"
            @click="goToEdit"
          >
            Editar Orden
          </VBtn>

          <!-- 👉 Download -->
          <VBtn
            block
            color="secondary"
            variant="outlined"
            class="mb-4"
            prepend-icon="ri-download-line"
            @click="downloadPDF"
          >
            Descargar PDF
          </VBtn>

          <div class="d-flex flex-wrap gap-4">
            <VBtn
              variant="outlined"
              color="secondary"
              class="flex-grow-1"
              prepend-icon="ri-printer-line"
              @click="printOrder"
            >
              Imprimir
            </VBtn>

            <VBtn
              color="secondary"
              variant="outlined"
              class="flex-grow-1"
              prepend-icon="ri-send-plane-fill"
              @click="isSendPaymentSidebarVisible = true"
            >
              Enviar
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- 👉 Send Invoice Sidebar -->
  <InvoiceSendInvoiceDrawer v-model:isDrawerOpen="isSendPaymentSidebarVisible" />
</template>

<style lang="scss">
.order-preview-table {
  --v-table-header-color: var(--v-theme-surface);

  &.v-table .v-table__wrapper table thead tr th {
    border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  }
}

@media print {
  @page {
    size: A4;
    margin: 10mm;
  }

  body {
    background: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    width: 100% !important;
    margin: 0 !important;
  }

  // Mantener el diseño de columnas
  .v-row {
    display: flex !important;
    flex-wrap: wrap !important;
    margin: 0 !important;
  }

  .v-col-12 {
    flex: 0 0 100% !important;
  }

  .v-col-md-6 {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }

  .v-col-md-9 {
    flex: 0 0 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
  }

  // Mantener el diseño de flex
  .d-flex.flex-wrap {
    display: flex !important;
    flex-wrap: wrap !important;
  }

  // Ajustar espaciado y márgenes
  .order-header-preview,
  .order-preview-wrapper {
    padding: 10px !important;
    margin: 0 !important;
    width: 100% !important;
  }

  .v-card {
    margin: 0 !important;
    padding: 10px !important;
    width: 100% !important;
    box-shadow: none !important;
  }

  // Mantener los estilos de texto y colores
  .text-body-1 {
    margin-bottom: 0.25rem !important;
    line-height: 1.4 !important;
    color: black !important;
  }

  .text-h6 {
    color: black !important;
    margin-bottom: 0.5rem !important;
  }

  // Ajustar tabla y chips
  .v-table {
    width: 100% !important;
    margin-bottom: 1rem !important;
    
    th, td {
      padding: 4px 8px !important;
      color: black !important;
    }
  }

  .v-chip {
    margin: 0 !important;
    padding: 0 8px !important;
    height: 24px !important;
    border: 1px solid currentColor !important;
    color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  // Asegurar que los colores y fondos se impriman
  .bg-var-theme-background {
    background-color: #f5f5f5 !important;
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }

  // Mantener los colores de los estados
  .v-chip.warning {
    background-color: #FFF3E0 !important;
    color: #F57C00 !important;
  }
  .v-chip.info {
    background-color: #E3F2FD !important;
    color: #1976D2 !important;
  }
  .v-chip.success {
    background-color: #E8F5E9 !important;
    color: #2E7D32 !important;
  }
  .v-chip.error {
    background-color: #FFEBEE !important;
    color: #D32F2F !important;
  }

  // Ocultar elementos innecesarios para impresión
  .v-navigation-drawer,
  .layout-vertical-nav,
  .app-customizer-toggler,
  .layout-footer,
  .layout-navbar,
  .layout-navbar-and-nav-container,
  .d-print-none {
    display: none !important;
  }

  // Ajustes adicionales
  .layout-content-wrapper {
    padding: 0 !important;
  }

  .v-table__wrapper {
    overflow: hidden !important;
  }

  // Asegurar que los elementos flex mantengan su dirección
  .print-row {
    flex-direction: row !important;
  }
}
</style>

<style scoped>
.app-logo {
  display: flex;
  align-items: center;
  column-gap: 0.5rem;

  .app-logo-title {
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.27px;
    line-height: 1.5rem;
    text-transform: capitalize;
  }
}
</style>