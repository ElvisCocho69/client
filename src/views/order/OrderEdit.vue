<script setup>
import { ref, onMounted, watch } from 'vue'
import InvoiceEditable from '@/views/order/InvoiceEditable.vue'
import { $api } from '@/utils/api'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Estados para clientes
const clients = ref([])
const selectedClientId = ref(null)
const selectedClient = ref(null)
const loading = ref(true)
const formErrors = ref({})

// Estados disponibles para la orden
const orderStatuses = ref([
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'En Preparación', value: 'EN_PREPARACION' },
  { title: 'Entregado', value: 'ENTREGADO' },
  { title: 'Cancelado', value: 'CANCELADO' }
])

// Estructura de datos de la orden
const orderData = ref({
  orderdate: '',
  deliverydate: null,
  description: '',
  specialnotes: '',
  status: 'PENDIENTE',
  totalprice: 0,
  clientId: null,
  userId: null,
  orderDetails: [{
    quantity: 1,
    unitprice: 0,
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

// Función para obtener clientes
const fetchClients = async () => {
  try {
    const response = await $api('/clients', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      params: {
        size: 1000, // Un número grande para obtener todos los clientes
        page: 0
      }
    })
    
    clients.value = response.content.map(client => ({
      ...client,
      title: client.clientType === 'NATURAL' 
        ? `${client.name} ${client.lastname}`
        : client.razonsocial,
      value: client.id
    }))
  } catch (error) {
    console.error('Error al obtener clientes:', error)
  }
}

// Función para obtener los datos de la orden
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
    
    // Asignar los datos de la orden manteniendo los IDs de los detalles
    orderData.value = {
      ...response,
      orderdate: response.orderdate?.split('T')[0] || '',
      deliverydate: response.deliverydate?.split('T')[0] || null,
      orderDetails: response.orderDetails.map(detail => ({
        id: detail.id,
        quantity: detail.quantity,
        unitprice: detail.unitprice,
        structure: {
          ...detail.structure,
          startdate: detail.structure?.startdate?.split('T')[0] || null,
          estimatedenddate: detail.structure?.estimatedenddate?.split('T')[0] || null
        }
      }))
    }

    // Seleccionar el cliente
    if (response.clientId) {
      selectedClientId.value = response.clientId
      const client = clients.value.find(c => c.value === response.clientId)
      if (client) {
        selectedClient.value = client
      }
    }
  } catch (err) {
    formErrors.value.server = err.message || 'Error al cargar los datos de la orden'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

// Función para manejar la selección de cliente
const handleClientChange = (clientId) => {
  selectedClientId.value = clientId
  const client = clients.value.find(c => c.value === clientId)
  if (client) {
    selectedClient.value = client
    orderData.value.clientId = clientId
  }
}

// Funciones para manejar los productos
const addProduct = () => {
  orderData.value.orderDetails.push({
    quantity: 1,
    unitprice: 0,
    structure: {
      name: '',
      description: '',
      colors: '',
      materials: '',
      startdate: null,
      estimatedenddate: null,
      observations: ''
    }
  })
}

const removeProduct = id => {
  orderData.value.orderDetails.splice(id, 1)
}

const updateProduct = ({ id, data }) => {
  const newData = {
    ...orderData.value,
    orderDetails: orderData.value.orderDetails.map((item, index) => 
      index === id ? data : item
    )
  }
  orderData.value = newData
}

// Reglas de validación
const validateForm = () => {
  const errors = {}
  
  if (!orderData.value.clientId) {
    errors.clientId = 'Debe seleccionar un cliente'
  }
  if (!orderData.value.orderdate) {
    errors.orderdate = 'Debe especificar la fecha del pedido'
  }
  if (!orderData.value.deliverydate) {
    errors.deliverydate = 'Debe especificar la fecha de entrega'
  } else {
    // Convertir las fechas a objetos Date para comparar
    const orderDate = new Date(orderData.value.orderdate)
    const deliveryDate = new Date(orderData.value.deliverydate)
    
    if (deliveryDate < orderDate) {
      errors.deliverydate = 'Fecha inválida'
    }
  }
  if (orderData.value.orderDetails.length === 0) {
    errors.orderDetails = 'Debe agregar al menos un detalle a la orden'
  }
  if (orderData.value.status === 'CANCELADO' && !orderData.value.cancellationreason?.trim()) {
    errors.cancellationreason = 'Debe especificar una razón de cancelación'
  }

  // Validar cada estructura
  orderData.value.orderDetails.forEach((detail, index) => {
    // Validar campos numéricos
    if (!detail.quantity || detail.quantity <= 0) {
      errors[`structure_${index}_quantity`] = `La cantidad debe ser mayor a 0`
    }
    if (!detail.unitprice || detail.unitprice <= 0) {
      errors[`structure_${index}_price`] = `El precio debe ser mayor a 0`
    }

    // Validar campos de texto requeridos
    if (!detail.structure.name?.trim()) {
      errors[`structure_${index}_name`] = `El nombre de la estructura es requerido`
    }
    if (!detail.structure.description?.trim()) {
      errors[`structure_${index}_description`] = `La descripción de la estructura es requerida`
    }
    if (!detail.structure.colors?.trim()) {
      errors[`structure_${index}_colors`] = `Los colores son requeridos`
    }
    if (!detail.structure.materials?.trim()) {
      errors[`structure_${index}_materials`] = `Los materiales son requeridos`
    }

    // Validar fechas
    if (!detail.structure.startdate) {
      errors[`structure_${index}_startdate`] = `La fecha de inicio es requerida`
    }
    if (!detail.structure.estimatedenddate) {
      errors[`structure_${index}_estimatedenddate`] = `Fecha requerida`
    }
  })

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Función para actualizar la orden
const updateOrder = async () => {
  try {
    loading.value = true
    formErrors.value = {}

    // Validar formulario
    if (!validateForm()) {
      return
    }

    // Obtener el usuario del localStorage
    const user = JSON.parse(localStorage.getItem('user'))

    // Preparar los datos para enviar
    const orderToUpdate = {
      ...orderData.value,
      orderdate: orderData.value.orderdate instanceof Date 
        ? orderData.value.orderdate.toISOString().split('T')[0]
        : orderData.value.orderdate.split('T')[0],
      deliverydate: orderData.value.deliverydate 
        ? (orderData.value.deliverydate instanceof Date 
          ? orderData.value.deliverydate.toISOString().split('T')[0]
          : orderData.value.deliverydate.split('T')[0])
        : null,
      userId: user?.id,
      orderDetails: orderData.value.orderDetails.map(detail => ({
        ...detail,
        structure: {
          ...detail.structure,
          startdate: detail.structure.startdate 
            ? (detail.structure.startdate instanceof Date 
              ? detail.structure.startdate.toISOString().split('T')[0]
              : detail.structure.startdate.split('T')[0])
            : null,
          estimatedenddate: detail.structure.estimatedenddate 
            ? (detail.structure.estimatedenddate instanceof Date 
              ? detail.structure.estimatedenddate.toISOString().split('T')[0]
              : detail.structure.estimatedenddate.split('T')[0])
            : null
        }
      }))
    }

    // Enviar la actualización al backend
    await $api(`/orders/${route.params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderToUpdate)
    })

    // Actualizar los estados de los detalles si han cambiado
    for (const detail of orderData.value.orderDetails) {
      if (detail.id) {
        await $api(`/order-details/${detail.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: detail.status })
        })
      }
    }

    // Mostrar mensaje de éxito
    success.value = 'Orden actualizada correctamente'
    
    // Redirigir a la lista de órdenes después de un breve delay
    setTimeout(() => {
      router.push({ name: 'orders' })
    }, 1500)

  } catch (err) {
    console.error('Error al actualizar la orden:', err)
    formErrors.value.server = err.response?._data?.message || 'Error al actualizar la orden'
  } finally {
    loading.value = false
  }
}

// Función para cancelar la edición
const cancelEdit = () => {
  router.push({ name: 'orders' })
}

// Cargar datos al montar el componente
onMounted(async () => {
  await fetchClients() // Primero cargamos los clientes
  await fetchOrderData() // Luego cargamos los datos de la orden
})

// Estado para mensajes de éxito/error
const success = ref(null)
</script>

<template>
  <VRow>
    <!-- 👉 OrderEditable -->
    <VCol cols="12" md="9">
      <div v-if="loading" class="d-flex justify-center align-center pa-6">
        <VProgressCircular indeterminate />
      </div>
      <InvoiceEditable
        v-else
        v-model:data="orderData"
        :clients="clients"
        :selected-client-id="selectedClientId"
        :errors="formErrors"
        :is-edit-mode="true"
        :status-options="orderStatuses"
        @update-client="handleClientChange"
        @push="addProduct"
        @remove="removeProduct"
        @update:data="updateProduct"
      />
    </VCol>

    <!-- 👉 Right Column: Order Actions -->
    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <!-- 👉 Alerts -->
          <VAlert
            v-if="formErrors.server"
            type="error"
            closable
            class="mb-4"
          >
            {{ formErrors.server }}
          </VAlert>

          <VAlert
            v-if="success"
            type="success"
            closable
            class="mb-4"
          >
            {{ success }}
          </VAlert>

          <!-- 👉 Save -->
          <VBtn
            block
            color="primary"
            class="mb-4"
            :loading="loading"
            @click="updateOrder"
            prepend-icon="ri-save-2-line"
          >
            Guardar Cambios
          </VBtn>

          <!-- 👉 Cancel -->
          <VBtn
            block
            color="error"
            variant="outlined"
            prepend-icon="ri-close-line"
            @click="cancelEdit"
          >
            Cancelar
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template> 