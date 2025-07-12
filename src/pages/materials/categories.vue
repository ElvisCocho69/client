<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { $api } from '@/utils/api'
import { isPermission } from '@/utils/constants'
import AddNewCategory from '@/components/fammeba/material/AddNewCategory.vue'
import EditCategoryDialog from '@/components/fammeba/material/EditCategoryDialog.vue'
import DisableCategoryDialog from '@/components/fammeba/material/DisableCategoryDialog.vue'
import EnableCategoryDialog from '@/components/fammeba/material/EnableCategoryDialog.vue'

// Estados
const categories = ref([])
const totalCategories = ref(0)
const searchQuery = ref('')
const selectedStatus = ref()
const isAddNewCategoryDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const categoryToEdit = ref(null)
const isDisableDialogVisible = ref(false)
const categoryToDisable = ref(null)
const isEnableDialogVisible = ref(false)
const categoryToEnable = ref(null)

// Data table options
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()
const selectedRows = ref([])

// Estados disponibles
const status = [
  { title: 'Activo', value: 'ACTIVE' },
  { title: 'Inactivo', value: 'INACTIVE' },
]

// Headers de la tabla
const headers = [
  {
    title: 'ID',
    key: 'id',
    sortable: true,
  },
  {
    title: 'Nombre',
    key: 'name',
    sortable: true,
  },
  {
    title: 'Estado',
    key: 'status',
    sortable: true,
  },
  {
    title: 'Acciones',
    key: 'actions',
    sortable: false,
  },
]

// Funciones de utilidad
const resolveCategoryStatusVariant = stat => {
  const statLowerCase = stat.toLowerCase()
  if (statLowerCase === 'active') return '#26A69A'
  if (statLowerCase === 'inactive') return 'secondary'
  return 'primary'
}

// Computed properties
const filteredCategories = computed(() => {
  if(!searchQuery.value) return categories.value;
  const query = searchQuery.value.toLowerCase();
  return categories.value.filter(category => 
    (category.name?.toLowerCase() || '').includes(query) ||
    (category.id?.toString() || '').includes(query)
  )
})

// Función para obtener categorías
const fetchCategories = async () => {
  try {
    const params = new URLSearchParams()
    if (selectedStatus.value) params.append('status', selectedStatus.value)
    if (page.value) params.append('page', page.value - 1) 
    if (itemsPerPage.value) params.append('size', itemsPerPage.value)
    if (sortBy.value) params.append('sort', `${sortBy.value},${orderBy.value}`)

    const response = await $api(`/materials/category?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    categories.value = response.content || []
    totalCategories.value = response.totalElements || 0
    
  } catch (error) {
    console.error('Error al obtener categorías:', error)
  }
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

// Observar cambios en los filtros
watch([selectedStatus], () => {
  page.value = 1 
  fetchCategories()
})

// Función para abrir el diálogo de deshabilitación
const openDisableDialog = (category) => {
  categoryToDisable.value = category
  isDisableDialogVisible.value = true
}

// Función para manejar la deshabilitación de la categoría
const handleCategoryDisabled = () => {
  isDisableDialogVisible.value = false
  fetchCategories()
}

// Función para abrir el diálogo de activación
const openEnableDialog = (category) => {
  categoryToEnable.value = category
  isEnableDialogVisible.value = true
}

// Función para manejar la activación de la categoría
const handleCategoryEnabled = () => {
  isEnableDialogVisible.value = false
  fetchCategories()
}

// Función para abrir el diálogo de edición
const openEditDialog = (category) => {
  categoryToEdit.value = category
  isEditDialogVisible.value = true
}

// Función para manejar la edición de la categoría
const handleCategoryEdited = () => {
  isEditDialogVisible.value = false
  categoryToEdit.value = null
  fetchCategories()
}

// Cargar datos al montar el componente
onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <VCard class="mb-6">
    <VCardItem class="pb-4">
      <VCardTitle>Filtros</VCardTitle>
    </VCardItem>

    <VCardText>
      <VRow>
        <!-- 👉 Select Status -->
        <VCol
          cols="12"
          sm="4"
        >
          <VSelect
            v-model="selectedStatus"
            label="Seleccionar Estado"
            placeholder="Seleccionar Estado"
            :items="status"
            clearable
            clear-icon="ri-close-line"
          />
        </VCol>
      </VRow>
    </VCardText>

    <VDivider />

    <VCardText class="d-flex flex-wrap gap-4 align-center">
      <VSpacer />
      <div class="d-flex align-center gap-4 flex-wrap">
        <!-- 👉 Search  -->
        <div class="app-category-search-filter">
          <VTextField
            v-model="searchQuery"
            placeholder="Buscar Categoría"
            density="compact"
            prepend-inner-icon="ri-search-line"
          />
        </div>
        <!-- 👉 Add category button -->
        <VBtn 
          @click="isAddNewCategoryDialogVisible = true" 
          prepend-icon="ri-add-line"
          v-if="isPermission('CREATE_ONE_CATEGORY')"
        >
          Añadir Categoría
        </VBtn>
      </div>
    </VCardText>

    <VDataTableServer
      v-model:model-value="selectedRows"
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :items="filteredCategories"
      item-value="id"
      :items-length="totalCategories"
      :headers="headers"
      show-select
      class="text-no-wrap rounded-0"
      @update:options="updateOptions"
    >
      <!-- ID -->
      <template #item.id="{ item }">
        <span>{{ item.id }}</span>
      </template>

      <!-- Name -->
      <template #item.name="{ item }">
        <span>{{ item.name }}</span>
      </template>

      <!-- Status -->
      <template #item.status="{ item }">
        <VChip
          :color="resolveCategoryStatusVariant(item.status)"
          size="small"
          class="text-capitalize"
        >
          {{ item.status === 'ACTIVE' ? 'Activo' : 'Inactivo' }}
        </VChip>
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <VTooltip location="top">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                @click="openEditDialog(item)"
                v-if="isPermission('UPDATE_ONE_CATEGORY')"
              >
                <VIcon icon="ri-edit-line" />
              </IconBtn>
            </template>
            <span>Editar categoría</span>
          </VTooltip>

          <VTooltip location="top">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                @click="openDisableDialog(item)"
                v-if="item.status === 'ACTIVE' && isPermission('DISABLE_ONE_CATEGORY')"
              >
                <VIcon icon="ri-forbid-2-fill" />
              </IconBtn>
              <IconBtn
                v-else
                v-bind="props"
                size="small"
                @click="openEnableDialog(item)"
                v-if="isPermission('UPDATE_ONE_CATEGORY')"
              >
                <VIcon icon="ri-checkbox-circle-line" />
              </IconBtn>
            </template>
            <span>{{ item.status === 'ACTIVE' ? 'Desactivar categoría' : 'Activar categoría' }}</span>
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
            {{ paginationMeta({ page, itemsPerPage }, totalCategories) }}
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
              :disabled="page >= Math.ceil(totalCategories / itemsPerPage)"
              @click="page >= Math.ceil(totalCategories / itemsPerPage) ? page = Math.ceil(totalCategories / itemsPerPage) : page++ "
            />
          </div>
        </div>
      </template>
    </VDataTableServer>
  </VCard>

  <!-- 👉 Add New Category Dialog -->
  <AddNewCategory
    v-model:is-drawer-open="isAddNewCategoryDialogVisible"
    @category-created="fetchCategories"
  />

  <!-- 👉 Edit Category Dialog -->
  <EditCategoryDialog
    v-model:is-drawer-open="isEditDialogVisible"
    :category-data="categoryToEdit"
    @category-edited="handleCategoryEdited"
  />

  <!-- 👉 Disable Category Dialog -->
  <DisableCategoryDialog
    v-model:is-dialog-visible="isDisableDialogVisible"
    :category-data="categoryToDisable"
    @category-disabled="handleCategoryDisabled"
  />

  <!-- 👉 Enable Category Dialog -->
  <EnableCategoryDialog
    v-model:is-dialog-visible="isEnableDialogVisible"
    :category-data="categoryToEnable"
    @category-enabled="handleCategoryEnabled"
  />
</template>

<style lang="scss" scoped>
.app-category-search-filter {
  inline-size: 15.625rem;
}
</style>