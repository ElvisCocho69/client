<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { $api } from '@/utils/api'
import { isPermission } from '@/utils/constants'
import AddNewMaterial from '@/components/fammeba/material/AddNewMaterial.vue'
import EditMaterialDialog from '@/components/fammeba/material/EditMaterialDialog.vue'
import DisableMaterialDialog from '@/components/fammeba/material/DisableMaterialDialog.vue'
import EnableMaterialDialog from '@/components/fammeba/material/EnableMaterialDialog.vue'

// Estados
const materials = ref([])
const totalMaterials = ref(0)
const categories = ref([])
const searchQuery = ref('')
const selectedCategory = ref()
const isAddNewMaterialDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const materialToEdit = ref(null)
const materialsInventory = ref({})
const materialToDisable = ref(null)
const isDisableDialogVisible = ref(false)
const materialToEnable = ref(null)
const isEnableDialogVisible = ref(false)

// Data table options
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()
const selectedRows = ref([])

// Headers de la tabla
const headers = [
  {
    title: 'Código',
    key: 'code',
    sortable: true,
  },
  {
    title: 'Nombre',
    key: 'name',
    sortable: true,
  },
  {
    title: 'Categoría',
    key: 'materialcategory.name',
    sortable: true,
  },
  {
    title: 'Cantidad',
    key: 'inventory',
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
const resolveMaterialStatusVariant = stat => {
  const statLowerCase = stat.toLowerCase()
  if (statLowerCase === 'active') return '#26A69A'
  if (statLowerCase === 'inactive') return 'secondary'
  return 'primary'
}

const resolveMaterialCategoryVariant = () => {
  return { color: 'primary', icon: 'ri-tools-line' }
}

// Computed properties
const filteredMaterials = computed(() => {
  let filtered = materials.value

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(material => 
      (material.name?.toLowerCase() || '').includes(query) ||
      (material.code?.toLowerCase() || '').includes(query)
    )
  }

  // Filtrar por categoría
  if (selectedCategory.value) {
    filtered = filtered.filter(material => 
      material.materialcategory?.id === selectedCategory.value
    )
  }

  return filtered
})

// Función para obtener el inventario de un material
const fetchMaterialInventory = async (materialCode) => {
  try {
    const response = await $api(`/materials/inventory/${materialCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response
  } catch (error) {
    console.error('Error al obtener inventario:', error)
    return null
  }
}

// Función para obtener materiales con su inventario
const fetchMaterials = async () => {
  try {
    const params = new URLSearchParams()
    if (page.value) params.append('page', page.value - 1) 
    if (itemsPerPage.value) params.append('size', itemsPerPage.value)
    if (sortBy.value) params.append('sort', `${sortBy.value},${orderBy.value}`)

    const response = await $api(`/materials?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    materials.value = response.content || []
    totalMaterials.value = response.totalElements || 0

    // Obtener inventario para cada material
    for (const material of materials.value) {
      const inventory = await fetchMaterialInventory(material.code)
      if (inventory) {
        materialsInventory.value[material.code] = inventory.quantity
      }
    }
    
  } catch (error) {
    console.error('Error al obtener materiales:', error)
  }
}

// Función para cargar categorías
const fetchCategories = async () => {
  try {
    const response = await $api('/materials/category?size=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    categories.value = response.content.map(category => ({
      title: category.name,
      value: category.id
    }))
  } catch (error) {
    console.error('Error al cargar categorías:', error)
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
watch([selectedCategory], () => {
  // Ya no necesitamos recargar los materiales cuando cambia el filtro
  // porque el filtrado se hace en el frontend
})

// Función para abrir el diálogo de edición
const openEditDialog = (material) => {
  materialToEdit.value = material
  isEditDialogVisible.value = true
}

// Función para manejar la edición del material
const handleMaterialEdited = () => {
  fetchMaterials()
}

// Función para formatear la cantidad con la unidad de medida
const formatQuantity = (material) => {
  const quantity = materialsInventory.value[material.code] || 0
  const unit = material.measurementunit?.toLowerCase() || ''
  
  switch (unit) {
    case 'unit':
      return `${quantity} unidad${quantity !== 1 ? 'es' : ''}`
    case 'kilogram':
      return `${quantity} kg`
    case 'gram':
      return `${quantity} g`
    case 'milligram':
      return `${quantity} mg`
    case 'metre':
      return `${quantity} m`
    case 'square_metre':
      return `${quantity} m²`
    case 'cubic_metre':
      return `${quantity} m³`
    case 'centimetre':
      return `${quantity} cm`
    case 'square_centimetre':
      return `${quantity} cm²`
    case 'cubic_centimetre':
      return `${quantity} cm³`
    case 'millimetre':
      return `${quantity} mm`
    case 'square_millimetre':
      return `${quantity} mm²`
    case 'cubic_millimetre':
      return `${quantity} mm³`
    case 'liter':
    return `${quantity} L`
    case 'mililiter':
    return `${quantity} mL`
    default:
      return `${quantity}`
  }
}

// Función para abrir el diálogo de deshabilitación
const openDisableDialog = (material) => {
  materialToDisable.value = material
  isDisableDialogVisible.value = true
}

// Función para manejar la deshabilitación del material
const handleMaterialDisabled = () => {
  isDisableDialogVisible.value = false
  fetchMaterials()
}

// Función para abrir el diálogo de activación
const openEnableDialog = (material) => {
  materialToEnable.value = material
  isEnableDialogVisible.value = true
}

// Función para manejar la activación del material
const handleMaterialEnabled = () => {
  isEnableDialogVisible.value = false
  fetchMaterials()
}

// Cargar datos al montar el componente
onMounted(() => {
  fetchMaterials()
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
        <!-- 👉 Select Category -->
        <VCol
          cols="12"
          sm="4"
        >
          <VSelect
            v-model="selectedCategory"
            label="Seleccionar Categoría"
            placeholder="Seleccionar Categoría"
            :items="categories"
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
        <div class="app-material-search-filter">
          <VTextField
            v-model="searchQuery"
            placeholder="Buscar Material"
            density="compact"
            prepend-inner-icon="ri-search-line"
          />
        </div>
        <!-- 👉 Add material button -->
        <VBtn 
          @click="isAddNewMaterialDialogVisible = true" 
          prepend-icon="ri-add-line"
          v-if="isPermission('CREATE_ONE_MATERIAL')"
        >
          Añadir Material
        </VBtn>
      </div>
    </VCardText>

    <VDataTableServer
      v-model:model-value="selectedRows"
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :items="filteredMaterials"
      item-value="id"
      :items-length="totalMaterials"
      :headers="headers"
      show-select
      class="text-no-wrap rounded-0"
      @update:options="updateOptions"
    >
      <!-- Code -->
      <template #item.code="{ item }">
        <span>{{ item.code }}</span>
      </template>

      <!-- Name -->
      <template #item.name="{ item }">
        <span>{{ item.name }}</span>
      </template>

      <!-- Category -->
      <template #item.materialcategory.name="{ item }">
        <div class="d-flex gap-2">
          <VIcon
            :icon="resolveMaterialCategoryVariant().icon"
            :color="resolveMaterialCategoryVariant().color"
            size="22"
          />
          <span class="text-capitalize text-high-emphasis">{{ item.materialcategory?.name }}</span>
        </div>
      </template>

      <!-- Inventory -->
      <template #item.inventory="{ item }">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="ri-scales-3-line"
            color="primary"
            size="22"
          />
          <span class="text-high-emphasis">{{ formatQuantity(item) }}</span>
        </div>
      </template>

      <!-- Status -->
      <template #item.status="{ item }">
        <VChip
          :color="resolveMaterialStatusVariant(item.status)"
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
                v-if="isPermission('UPDATE_ONE_MATERIAL')"
              >
                <VIcon icon="ri-edit-line" />
              </IconBtn>
            </template>
            <span>Editar material</span>
          </VTooltip>

          <VTooltip location="top">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                @click="openDisableDialog(item)"
                v-if="item.status === 'ACTIVE' && isPermission('DISABLE_ONE_MATERIAL')"
              >
                <VIcon icon="ri-forbid-2-fill" />
              </IconBtn>
              <IconBtn
                v-else
                v-bind="props"
                size="small"
                @click="openEnableDialog(item)"
                v-if="isPermission('UPDATE_ONE_MATERIAL')"
              >
                <VIcon icon="ri-checkbox-circle-line" />
              </IconBtn>
            </template>
            <span>{{ item.status === 'ACTIVE' ? 'Desactivar material' : 'Activar material' }}</span>
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
            {{ paginationMeta({ page, itemsPerPage }, totalMaterials) }}
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
              :disabled="page >= Math.ceil(totalMaterials / itemsPerPage)"
              @click="page >= Math.ceil(totalMaterials / itemsPerPage) ? page = Math.ceil(totalMaterials / itemsPerPage) : page++ "
            />
          </div>
        </div>
      </template>
    </VDataTableServer>
  </VCard>

  <!-- 👉 Add New Material Drawer -->
  <AddNewMaterial
    v-model:is-drawer-open="isAddNewMaterialDialogVisible"
    @material-created="fetchMaterials"
  />

  <!-- 👉 Edit Material Dialog -->
  <EditMaterialDialog
    v-model:isDialogVisible="isEditDialogVisible"
    :material-data="materialToEdit"
    @material-edited="handleMaterialEdited"
  />

  <!-- 👉 Disable Material Dialog -->
  <DisableMaterialDialog
    v-model:isDialogVisible="isDisableDialogVisible"
    :material-data="materialToDisable"
    @material-disabled="handleMaterialDisabled"
  />

  <!-- 👉 Enable Material Dialog -->
  <EnableMaterialDialog
    v-model:isDialogVisible="isEnableDialogVisible"
    :material-data="materialToEnable"
    @material-enabled="handleMaterialEnabled"
  />
</template>

<style lang="scss" scoped>
.app-material-search-filter {
  inline-size: 15.625rem;
}
</style>