<script setup>
import { ref, onMounted, watch } from 'vue'
import InvoiceEditable from '@/views/order/InvoiceEditable.vue'
import InvoiceSendInvoiceDrawer from '@/views/order/InvoiceSendInvoiceDrawer.vue'
import { $api } from '@/utils/api'
import { useRouter } from 'vue-router'

// Estados para clientes
const clients = ref([])
const selectedClientId = ref(null)
const selectedClient = ref(null)
const loading = ref(false)
const formErrors = ref({})

// Estructura de datos actualizada
const orderData = ref({
  orderdate: new Date().toISOString().split('T')[0],
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

// Función para guardar en localStorage
const saveToLocalStorage = () => {
  localStorage.setItem('tempOrderData', JSON.stringify(orderData.value))
}

// Observar cambios en orderData y guardar en localStorage
watch(orderData, () => {
  saveToLocalStorage()
}, { deep: true })

// Función para obtener clientes
const fetchClients = async () => {
  try {
    loading.value = true
    const response = await $api('/clients', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      params: {
        size: 1000,
        page: 0,
        sort: 'id,desc'
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
    saveToLocalStorage() // Guardar inmediatamente al cambiar el cliente
  }
}

// Cargar clientes al montar el componente
onMounted(() => {
  fetchClients()
  const savedData = localStorage.getItem('tempOrderData')
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData)
      orderData.value = parsedData
      if (parsedData.clientId) {
        handleClientChange(parsedData.clientId)
      }
    } catch (err) {
      console.error('Error al cargar datos guardados:', err)
    }
  }
})

const isSendPaymentSidebarVisible = ref(false)

const addProduct = value => {
  orderData.value.orderDetails.push(value)
}

const removeProduct = id => {
  orderData.value.orderDetails.splice(id, 1)
}

const updateProduct = ({ id, data }) => {
  orderData.value.orderDetails[id] = data
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
  }
  if (orderData.value.orderDetails.length === 0) {
    errors.orderDetails = 'Debe agregar al menos un detalle a la orden'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Función para generar el siguiente número de orden
const generateOrderNumber = async () => {
  try {
    // Obtener todas las órdenes
    const response = await $api('/orders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    let lastNumber = 0
    if (response && response.content && response.content.length > 0) {
      // Ordenar las órdenes por número de orden de forma descendente
      const sortedOrders = response.content.sort((a, b) => {
        const numA = parseInt(a.ordernumber.replace('ORD-', ''))
        const numB = parseInt(b.ordernumber.replace('ORD-', ''))
        return numB - numA
      })

      // Obtener el número de la última orden
      const lastOrder = sortedOrders[0]
      if (lastOrder && lastOrder.ordernumber) {
        const match = lastOrder.ordernumber.match(/ORD-(\d+)/)
        if (match) {
          lastNumber = parseInt(match[1])
        }
      }
    }

    // Generar el siguiente número
    const nextNumber = lastNumber + 1
    // Formatear con ceros a la izquierda (1 -> 001)
    return `ORD-${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    console.error('Error al generar número de orden:', error)
    // Si hay error, empezar desde 1
    return 'ORD-001'
  }
}

// Función para guardar la orden
const saveOrder = async () => {
  try {
    loading.value = true
    formErrors.value = {}

    // Validar formulario
    if (!validateForm()) {
      return
    }

    // Obtener el usuario del localStorage
    const user = JSON.parse(localStorage.getItem('user'))

    // Generar el número de orden
    const orderNumber = await generateOrderNumber()

    // Preparar los datos para enviar
    const orderToSave = {
      ...orderData.value,
      ordernumber: orderNumber,
      orderdate: orderData.value.orderdate instanceof Date 
        ? orderData.value.orderdate.toISOString().split('T')[0]
        : orderData.value.orderdate.split('T')[0],
      deliverydate: orderData.value.deliverydate 
        ? (orderData.value.deliverydate instanceof Date 
          ? orderData.value.deliverydate.toISOString().split('T')[0]
          : orderData.value.deliverydate.split('T')[0])
        : null,
      totalprice: orderData.value.totalprice,
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

    // Enviar la orden al backend
    const response = await $api('/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderToSave)
    })

    // Mostrar mensaje de éxito
    success.value = 'Orden creada correctamente'
    
    // Limpiar localStorage después de guardar exitosamente
    localStorage.removeItem('tempOrderData')
    
    // Redirigir a la lista de órdenes después de un breve delay
    setTimeout(() => {
      router.push({ name: 'orders' })
    }, 1500)

  } catch (err) {
    console.error('Error al guardar la orden:', err)
    formErrors.value.server = err.response?._data?.message || 'Error al guardar la orden'
  } finally {
    loading.value = false
  }
}

const router = useRouter()

const goToPreview = () => {
  // Guardar temporalmente los datos de la orden en localStorage
  localStorage.setItem('tempOrderData', JSON.stringify(orderData.value))
  router.push({ name: 'order-preview' })
}

const goToCustomers = () => {
  router.push({ name: 'customers' })
}

// Función para cancelar la edición
const cancelEdit = () => {
  // Limpiar datos temporales
  localStorage.removeItem('tempOrderData')
  // Regresar a la lista de órdenes
  router.push({ name: 'orders' })
}

// Agregar estado para mensajes de éxito/error
const success = ref(null)
</script>

<template>
  <VRow>
    <!-- 👉 OrderEditable -->
    <VCol cols="12" md="9">
      <InvoiceEditable
        v-model:data="orderData"
        :clients="clients"
        :selected-client-id="selectedClientId"
        :errors="formErrors"
        :is-edit-mode="false"
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
            @click="saveOrder"
            prepend-icon="ri-save-2-line"
          >
            Guardar Orden
          </VBtn>

          <!-- 👉 Preview -->
          <VBtn
            block
            color="secondary"
            variant="outlined"
            class="mb-4"
            prepend-icon="ri-eye-fill"
            @click="goToPreview"
          >
            Vista Previa
          </VBtn>

          <!-- 👉 Send Invoice -->
          <VBtn
            block
            color="secondary"
            variant="outlined"
            class="mb-4"
            @click="isSendPaymentSidebarVisible = true"
            prepend-icon="ri-send-plane-fill"
          >
            Enviar Comprobante
          </VBtn>

          <!-- 👉 Cancel -->
          <VBtn
            block
            color="error"
            prepend-icon="ri-close-line"
            @click="cancelEdit"
          >
            Cancelar
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- 👉 Send Invoice Sidebar -->
  <InvoiceSendInvoiceDrawer v-model:isDrawerOpen="isSendPaymentSidebarVisible" />
</template>
