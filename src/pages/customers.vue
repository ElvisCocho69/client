<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AddNewCustomer from '@/components/fammeba/customer/AddNewCustomer.vue'
import EditCustomer from '@/components/fammeba/customer/EditCustomer.vue'
import DisableCustomerDialog from '@/components/fammeba/customer/DisableCustomerDialog.vue'
import EnableCustomerDialog from '@/components/fammeba/customer/EnableCustomerDialog.vue'
import { $api } from '@/utils/api'
import { useRoute, useRouter } from 'vue-router'

// Estados
const customers = ref([])
const allCustomers = ref([]) // Nuevo estado para almacenar todos los clientes
const totalCustomers = ref(0)
const searchQuery = ref('')
const selectedClientType = ref()
const selectedStatus = ref()
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()
const selectedRows = ref([])
const isAddNewCustomerDrawerVisible = ref(false)
const isEditCustomerDrawerVisible = ref(false)
const isDisableDialogVisible = ref(false)
const isEnableDialogVisible = ref(false)
const selectedCustomer = ref(null)

const orderData = ref({
  ordernumber: '', // Generar automáticamente
  orderdate: new Date(), // Fecha actual
  deliverydate: '', // Fecha de entrega
  description: '', // Descripción general
  specialnotes: '', // Notas especiales
  status: 'PENDIENTE', // Estado por defecto
  totalprice: 0, // Precio total
  clientId: null, // ID del cliente seleccionado
  userId: null, // ID del usuario autenticado
  orderDetails: [{
    quantity: 1,
    unitprice: 0,
    status: 'PENDIENTE',
    structure: {
      name: '',
      description: '',
      colors: '',
      materials: '',
      startdate: null,
      estimatedenddate: null,
      observations: ''
    }
  }]
})

// Headers de la tabla
const headers = [
  {
    title: 'Nombre Completo',
    key: 'fullName',
    sortable: true,
  },
  {
    title: 'Tipo de Cliente',
    key: 'clientType',
    sortable: true,
  },
  {
    title: 'Documento',
    key: 'documentNumber',
    sortable: true,
  },
  {
    title: 'Contacto',
    key: 'contact',
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

// Tipos de cliente y estados disponibles
const clientTypes = [
  { title: 'Natural', value: 'NATURAL' },
  { title: 'Jurídico', value: 'JURIDICO' }
]

const status = [
  { title: 'Activo', value: 'ENABLED' },
  { title: 'Inactivo', value: 'DISABLED' }
]

// Computed properties
const filteredCustomers = computed(() => {
  let filtered = allCustomers.value;

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(customer => 
      customer.fullName?.toLowerCase().includes(query) ||
      customer.documentNumber?.toLowerCase().includes(query)
    );
  }

  // Filtrar por tipo de cliente
  if (selectedClientType.value) {
    filtered = filtered.filter(customer => 
      customer.clientType === selectedClientType.value
    );
  }

  // Filtrar por estado
  if (selectedStatus.value) {
    filtered = filtered.filter(customer => 
      customer.status === selectedStatus.value
    );
  }

  // Actualizar el total de clientes filtrados
  totalCustomers.value = filtered.length;

  // Aplicar paginación
  const start = (page.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filtered.slice(start, end);
})

// Función para obtener clientes
const fetchCustomers = async () => {
  try {
    // Obtener todos los clientes sin paginación
    const response = await $api('/clients?size=1000', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    allCustomers.value = response.content.map(client => ({
      ...client,
      fullName: client.clientType === 'NATURAL' 
        ? `${client.name} ${client.lastname}`
        : client.razonsocial,
      documentNumber: client.documentnumber
    }))
    
    // Actualizar la lista paginada
    customers.value = filteredCustomers.value

  } catch (error) {
    console.error('Error al obtener clientes:', error)
  }
}

// Función para actualizar opciones de la tabla
const updateOptions = options => {
  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
  // Actualizar la lista paginada
  customers.value = filteredCustomers.value
}

// Función para manejar el cambio de filas por página
const handleItemsPerPageChange = (newValue) => {
  itemsPerPage.value = newValue
  page.value = 1 // Resetear a la primera página
  customers.value = filteredCustomers.value
}

// Función para calcular la paginación
const paginationMeta = ({ page, itemsPerPage }, total) => {
  const start = (page - 1) * itemsPerPage + 1
  const end = Math.min(page * itemsPerPage, total)
  return `${start}-${end} de ${total}`
}

const handleCustomerCreated = () => {
  fetchCustomers()
}

const handleCustomerUpdated = () => {
  fetchCustomers()
}

const handleCustomerDisabled = () => {
  fetchCustomers()
}

const handleCustomerEnabled = () => {
  fetchCustomers()
}

const openEditDrawer = (customer) => {
  selectedCustomer.value = customer
  isEditCustomerDrawerVisible.value = true
}

const openDisableDialog = (customer) => {
  selectedCustomer.value = customer
  isDisableDialogVisible.value = true
}

const openEnableDialog = (customer) => {
  selectedCustomer.value = customer
  isEnableDialogVisible.value = true
}

// Cargar datos al montar el componente
onMounted(() => {
  fetchCustomers()
})

// Función para resolver el color del avatar según el tipo de cliente
const resolveClientTypeColor = type => {
  if (type === 'NATURAL') return '#1565C0'
  if (type === 'JURIDICO') return '#AB47BC'
  return 'primary'
}

// Función para resolver el color del estado
const resolveClientStatusVariant = status => {
  const statusLowerCase = status.toLowerCase()
  if (statusLowerCase === 'enabled') return '#26A69A'
  if (statusLowerCase === 'disabled') return 'secondary'
  return 'primary'
}

// Observar cambios en los filtros
watch([selectedClientType, selectedStatus, searchQuery], () => {
  page.value = 1 // Resetear a la primera página cuando cambian los filtros
  // Actualizar la lista paginada
  customers.value = filteredCustomers.value
})

// Funciones de exportación
const exportToPdf = async () => {
  try {
    const params = new URLSearchParams()
    if (selectedClientType.value) params.append('clienttype', selectedClientType.value)
    if (selectedStatus.value) params.append('status', selectedStatus.value)
    if (searchQuery.value) params.append('search', searchQuery.value)

    const response = await $api(`/clients/export/pdf?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'clientes.pdf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error al exportar a PDF:', error)
  }
}

const exportToExcel = async () => {
  try {
    const params = new URLSearchParams()
    if (selectedClientType.value) params.append('clienttype', selectedClientType.value)
    if (selectedStatus.value) params.append('status', selectedStatus.value)
    if (searchQuery.value) params.append('search', searchQuery.value)

    const response = await $api(`/clients/export/excel?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'clientes.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error al exportar a Excel:', error)
  }
}

const route = useRoute()
const router = useRouter()

onMounted(() => {
  if (route.query.openAdd === 'true') {
    isAddNewCustomerDrawerVisible.value = true
    router.replace({ query: { ...route.query, openAdd: undefined } })
  }
})
</script>

<template>
  <VCard class="mb-6">
    <VCardItem class="pb-4">
      <VCardTitle>Filtros</VCardTitle>
    </VCardItem>

    <VCardText>
      <VRow>
        <!-- 👉 Select Client Type -->
        <VCol
          cols="12"
          sm="4"
        >
          <VSelect
            v-model="selectedClientType"
            label="Seleccionar Tipo de Cliente"
            placeholder="Seleccionar Tipo de Cliente"
            :items="clientTypes"
            clearable
            clear-icon="ri-close-line"
          />
        </VCol>
        
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
      <!-- 👉 Export buttons -->
      <VBtn
        variant="tonal"
        color="error"
        prepend-icon="ri-file-pdf-2-line"
        @click="exportToPdf"
        v-if="isPermission('CLIEN_EXPORT_PDF')"
      >
        Exportar PDF
      </VBtn>

      <VBtn
        variant="tonal"
        color="#009688"
        text-color="#009688"
        prepend-icon="ri-file-excel-line"
        @click="exportToExcel"
        v-if="isPermission('CLIENT_EXPORT_EXCEL')"
      >
        Exportar Excel
      </VBtn>

      <VSpacer />
      <div class="d-flex align-center gap-4 flex-wrap">
        <!-- 👉 Search  -->
        <div class="app-user-search-filter">
          <VTextField
            v-model="searchQuery"
            placeholder="Buscar Cliente"
            density="compact"
            prepend-inner-icon="ri-search-line"
          />
        </div>

        <!-- 👉 Add customer button -->
        <VBtn 
          prepend-icon="ri-user-add-fill"
          @click="isAddNewCustomerDrawerVisible = true"
          v-if="isPermission('CREATE_ONE_CLIENT')"
        >
          Añadir Cliente
        </VBtn>
      </div>
    </VCardText>

    <VDataTableServer
      v-model:model-value="selectedRows"
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :items="filteredCustomers"
      item-value="id"
      :items-length="totalCustomers"
      :headers="headers"
      show-select
      class="text-no-wrap mt-5"
      @update:options="updateOptions"
    >
      <!-- Nombre Completo -->
      <template #item.fullName="{ item }">
        <div class="d-flex align-center">
          <VAvatar
            size="34"
            variant="tonal"
            :color="resolveClientTypeColor(item.clientType)"
            class="me-3"
          >
            <span>
              {{ item.clientType === 'NATURAL' 
                ? (item.name?.charAt(0) || '') + (item.lastname?.charAt(0) || '')
                : (item.razonsocial?.split(' ').map(word => word.charAt(0)).slice(0, 2).join('') || '') }}
            </span>
          </VAvatar>

          <div class="d-flex flex-column">
            <span class="text-base font-weight-medium">{{ item.fullName }}</span>
          </div>
        </div>
      </template>

      <!-- Tipo de Cliente -->
      <template #item.clientType="{ item }">
        <VChip
          size="small"
          :color="resolveClientTypeColor(item.clientType)"
          class="text-capitalize"
        >
          {{ item.clientType === 'NATURAL' ? 'Natural' : 'Jurídico' }}
        </VChip>
      </template>

      <!-- Documento -->
      <template #item.documentNumber="{ item }">
        <span>{{ item.documentNumber }}</span>
      </template>

      <!-- Contacto -->
      <template #item.contact="{ item }">
        <span>{{ item.contact }}</span>
      </template>

      <!-- Estado -->
      <template #item.status="{ item }">
        <VChip
          :color="resolveClientStatusVariant(item.status)"
          size="small"
          class="text-capitalize"
        >
          {{ item.status === 'ENABLED' ? 'Activo' : 'Inactivo' }}
        </VChip>
      </template>

      <!-- Acciones -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <VTooltip location="top">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                @click="openEditDrawer(item)"
                v-if="isPermission('UPDATE_ONE_CLIENT')"
              >
                <VIcon icon="ri-pencil-line" />
              </IconBtn>
            </template>
            <span>Editar cliente</span>
          </VTooltip>

          <VTooltip location="top">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                size="small"
                @click="openDisableDialog(item)"
                v-if="item.status === 'ENABLED' && isPermission('DISABLE_ONE_CLIENT')"
              >
                <VIcon icon="ri-forbid-2-fill" />
              </IconBtn>
              <IconBtn
                v-else
                v-bind="props"
                size="small"
                @click="openEnableDialog(item)"
                v-if="isPermission('UPDATE_ONE_CLIENT')"
              >
                <VIcon icon="ri-checkbox-circle-line" />
              </IconBtn>
            </template>
            <span>{{ item.status === 'ENABLED' ? 'Desactivar cliente' : 'Activar cliente' }}</span>
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
              @update:model-value="handleItemsPerPageChange"
            />
          </div>

          <p class="d-flex align-center text-base text-high-emphasis me-2 mb-0">
            {{ paginationMeta({ page, itemsPerPage }, totalCustomers) }}
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
              :disabled="page >= Math.ceil(totalCustomers / itemsPerPage)"
              @click="page >= Math.ceil(totalCustomers / itemsPerPage) ? page = Math.ceil(totalCustomers / itemsPerPage) : page++"
            />
          </div>
        </div>
      </template>
    </VDataTableServer>
  </VCard>

  <!-- 👉 Add New Customer Drawer -->
  <AddNewCustomer
    v-model:is-drawer-open="isAddNewCustomerDrawerVisible"
    @customer-created="handleCustomerCreated"
  />

  <!-- 👉 Edit Customer Drawer -->
  <EditCustomer
    v-model:is-drawer-open="isEditCustomerDrawerVisible"
    :customer-data="selectedCustomer"
    @customer-updated="handleCustomerUpdated"
  />

  <!-- 👉 Disable Customer Dialog -->
  <DisableCustomerDialog
    v-model:is-dialog-visible="isDisableDialogVisible"
    :customer-data="selectedCustomer"
    @customer-disabled="handleCustomerDisabled"
  />

  <!-- 👉 Enable Customer Dialog -->
  <EnableCustomerDialog
    v-model:is-dialog-visible="isEnableDialogVisible"
    :customer-data="selectedCustomer"
    @customer-enabled="handleCustomerEnabled"
  />
</template>

<style lang="scss" scoped>
.app-user-search-filter {
  inline-size: 15.625rem;
}
</style>