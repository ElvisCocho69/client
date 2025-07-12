<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { $api } from '@/utils/api'
import AddNewRating from '@/components/fammeba/feedback/AddNewRating.vue'

// Estados
const orders = ref([])
const totalOrders = ref(0)
const ratingDialog = ref(false)
const viewRatingDialog = ref(false)
const selectedOrder = ref(null)
const selectedRating = ref({})
const rating = ref({
  rating: 0,
  comment: '',
  orderId: null
})
const searchQuery = ref('')

// Data table options
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()
const selectedRows = ref([])

// Headers de la tabla
const headers = [
  {
    title: 'Número de Orden',
    key: 'ordernumber',
    sortable: true,
  },
  {
    title: 'Fecha de Orden',
    key: 'createdAt',
    sortable: true,
  },
  {
    title: 'Fecha de Entrega',
    key: 'deliveryDate',
    sortable: true,
  },
  {
    title: 'Estado',
    key: 'status',
    sortable: true,
  },
  {
    title: 'Calificación',
    key: 'rating',
    sortable: true,
  },
  {
    title: 'Acciones',
    key: 'actions',
    sortable: false,
  },
]

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

// Computed properties
const filteredOrders = computed(() => {
  console.log('Filtrando órdenes:', orders.value)
  return orders.value
})

const loadOrders = async () => {
  try {
    const params = new URLSearchParams()
    if (page.value) params.append('page', page.value - 1)
    if (itemsPerPage.value) params.append('size', itemsPerPage.value)
    if (sortBy.value) params.append('sort', `${sortBy.value},${orderBy.value}`)

    const response = await $api(`/client/orders?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    orders.value = response.content || []
    totalOrders.value = response.totalElements || 0
  } catch (error) {
    console.error('Error al cargar órdenes:', error)
    showSnackbar('Error al cargar las órdenes', 'error')
  }
}

const openRatingDialog = (order) => {
  selectedOrder.value = order
  ratingDialog.value = true
}

const handleRatingRegistered = () => {
  loadOrders()
}

const submitRating = async () => {
  try {
    await $api('/ratings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(rating.value)
    })
    showSnackbar('Calificación guardada exitosamente')
    ratingDialog.value = false
    loadOrders()
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Error al guardar la calificación', 'error')
  }
}

const viewRating = (rating) => {
  selectedRating.value = rating
  selectedOrder.value = orders.value.find(order => order.id === rating.orderId)
  viewRatingDialog.value = true
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

const getStatusColor = (status) => {
  const colors = {
    'PENDIENTE': '#F9A825',
    'EN_PREPARACION': '#40C4FF',
    'ENTREGADO': '#00C853',
    'CANCELADO': '#FF5252'
  }
  return colors[status] || 'grey'
}

// Función para actualizar opciones de la tabla
const updateOptions = options => {
  page.value = options.page
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
  loadOrders()
}

// Función para calcular la paginación
const paginationMeta = ({ page, itemsPerPage }, total) => {
  const start = (page - 1) * itemsPerPage + 1
  const end = Math.min(page * itemsPerPage, total)
  return `${start}-${end} de ${total}`
}

// Agregar un watcher para depurar cambios en orders
watch(orders, (newOrders) => {
  console.log('Órdenes actualizadas:', newOrders)
}, { deep: true })

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <VCard class="mb-6">
    <VCardItem class="pb-4">
      <VCardTitle>Mis Órdenes</VCardTitle>
    </VCardItem>

    <VDivider />

    <VDataTableServer
      v-model:model-value="selectedRows"
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :items="orders"
      item-value="id"
      :items-length="totalOrders"
      :headers="headers"
      show-select
      class="text-no-wrap rounded-0"
      @update:options="updateOptions"
    >
      <!-- Order ID -->
      <template #item.ordernumber="{ item }">
        <span class="font-weight-medium">{{ item.ordernumber }}</span>
      </template>

      <!-- Created Date -->
      <template #item.createdAt="{ item }">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="ri-calendar-line"
            color="primary"
            size="22"
          />
          <span class="text-high-emphasis">{{ formatDate(item.createdAt) }}</span>
        </div>
      </template>

      <!-- Delivery Date -->
      <template #item.deliveryDate="{ item }">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="ri-truck-line"
            color="primary"
            size="22"
          />
          <span class="text-high-emphasis">{{ formatDate(item.deliveryDate) }}</span>
        </div>
      </template>

      <!-- Status -->
      <template #item.status="{ item }">
        <VChip
          :color="getStatusColor(item.status)"
          size="small"
          class="text-capitalize"
        >
          {{ item.status }}
        </VChip>
      </template>

      <!-- Rating -->
      <template #item.rating="{ item }">
        <div v-if="item.rating" class="d-flex align-center">
          <VRating
            :model-value="item.rating.rating"
            readonly
          />
        </div>
        <span v-else class="text-caption">Sin calificar</span>
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <VTooltip location="top">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                @click="openRatingDialog(item)"
                v-if="item.status === 'ENTREGADO' && !item.rating"
              >
                <VIcon icon="ri-star-line" />
              </IconBtn>
              <IconBtn
                v-else-if="item.rating"
                v-bind="props"
                size="small"
                @click="viewRating(item.rating)"
              >
                <VIcon icon="ri-message-2-line" />
              </IconBtn>
            </template>
            <span>{{ item.status === 'ENTREGADO' && !item.rating ? 'Calificar orden' : 'Ver comentario' }}</span>
          </VTooltip>
        </div>
      </template>

      <!-- Pagination -->
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
              @click="page >= Math.ceil(totalOrders / itemsPerPage) ? page = Math.ceil(totalOrders / itemsPerPage) : page++ "
            />
          </div>
        </div>
      </template>
    </VDataTableServer>

    <!-- Diálogo para calificar -->
    <AddNewRating
      v-model:isDialogVisible="ratingDialog"
      :order="selectedOrder"
      @rating-registered="handleRatingRegistered"
    />

    <!-- Diálogo para ver calificación -->
    <VDialog v-model="viewRatingDialog" max-width="500px">
      <VCard>
        <VCardItem class="pb-4">
          <template #prepend>
            <VIcon
              icon="ri-message-2-line"
              color="primary"
              size="24"
            />
          </template>
          <VCardTitle class="text-h5">
            Comentario de la Orden #{{ selectedOrder?.ordernumber }}
          </VCardTitle>
          <template #append>
            <VBtn
              icon
              variant="text"
              size="small"
              color="default"
              @click="viewRatingDialog = false"
            >
              <VIcon icon="ri-close-line" />
            </VBtn>
          </template>
        </VCardItem>

        <VDivider />

        <VCardText class="pt-6">
          <VRow>
            <VCol cols="12">
              <div class="d-flex flex-column align-center">
                <VRating
                  :model-value="selectedRating.rating"
                  readonly
                />
              </div>
            </VCol>
            <VCol cols="12">
              <div class="bg-grey-50 rounded pa-4">
                <p class="text-body-1 mb-0">{{ selectedRating.comment }}</p>
              </div>
            </VCol>
            <VCol cols="12">
              <div class="d-flex align-center gap-2">
                <VIcon
                  icon="ri-time-line"
                  color="primary"
                  size="20"
                />
                <span class="text-caption">
                  {{ formatDate(selectedRating.createdAt) }}
                </span>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            color="primary"
            variant="tonal"
            @click="viewRatingDialog = false"
            prepend-icon="ri-close-line"
          >
            Cerrar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar para notificaciones -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
    </VSnackbar>
  </VCard>
</template>

<style lang="scss" scoped>
.app-order-search-filter {
  inline-size: 15.625rem;
}
</style>