<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { $api } from '@/utils/api'

// Estados
const ratings = ref([])
const totalRatings = ref(0)
const viewRatingDialog = ref(false)
const selectedRating = ref({})
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
    title: 'Cliente',
    key: 'clientName',
    sortable: true,
  },
  {
    title: 'Fecha',
    key: 'createdAt',
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
const filteredRatings = computed(() => {
  if(!searchQuery.value) return ratings.value;
  const query = searchQuery.value.toLowerCase();
  return ratings.value.filter(rating => 
    (rating.clientName?.toLowerCase() || '').includes(query) ||
    (rating.clientLastname?.toLowerCase() || '').includes(query) ||
    (rating.orderId?.toString() || '').includes(query)
  )
})

const loadRatings = async () => {
  try {
    const params = new URLSearchParams()
    if (page.value) params.append('page', page.value - 1)
    if (itemsPerPage.value) params.append('size', itemsPerPage.value)
    if (sortBy.value) params.append('sort', `${sortBy.value},${orderBy.value}`)

    const response = await $api(`/ratings?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    console.log('Respuesta de la API:', response)
    ratings.value = response.content || []
    totalRatings.value = response.totalElements || 0
  } catch (error) {
    console.error('Error al cargar las calificaciones:', error)
    showSnackbar('Error al cargar las calificaciones', 'error')
  }
}

const viewRating = (rating) => {
  selectedRating.value = rating
  viewRatingDialog.value = true
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

// Función para actualizar opciones de la tabla
const updateOptions = options => {
  page.value = options.page
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

// Función para calcular la paginación
const paginationMeta = ({ page, itemsPerPage }, total) => {
  const start = (page - 1) * itemsPerPage + 1
  const end = Math.min(page * itemsPerPage, total)
  return `${start}-${end} de ${total}`
}

onMounted(() => {
  loadRatings()
})
</script>

<template>
  <VCard class="mb-6">
    


    <VDivider />

    <VDataTableServer
      v-model:model-value="selectedRows"
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :items="filteredRatings"
      item-value="id"
      :items-length="totalRatings"
      :headers="headers"
      show-select
      class="text-no-wrap rounded-0 mt-10"
      @update:options="updateOptions"
    >
      <!-- Order Number -->
      <template #item.ordernumber="{ item }">
        <span class="font-weight-medium">{{ item.ordernumber }}</span>
      </template>

      <!-- Client Name -->
      <template #item.clientName="{ item }">
        <div class="d-flex gap-2">
          <VIcon
            icon="ri-user-line"
            color="primary"
            size="22"
          />
          <span class="text-capitalize text-high-emphasis">{{ `${item.clientName} ${item.clientLastname}` }}</span>
        </div>
      </template>

      <!-- Date -->
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

      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <VTooltip location="top">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                @click="viewRating(item)"
              >
                <VIcon icon="ri-eye-line" />
              </IconBtn>
            </template>
            <span>Ver detalles</span>
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
            {{ paginationMeta({ page, itemsPerPage }, totalRatings) }}
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
              :disabled="page >= Math.ceil(totalRatings / itemsPerPage)"
              @click="page >= Math.ceil(totalRatings / itemsPerPage) ? page = Math.ceil(totalRatings / itemsPerPage) : page++ "
            />
          </div>
        </div>
      </template>
    </VDataTableServer>

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
            Detalles de la Calificación
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
              <div class="d-flex align-center gap-2 mb-4">
                <VIcon
                  icon="ri-user-line"
                  color="primary"
                  size="20"
                />
                <span class="text-subtitle-1">
                  {{ selectedRating.clientName }} {{ selectedRating.clientLastname }}
                </span>
              </div>
              <div class="d-flex align-center gap-2 mb-4">
                <VIcon
                  icon="ri-shopping-cart-line"
                  color="primary"
                  size="20"
                />
                <span class="text-subtitle-1">
                  Orden #{{ selectedRating.orderId }}
                </span>
              </div>
            </VCol>
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
.app-rating-search-filter {
  inline-size: 15.625rem;
}
</style>

