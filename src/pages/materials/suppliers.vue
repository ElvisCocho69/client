<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { $api } from '@/utils/api'
import { isPermission } from '@/utils/constants'
import AddNewSupplier from '@/components/fammeba/material/AddNewSupplier.vue'
import EditSupplier from '@/components/fammeba/material/EditSupplier.vue'
import DisableSupplier from '@/components/fammeba/material/DisableSupplier.vue'
import EnableSupplier from '@/components/fammeba/material/EnableSupplier.vue'

// Estados
const suppliers = ref([])
const totalSuppliers = ref(0)
const searchQuery = ref('')
const selectedStatus = ref()
const isAddNewSupplierDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const supplierToEdit = ref(null)
const isDisableDialogVisible = ref(false)
const supplierToDisable = ref(null)
const isEnableDialogVisible = ref(false)
const supplierToEnable = ref(null)

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
    title: 'Contacto',
    key: 'contact',
    sortable: true,
  },
  {
    title: 'Correo',
    key: 'email',
    sortable: true,
  },
  {
    title: 'Dirección',
    key: 'address',
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
const resolveSupplierStatusVariant = stat => {
  const statLowerCase = stat.toLowerCase()
  if (statLowerCase === 'active') return '#26A69A'
  if (statLowerCase === 'inactive') return 'secondary'
  return 'primary'
}

// Computed properties
const filteredSuppliers = computed(() => {
  if(!searchQuery.value) return suppliers.value;
  const query = searchQuery.value.toLowerCase();
  return suppliers.value.filter(supplier => 
    (supplier.name?.toLowerCase() || '').includes(query) ||
    (supplier.contact?.toLowerCase() || '').includes(query) ||
    (supplier.email?.toLowerCase() || '').includes(query) ||
    (supplier.address?.toLowerCase() || '').includes(query) ||
    (supplier.id?.toString() || '').includes(query)
  )
})

// Función para obtener proveedores
const fetchSuppliers = async () => {
  try {
    const params = new URLSearchParams()
    if (selectedStatus.value) params.append('status', selectedStatus.value)
    if (page.value) params.append('page', page.value - 1) 
    if (itemsPerPage.value) params.append('size', itemsPerPage.value)
    if (sortBy.value) params.append('sort', `${sortBy.value},${orderBy.value}`)

    const response = await $api(`/materials/supplier?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    suppliers.value = response.content || []
    totalSuppliers.value = response.totalElements || 0
    
  } catch (error) {
    console.error('Error al obtener proveedores:', error)
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
  fetchSuppliers()
})

// Función para abrir el diálogo de deshabilitación
const openDisableDialog = (supplier) => {
  supplierToDisable.value = supplier
  isDisableDialogVisible.value = true
}

// Función para manejar la deshabilitación del proveedor
const handleSupplierDisabled = () => {
  isDisableDialogVisible.value = false
  fetchSuppliers()
}

// Función para abrir el diálogo de activación
const openEnableDialog = (supplier) => {
  supplierToEnable.value = supplier
  isEnableDialogVisible.value = true
}

// Función para manejar la activación del proveedor
const handleSupplierEnabled = () => {
  isEnableDialogVisible.value = false
  fetchSuppliers()
}

// Función para abrir el diálogo de edición
const openEditDialog = (supplier) => {
  supplierToEdit.value = supplier
  isEditDialogVisible.value = true
}

// Función para manejar la edición del proveedor
const handleSupplierEdited = () => {
  setTimeout(() => {
    isEditDialogVisible.value = false
    supplierToEdit.value = null
    fetchSuppliers()
  }, 1500)
}

// Cargar datos al montar el componente
onMounted(() => {
  fetchSuppliers()
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
        <div class="app-supplier-search-filter">
          <VTextField
            v-model="searchQuery"
            placeholder="Buscar Proveedor"
            density="compact"
            prepend-inner-icon="ri-search-line"
          />
        </div>
        <!-- 👉 Add supplier button -->
        <VBtn 
          @click="isAddNewSupplierDialogVisible = true" 
          prepend-icon="ri-add-line"
          v-if="isPermission('CREATE_ONE_SUPPLIER')"
        >
          Añadir Proveedor
        </VBtn>
      </div>
    </VCardText>

    <VDataTableServer
      v-model:model-value="selectedRows"
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :items="filteredSuppliers"
      item-value="id"
      :items-length="totalSuppliers"
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

      <!-- Contact -->
      <template #item.contact="{ item }">
        <span>{{ item.contact }}</span>
      </template>

      <!-- Email -->
      <template #item.email="{ item }">
        <span>{{ item.email }}</span>
      </template>

      <!-- Address -->
      <template #item.address="{ item }">
        <span>{{ item.address }}</span>
      </template>

      <!-- Status -->
      <template #item.status="{ item }">
        <VChip
          :color="resolveSupplierStatusVariant(item.status)"
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
                v-if="isPermission('UPDATE_ONE_SUPPLIER')"
              >
                <VIcon icon="ri-edit-line" />
              </IconBtn>
            </template>
            <span>Editar proveedor</span>
          </VTooltip>

          <VTooltip location="top">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                @click="openDisableDialog(item)"
                v-if="item.status === 'ACTIVE' && isPermission('DISABLE_ONE_SUPPLIER')"
              >
                <VIcon icon="ri-forbid-2-fill" />
              </IconBtn>
              <IconBtn
                v-else
                v-bind="props"
                size="small"
                @click="openEnableDialog(item)"
                v-if="isPermission('UPDATE_ONE_SUPPLIER')"
              >
                <VIcon icon="ri-checkbox-circle-line" />
              </IconBtn>
            </template>
            <span>{{ item.status === 'ACTIVE' ? 'Desactivar proveedor' : 'Activar proveedor' }}</span>
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
            {{ paginationMeta({ page, itemsPerPage }, totalSuppliers) }}
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
              :disabled="page >= Math.ceil(totalSuppliers / itemsPerPage)"
              @click="page >= Math.ceil(totalSuppliers / itemsPerPage) ? page = Math.ceil(totalSuppliers / itemsPerPage) : page++ "
            />
          </div>
        </div>
      </template>
    </VDataTableServer>
  </VCard>

  <!-- 👉 Add New Supplier Dialog -->
  <AddNewSupplier
    v-model:is-drawer-open="isAddNewSupplierDialogVisible"
    @supplier-created="fetchSuppliers"
  />

  <!-- 👉 Edit Supplier Dialog -->
  <EditSupplier
    v-model:isDialogVisible="isEditDialogVisible"
    :supplier="supplierToEdit"
    @supplier-updated="handleSupplierEdited"
  />

  <!-- 👉 Disable Supplier Dialog -->
  <DisableSupplier
    v-model:isDialogVisible="isDisableDialogVisible"
    :supplier="supplierToDisable"
    @supplier-disabled="handleSupplierDisabled"
  />

  <!-- 👉 Enable Supplier Dialog -->
  <EnableSupplier
    v-model:isDialogVisible="isEnableDialogVisible"
    :supplier="supplierToEnable"
    @supplier-enabled="handleSupplierEnabled"
  />
</template>

<style lang="scss" scoped>
.app-supplier-search-filter {
  inline-size: 15.625rem;
}
</style>