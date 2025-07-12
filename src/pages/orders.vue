<script setup>
import { ref, computed, onMounted } from 'vue'
import { $api } from '@/utils/api'
import { useRouter } from 'vue-router'
import CancelOrderDialog from '@/components/fammeba/order/CancelOrderDialog.vue'

// Estados
const orders = ref([])
const totalOrders = ref(0)
const searchQuery = ref('')
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

// Estados para el diálogo de cancelación
const isCancelDialogVisible = ref(false)
const selectedOrder = ref(null)

// Contadores de estado
const widgetData = ref([
  {
    title: 'PENDIENTE',
    value: 0,
    icon: 'ri-calendar-2-line',
    color: '#F9A825'
  },
  {
    title: 'EN_PREPARACION',
    value: 0,
    icon: 'ri-wallet-3-line',
    color: '#40C4FF'
  },
  {
    title: 'ENTREGADO',
    value: 0,
    icon: 'ri-check-double-line',
    color: '#00C853'
  },  
  {
    title: 'CANCELADO',
    value: 0,
    icon: 'ri-error-warning-line',
    color: '#FF5252'
  },
])

// Headers de la tabla
const headers = [
  {
    title: 'Número de Orden',
    key: 'ordernumber',
    sortable: true,
  },
  {
    title: 'Cliente',
    key: 'client',
    sortable: true,
  },
  {
    title: 'Fecha del Pedido',
    key: 'orderdate',
    sortable: true,
  },
  {
    title: 'Fecha de Entrega',
    key: 'deliverydate',
    sortable: true,
  },
  {
    title: 'Estado',
    key: 'status',
    sortable: true,
  },
  {
    title: 'Total',
    key: 'totalprice',
    sortable: true,
  },
  {
    title: 'Acciones',
    key: 'actions',
    sortable: false,
  },
]

// Función para obtener órdenes
const fetchOrders = async () => {
  try {
    const params = new URLSearchParams()
    if (page.value) params.append('page', page.value - 1)
    if (itemsPerPage.value) params.append('size', itemsPerPage.value)
    if (sortBy.value) params.append('sort', `${sortBy.value},${orderBy.value}`)

    const url = `/orders?${params.toString()}`
    console.log('GET /orders:', {
      url,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    const response = await $api(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    console.log('Respuesta del backend:', response)

    // Transformar los datos para incluir el cliente completo
    orders.value = await Promise.all((response.content || []).map(async (order) => {
      try {
        console.log('Procesando orden:', JSON.stringify(order, null, 2))
        // Obtener los datos del cliente
        const clientResponse = await $api(`/clients/${order.clientId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        console.log('Datos del cliente:', JSON.stringify(clientResponse, null, 2))
        return {
          ...order,
          client: clientResponse
        }
      } catch (error) {
        console.error('Error al obtener datos del cliente:', error)
        return {
          ...order,
          client: null
        }
      }
    }))

    console.log('Órdenes procesadas:', JSON.stringify(orders.value, null, 2))
    totalOrders.value = response.totalElements || 0
    updateStatusCounters(orders.value)

    // Mostrar solo los orderId de todos los detalles de todas las órdenes
    const allOrderIds = orders.value.flatMap(order =>
      order.orderDetails.map(detail => detail.orderId)
    )
    console.log('Todos los orderId:', allOrderIds)

  } catch (error) {
    console.error('Error al obtener órdenes:', error)
  }
}

// Función para actualizar contadores
const updateStatusCounters = (ordersList) => {
  // Reiniciar contadores
  widgetData.value = widgetData.value.map(widget => ({
    ...widget,
    value: 0
  }))

  // Contar órdenes por estado
  ordersList.forEach(order => {
    const widget = widgetData.value.find(w => w.title === order.status)
    if (widget) {
      widget.value++
    }
  })
}

// Función para actualizar opciones de la tabla
const updateOptions = options => {
  page.value = options.page
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
  fetchOrders()
}

const filteredOrders = computed(() => {
  if(!searchQuery.value) return orders.value
  const query = searchQuery.value.toLowerCase()
  return orders.value.filter(order => {
    const client = order.client || {}
    const clientName = client.clientType === 'NATURAL' 
      ? `${client.name || ''} ${client.lastname || ''}`.toLowerCase()
      : (client.razonsocial || '').toLowerCase()
    
    return (order.ordernumber || '').toLowerCase().includes(query) ||
           clientName.includes(query) ||
           (order.description || '').toLowerCase().includes(query)
  })
})

const resolveOrderStatusVariant = status => {
  const statusMap = {
    'PENDIENTE': '#F9A825',
    'EN_PREPARACION': '#40C4FF',
    'ENTREGADO': '#00C853',
    'CANCELADO': '#FF5252'
  }
  return statusMap[status] || 'primary'
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(value)
}

const formatDate = (date) => {
  if (!date) return ''
  const [year, month, day] = date.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

// Función para abrir el diálogo de cancelación
const openCancelDialog = (order) => {
  selectedOrder.value = {
    id: order.orderDetails[0].orderId,
    ordernumber: order.ordernumber
  }
  isCancelDialogVisible.value = true
}

// Función para manejar la cancelación de la orden
const handleOrderCancelled = () => {
  fetchOrders()
}

// Cargar datos al montar el componente
onMounted(() => {
  fetchOrders()
})

const handleOrderUpdated = () => {
  console.log('Pedido actualizado exitosamente')
}

// Función para calcular la paginación
const paginationMeta = ({ page, itemsPerPage }, total) => {
  const start = (page - 1) * itemsPerPage + 1
  const end = Math.min(page * itemsPerPage, total)
  return `${start}-${end} de ${total}`
}

// Funciones de utilidad para el cliente
const getClientInitial = (client) => {
  if (!client) return '?'
  if (client.clientType === 'NATURAL') {
    return (client.name?.[0] || '') + (client.lastname?.[0] || '')
  }
  return client.razonsocial?.split(' ').map(word => word.charAt(0)).slice(0, 2).join('') || '?'
}

const getClientName = (client) => {
  if (!client) return 'Cliente no disponible'
  if (client.clientType === 'NATURAL') {
    return `${client.name || ''} ${client.lastname || ''}`.trim() || 'Cliente sin nombre'
  }
  return client.razonsocial || 'Cliente sin razón social'
}

// Función para resolver el color del avatar según el tipo de cliente
const resolveClientTypeColor = type => {
  if (type === 'NATURAL') return '#1565C0'
  if (type === 'JURIDICO') return '#AB47BC'
  return 'primary'
}

const router = useRouter()
</script>

<template>

<VCard class="mb-6">
      <VCardText class="px-2">
        <VRow>
          <template
            v-for="(data, index) in widgetData"
            :key="index"
          >
            <VCol
              cols="12"
              sm="6"
              md="3"
              class="px-6"
            >
              <div
                class="d-flex justify-space-between"
                :class="$vuetify.display.xs
                  ? index !== widgetData.length - 1 ? 'border-b pb-4' : ''
                  : $vuetify.display.sm
                    ? index < (widgetData.length / 2) ? 'border-b pb-4' : ''
                    : ''"
              >
                <div class="d-flex flex-column">
                  <h4 class="text-h4">
                    {{ data.value }}
                  </h4>
                  <span class="text-base text-capitalize">
                    {{ data.title.replace('_', ' ') }}
                  </span>
                </div>

                <VAvatar
                  variant="tonal"
                  rounded
                  size="42"
                  :style="{ backgroundColor: data.color + '20' }"
                >
                  <VIcon
                    :icon="data.icon"
                    size="26"
                    :style="{ color: data.color }"
                  />
                </VAvatar>
              </div>
            </VCol>
            <VDivider
              v-if="$vuetify.display.mdAndUp ? index !== widgetData.length - 1
                : $vuetify.display.smAndUp ? index % 2 === 0
                  : false"
              vertical
              inset
              length="60"
            />
          </template>
        </VRow>
      </VCardText>
    </VCard>


  <VCard class="mb-6">
    <VCardText class="d-flex flex-wrap gap-4 align-center">
      <!-- 👉 Export buttons eliminados -->
      <VSpacer />
      <div class="d-flex align-center gap-4 flex-wrap">
        <!-- 👉 Search  -->
        <div class="app-user-search-filter">
          <VTextField
            v-model="searchQuery"
            placeholder="Buscar Orden"
            density="compact"
            prepend-inner-icon="ri-search-line"
          />
        </div>

        <!-- 👉 Add order button -->
        <VBtn 
          prepend-icon="ri-add-line"
          :to="{ name: 'order-add-new-order' }"
          v-if="isPermission('CREATE_ONE_ORDER')"
        >
          Añadir Orden
        </VBtn>
      </div>
    </VCardText>

    <VDataTableServer
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :items="filteredOrders"
      :items-length="totalOrders"
      :headers="headers"
      class="text-no-wrap"
      @update:options="updateOptions"
    >
      <!-- Número de Orden -->
      <template #item.ordernumber="{ item }">
        <span class="font-weight-medium">{{ item.ordernumber }}</span>
      </template>

      <!-- Cliente -->
      <template #item.client="{ item }">
        <div class="d-flex align-center">
          <VAvatar
            size="34"
            variant="tonal"
            :color="resolveClientTypeColor(item.client?.clientType)"
            class="me-3"
          >
            <span>
              {{ item.client?.clientType === 'NATURAL' 
                ? (item.client?.name?.charAt(0) || '') + (item.client?.lastname?.charAt(0) || '')
                : (item.client?.razonsocial?.split(' ').map(word => word.charAt(0)).slice(0, 2).join('') || '') }}
            </span>
          </VAvatar>

          <div class="d-flex flex-column">
            <span class="text-base font-weight-medium">
              {{ item.client?.clientType === 'NATURAL' 
                ? `${item.client?.name || ''} ${item.client?.lastname || ''}`
                : item.client?.razonsocial || 'Cliente no disponible' }}
            </span>
          </div>
        </div>
      </template>

      <!-- Fecha del Pedido -->
      <template #item.orderdate="{ item }">
        <span>{{ formatDate(item.orderdate) }}</span>
      </template>

      <!-- Fecha de Entrega -->
      <template #item.deliverydate="{ item }">
        <span>{{ formatDate(item.deliverydate) }}</span>
      </template>

      <!-- Estado -->
      <template #item.status="{ item }">
        <VChip
          :style="{ backgroundColor: resolveOrderStatusVariant(item.status) + '20', color: resolveOrderStatusVariant(item.status) }"
          size="small"
          class="text-capitalize"
        >
          {{ item.status.replace('_', ' ') }}
        </VChip>
      </template>

      <!-- Total -->
      <template #item.totalprice="{ item }">
        <span>{{ formatCurrency(item.totalprice) }}</span>
      </template>

      <!-- Acciones -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <!-- Botón Editar (solo si no está cancelada) -->
          <VTooltip location="top" v-if="item.status !== 'CANCELADO'">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                @click="$router.push(`/orders/edit/${item.orderDetails[0].orderId}`)"
                v-if="isPermission('UPDATE_ONE_ORDER')"
              >
                <VIcon icon="ri-pencil-line" />
              </IconBtn>
            </template>
            <span>Editar orden</span>
          </VTooltip>

          <!-- Botón Ver Detalles (siempre visible) -->
          <VTooltip location="top">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                @click="$router.push(`/orders/detail/${item.orderDetails[0].orderId}`)"
                v-if="isPermission('READ_ONE_ORDER')"
              >
                <VIcon icon="ri-eye-line" />
              </IconBtn>
            </template>
            <span>Ver detalles</span>
          </VTooltip>

          <!-- Botón Cancelar (solo si no está cancelada) -->
          <VTooltip location="top">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                color="error"
                @click="openCancelDialog(item)"
                v-if="item.status !== 'CANCELADO' && isPermission('CANCEL_ONE_ORDER')"
              >
                <VIcon icon="ri-close-circle-line" />
              </IconBtn>
            </template>
            <span>Cancelar orden</span>
          </VTooltip>
        </div>
      </template>

      <!-- Paginación -->
      <template #bottom>
        <VDivider />

        <div class="d-flex justify-end flex-wrap gap-x-6 px-2 py-1">
          <div class="d-flex align-center gap-x-2 text-medium-emphasis text-base">
            Filas por página:
            <VSelect
              v-model="itemsPerPage"
              class="per-page-select"
              variant="plain"
              :items="[10, 20, 25, 50, 100]"
            />
          </div>

          <p class="d-flex align-center text-base text-high-emphasis me-2 mb-0">
            {{ paginationMeta({ page, itemsPerPage }, totalOrders) }}
          </p>

          <div class="d-flex gap-x-2 align-center me-2">
            <VBtn
              class="flip-in-rtl"
              icon="ri-arrow-left-s-line"
              variant="text"
              density="comfortable"
              color="high-emphasis"
              :disabled="page <= 1"
              @click="page <= 1 ? page = 1 : page--"
            />

            <VBtn
              class="flip-in-rtl"
              icon="ri-arrow-right-s-line"
              density="comfortable"
              variant="text"
              color="high-emphasis"
              :disabled="page >= Math.ceil(totalOrders / itemsPerPage)"
              @click="page >= Math.ceil(totalOrders / itemsPerPage) ? page = Math.ceil(totalOrders / itemsPerPage) : page++"
            />
          </div>
        </div>
      </template>
    </VDataTableServer>
  </VCard>

  <!-- Diálogo de Cancelación -->
  <CancelOrderDialog
    v-model:is-dialog-visible="isCancelDialogVisible"
    :order-data="selectedOrder"
    @order-cancelled="handleOrderCancelled"
  />
</template>

<style lang="scss" scoped>
.app-user-search-filter {
  inline-size: 15.625rem;
}
</style>