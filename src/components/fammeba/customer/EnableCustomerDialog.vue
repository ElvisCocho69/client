<script setup>
import { $api } from '@/utils/api'
import { ref, watch } from 'vue'

const loading = ref(false)
const error_exists = ref(null)
const customer = ref(null)

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  customerData: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const emit = defineEmits(['update:isDialogVisible', 'customer-enabled'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const handleCloseDialog = () => {
  emit('update:isDialogVisible', false)
  customer.value = null
  error_exists.value = null
}

// Cuando se abre el diálogo, cargar los datos del cliente
watch(
  [() => props.customerData, () => props.isDialogVisible],
  ([newCustomer, isVisible]) => {
    if (isVisible && newCustomer && newCustomer.id) {
      customer.value = newCustomer.clientType === 'NATURAL' 
        ? `${newCustomer.name} ${newCustomer.lastname}`
        : newCustomer.razonsocial
    }
    if (!isVisible) {
      customer.value = null
    }
  },
  { immediate: true }
)

const enableCustomer = async () => {
  loading.value = true
  error_exists.value = null

  try {
    // Preparar los datos del cliente manteniendo sus datos actuales y solo actualizando el estado
    const customerData = {
      ...props.customerData,
      status: 'ENABLED' // Forzamos el estado a ENABLED
    }

    await $api(`/clients/${props.customerData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: customerData
    })
    
    emit('customer-enabled')
    dialogVisibleUpdate(false)
  } catch (error) {
    console.error('Error al activar cliente:', error)
    if (error.response?._data?.backendMessage) {
      error_exists.value = error.response._data.backendMessage
    } else if (error.response?.status === 403) {
      error_exists.value = "No tiene permisos para activar clientes"
    } else {
      error_exists.value = "Hubo un problema al activar el cliente. Por favor, intente nuevamente."
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    persistent
    max-width="450px"
    @update:model-value="handleCloseDialog"
  >
    <template v-if="customer">
      <VCard title="¿Activar cliente?">
        <DialogCloseBtn
          variant="text"
          size="default"
          @click="handleCloseDialog"
        />
        <VCardText>
          ¿Estás seguro que deseas activar el cliente <b>{{ customer }}</b>?<br>
          <VAlert
            v-if="error_exists"
            type="error"
            class="mt-3"
          >
            {{ error_exists }}
          </VAlert>
        </VCardText>

        <VCardText class="d-flex justify-end flex-wrap gap-4">
          <VBtn
            color="#0277BD"
            variant="tonal"
            :loading="loading"
            @click="enableCustomer"
            prepend-icon="ri-check-fill"
          >
            Activar
          </VBtn>
          <VBtn
            variant="tonal"
            @click="handleCloseDialog"
            prepend-icon="ri-close-circle-fill"
          >
            Cancelar
          </VBtn>
        </VCardText>
      </VCard>
    </template>
  </VDialog>
</template> 