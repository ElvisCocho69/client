<script setup>
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { $api } from '@/utils/api'
import AddDesignDialog from '@/components/fammeba/order/AddDesignDialog.vue'
import ViewDesignDialog from '@/components/fammeba/order/ViewDesignDialog.vue'
import EditDesignDialog from '@/components/fammeba/order/EditDesignDialog.vue'
import ViewProgressDialog from '@/components/fammeba/order/ViewProgressDialog.vue'

const route = useRoute()
const router = useRouter()
const orderData = ref(null)
const clientData = ref(null)
const loading = ref(true)
const error = ref(null)

// Variables para los modales de diseño
const isDesignDialogVisible = ref(false)
const isViewDesignDialogVisible = ref(false)
const isEditDesignDialogVisible = ref(false)
const isViewProgressDialogVisible = ref(false)
const selectedStructureId = ref(null)
const selectedDesign = ref(null)
const structureDesigns = ref({}) // Almacenará los diseños por estructura

const checkDesignExists = async (structureId) => {
  try {
    const response = await $api(`/designs/structure/${structureId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    structureDesigns.value[structureId] = response
    return true
  } catch (err) {
    structureDesigns.value[structureId] = null
    return false
  }
}

const openDesignDialog = (structureId) => {
  selectedStructureId.value = structureId
  isDesignDialogVisible.value = true
}

const openViewDesignDialog = async (structureId) => {
  try {
    const response = await $api(`/designs/structure/${structureId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    selectedDesign.value = response
    isViewDesignDialogVisible.value = true
  } catch (err) {
    console.error('Error al cargar el diseño:', err)
  }
}

const openEditDesignDialog = async (structureId) => {
  try {
    const response = await $api(`/designs/structure/${structureId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    selectedDesign.value = response
    isEditDesignDialogVisible.value = true
  } catch (err) {
    console.error('Error al cargar el diseño:', err)
  }
}

const openViewProgressDialog = async (structureId) => {
  try {
    const response = await $api(`/designs/structure/${structureId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    selectedDesign.value = response
    isViewProgressDialogVisible.value = true
  } catch (err) {
    console.error('Error al cargar el progreso:', err)
  }
}

const handleDesignAdded = async () => {
  try {
    // Recargar los datos de la orden después de agregar un diseño
    await fetchOrderData()
  } catch (error) {
    console.error('Error al actualizar los diseños:', error)
  }
}

const handleDesignUpdated = async () => {
  // Recargar los datos de la orden después de actualizar un diseño
  await fetchOrderData()
}

const fetchOrderData = async () => {
  try {
    const orderId = route.params.id
    if (!orderId) {
      throw new Error('No se proporcionó un ID de orden')
    }

    const response = await $api(`/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    orderData.value = response

    // Obtener los datos del cliente seleccionado
    if (response.clientId) {
      const clientResponse = await $api(`/clients/${response.clientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      clientData.value = clientResponse
    }

    // Verificar diseños para cada estructura
    if (response.orderDetails) {
      for (const detail of response.orderDetails) {
        await checkDesignExists(detail.structure.id)
      }
    }
  } catch (err) {
    error.value = err.message || 'Error al cargar los datos de la orden'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrderData()
})

const goBack = () => {
  router.back()
}

const goToEdit = () => {
  router.push(`/orders/edit/${orderData.value.orderDetails[0].orderId}`)
}

const downloadPDF = () => {
  // TODO: Implementar descarga de PDF
  console.log('Descargar PDF')
}

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

const formatDate = (dateString) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}
</script>

<template>
  <VRow>
    <!-- 👉 Order Detail Content -->
    <VCol cols="12" md="9">
      <VCard class="order-detail-wrapper pa-sm-12 pa-6">
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
          <div class="order-header-detail d-flex flex-wrap justify-space-between align-sm-center flex-column flex-sm-row print-row bg-var-theme-background gap-6 rounded pa-6 mb-6">
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
                <span class="text-body-1">{{ formatDate(orderData.orderdate) }}</span>
              </div>

              <!-- Delivery Date -->
              <div class="d-flex align-start align-sm-center justify-sm-end flex-column flex-sm-row">
                <span class="text-high-emphasis me-4" style="inline-size: 7rem;">Fecha Entrega:</span>
                <span class="text-body-1">{{ formatDate(orderData.deliverydate) }}</span>
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

          <!-- Structure Details -->
          <div class="mb-6" v-if="orderData?.orderDetails?.length > 0">
            <h6 class="text-h6 mb-4">Datos de las Estructuras:</h6>
            <div 
              v-for="(detail, index) in orderData.orderDetails" 
              :key="detail.structure.id"
              class="pa-4 rounded bg-var-theme-background mb-4 structure-item"
            >
              <h6 class="text-h6 mb-2">Estructura {{ index + 1 }}</h6>
              <div class="d-flex flex-wrap">
                <VCol cols="12" md="6">
                  <p class="mb-2 text-body-1">
                    <strong>Nombre:</strong> {{ detail.structure.name }}
                  </p>
                  <p class="mb-2 text-body-1">
                    <strong>Descripción:</strong> {{ detail.structure.description }}
                  </p>
                  <p class="mb-2 text-body-1">
                    <strong>Colores:</strong> {{ detail.structure.colors }}
                  </p>
                  <p class="mb-2 text-body-1">
                    <strong>Materiales:</strong> {{ detail.structure.materials }}
                  </p>
                </VCol>
                <VCol cols="12" md="6">
                  <p class="mb-2 text-body-1">
                    <strong>Cantidad:</strong> {{ detail.quantity }}
                  </p>
                  <p class="mb-2 text-body-1">
                    <strong>Precio Unitario:</strong> S/. {{ detail.unitprice.toFixed(2) }}
                  </p>
                  <p class="mb-2 text-body-1">
                    <strong>Subtotal:</strong> S/. {{ (detail.quantity * detail.unitprice).toFixed(2) }}
                  </p>
                </VCol>
              </div>
              <div class="mt-2">
                <p class="mb-2 text-body-1">
                  <strong>Fecha de Inicio:</strong> {{ formatDate(detail.structure.startdate) || 'No especificada' }}
                </p>
                <p class="mb-0 text-body-1">
                  <strong>Fecha Estimada de Fin:</strong> {{ formatDate(detail.structure.estimatedenddate) || 'No especificada' }}
                </p>
                <p v-if="detail.structure.observations" class="mb-0 text-body-1 mt-2">
                  <strong>Observaciones:</strong> {{ detail.structure.observations }}
                </p>
              </div>
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
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="detail in orderData.orderDetails" :key="detail.structure.id">
                  <td>{{ detail.structure.name }}</td>
                  <td>{{ detail.structure.description }}</td>
                  <td class="text-center">{{ detail.quantity }}</td>
                  <td class="text-end">S/. {{ detail.unitprice.toFixed(2) }}</td>
                  <td class="text-end">S/. {{ (detail.quantity * detail.unitprice).toFixed(2) }}</td>
                  <td class="text-center">
                    <div class="d-flex justify-center gap-2">
                      
                      <VTooltip location="top">
                        <template #activator="{ props }">
                          <span v-bind="props">
                            <VBtn
                              icon
                              variant="text"
                              :color="structureDesigns[detail.structure.id] ? '#0D47A1' : 'primary'"
                              size="small"
                              @click="structureDesigns[detail.structure.id] ? openEditDesignDialog(detail.structure.id) : openDesignDialog(detail.structure.id)"
                            >
                              <VIcon :icon="structureDesigns[detail.structure.id] ? 'ri-edit-line' : 'ri-file-add-line'" />
                            </VBtn>
                          </span>
                        </template>
                        <span>{{ structureDesigns[detail.structure.id] ? 'Editar Diseño' : 'Agregar Diseño' }}</span>
                      </VTooltip>

                      <VTooltip v-if="structureDesigns[detail.structure.id]" location="top">
                        <template #activator="{ props }">
                          <span v-bind="props">
                            <VBtn
                              icon
                              variant="text"
                              color="#004D40"
                              size="small"
                              @click="openViewDesignDialog(detail.structure.id)"
                            >
                              <VIcon icon="ri-eye-line" />
                            </VBtn>
                          </span>
                        </template>
                        <span>Ver Diseño</span>
                      </VTooltip>

                      <VTooltip v-if="structureDesigns[detail.structure.id]" location="top">
                        <template #activator="{ props }">
                          <span v-bind="props">
                            <VBtn
                              icon
                              variant="text"
                              color="#1976D2"
                              size="small"
                              @click="$router.push({ name: 'milestones', params: { structureId: detail.structure.id } })"
                            >
                              <VIcon icon="ri-progress-5-line" />
                            </VBtn>
                          </span>
                        </template>
                        <span>Ver Línea de Tiempo</span>
                      </VTooltip>
                  </div>
                </td>
              </tr>
              </tbody>
            </VTable>
          </div>

          <!-- 👉 Total Amount -->
          <div class="d-flex justify-space-between flex-wrap flex-column flex-sm-row print-row">
            <div class="mb-6 mb-sm-0">
              <h6 class="text-h6 mb-4">Estado del Pedido:</h6>
              <VChip
                v-if="orderData.status"
                :color="orderData.status === 'PENDIENTE' ? '#F9A825' : 
                       orderData.status === 'EN_PREPARACION' ? '#40C4FF' :
                       orderData.status === 'ENTREGADO' ? '#00C853' : 'error'"
                class="text-capitalize"
              >
                {{ orderData.status.toLowerCase().replace('_', ' ') }}
              </VChip>
              <span v-else>No definido</span>

              <!-- Razón de Cancelación -->
              <div v-if="orderData.status === 'CANCELADO' && orderData.cancellationreason" class="mt-4">
                <p class="text-body-1 mb-0 mt-10">
                  <strong>Razón de Cancelación:</strong> {{ orderData.cancellationreason }}
                </p>
              </div>
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
          <!-- 👉 Actions -->
          <div class="d-flex flex-column gap-4">
            <!-- Botón Editar (solo si no está cancelada) -->
            <VBtn
              v-if="orderData && orderData.status !== 'CANCELADO'"
              block
              color="primary"
              prepend-icon="ri-pencil-line"
              @click="$router.push(`/orders/edit/${route.params.id}`)"
            >
              Editar Orden
            </VBtn>

            <!-- Botón Imprimir (siempre visible) -->
            <VBtn
              block
              variant="outlined"
              color="secondary"
              prepend-icon="ri-printer-line"
              @click="printOrder"
            >
              Imprimir Orden
            </VBtn>

            <!-- Botón Volver -->
            <VBtn
              block
              variant="outlined"
              prepend-icon="ri-arrow-left-line"
              @click="$router.push('/orders')"
            >
              Volver a Órdenes
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Modales -->
  <AddDesignDialog
    v-model:isDialogVisible="isDesignDialogVisible"
    :structure-id="selectedStructureId"
    @design-added="handleDesignAdded"
  />

  <ViewDesignDialog
    v-model:isDialogVisible="isViewDesignDialogVisible"
    :design="selectedDesign"
  />

  <EditDesignDialog
    v-model:is-dialog-visible="isEditDesignDialogVisible"
    :design="selectedDesign"
    @design-updated="handleDesignUpdated"
  />

  <ViewProgressDialog
    v-model:is-dialog-visible="isViewProgressDialogVisible"
    :design="selectedDesign"
  />
</template>

<style lang="scss">
.order-detail-table {
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

  // Mantener el diseño de flex en la estructura
  .d-flex.flex-wrap {
    display: flex !important;
    flex-wrap: wrap !important;
  }

  // Asegurar que los elementos dentro de la estructura mantengan su layout
  .structure-item {
    .d-flex.flex-wrap > .v-col-md-6 {
      flex: 0 0 50% !important;
      max-width: 50% !important;
      padding: 8px !important;
    }
  }

  // Ajustar espaciado y márgenes
  .order-header-detail,
  .order-detail-wrapper {
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
  }

  // Resto de los estilos existentes...
  .v-navigation-drawer,
  .layout-vertical-nav,
  .app-customizer-toggler,
  .layout-footer,
  .layout-navbar,
  .layout-navbar-and-nav-container,
  .d-print-none {
    display: none !important;
  }

  // Asegurar que los colores y fondos se impriman
  .v-chip {
    border: 1px solid currentColor !important;
    color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  .bg-var-theme-background {
    background-color: #f5f5f5 !important;
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }

  // Ajustar márgenes y espaciado
  .mb-6 {
    margin-bottom: 1.5rem !important;
  }

  .pa-4 {
    padding: 1rem !important;
  }

  // Forzar el contenido a permanecer junto
  .order-detail-wrapper {
    page-break-inside: avoid;
  }

  // Asegurar que las estructuras no se corten entre páginas
  .structure-item {
    page-break-inside: avoid;
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

/* Agregar clase para las estructuras */
.structure-item {
  break-inside: avoid;
}
</style> 