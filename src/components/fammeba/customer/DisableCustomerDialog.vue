<script setup>
import { $api } from '@/utils/api'
import { ref, watch } from 'vue'

const loading = ref(false)

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

const emit = defineEmits(['update:isDialogVisible', 'customer-disabled'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const handleCloseDialog = () => {
  emit('update:isDialogVisible', false)
  customer.value = null
  warning.value = null
  error_exists.value = null
}

const customer = ref(null)
const warning = ref(null)
const error_exists = ref(null)

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

// Función para confirmar la deshabilitación del cliente
const confirmDisable = async () => {
  warning.value = null
  error_exists.value = null
  loading.value = true

  try {
    // Preparar los datos del cliente manteniendo sus datos actuales y solo actualizando el estado
    const customerData = {
      ...props.customerData,
      status: 'DISABLED' // Forzamos el estado a DISABLED
    }

    await $api(`/clients/${props.customerData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: customerData
    })
    
    emit('customer-disabled')
    dialogVisibleUpdate(false)
  } catch (error) {
    console.error('Error al deshabilitar cliente:', error)
    if (error.response?._data?.backendMessage) {
      error_exists.value = error.response._data.backendMessage
    } else if (error.response?.status === 403) {
      error_exists.value = "No tiene permisos para deshabilitar clientes"
    } else {
      error_exists.value = "Hubo un problema al deshabilitar el cliente. Por favor, intente nuevamente."
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
      <VCard title="¿Deshabilitar cliente?">
        <DialogCloseBtn
          variant="text"
          size="default"
          @click="handleCloseDialog"
        />
        <VCardText>
          ¿Estás seguro que deseas deshabilitar el cliente <b>{{ customer }}</b>?<br>
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
            color="error"
            variant="tonal"
            :loading="loading"
            @click="confirmDisable"
            prepend-icon="ri-prohibited-2-line"
          >
            Deshabilitar
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