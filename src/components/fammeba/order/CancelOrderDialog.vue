<script setup>
import { $api } from '@/utils/api'
import { ref, watch } from 'vue'

const loading = ref(false)

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  orderData: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const emit = defineEmits(['update:isDialogVisible', 'order-cancelled'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const handleCloseDialog = () => {
  emit('update:isDialogVisible', false)
  orderNumber.value = null
  warning.value = null
  error_exists.value = null
  success.value = null
  cancellationReason.value = ''
}

const orderNumber = ref(null)
const warning = ref(null)
const error_exists = ref(null)
const success = ref(null)
const cancellationReason = ref('')

// Cuando se abre el diálogo, cargar los datos de la orden
watch(
  [() => props.orderData, () => props.isDialogVisible],
  ([newOrder, isVisible]) => {
    if (isVisible && newOrder && newOrder.id) {
      orderNumber.value = newOrder.ordernumber
    }
    if (!isVisible) {
      orderNumber.value = null
      cancellationReason.value = ''
    }
  },
  { immediate: true }
)

// Función para confirmar la cancelación de la orden
const confirmCancel = async () => {
  if (!cancellationReason.value.trim()) {
    warning.value = "Debe ingresar una razón de cancelación"
    return
  }

  warning.value = null
  error_exists.value = null
  success.value = null
  loading.value = true

  try {
    await $api(`/orders/${props.orderData.id}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cancellationreason: cancellationReason.value.trim()
      })
    })
    success.value = "Orden cancelada correctamente"
    emit('order-cancelled')

    setTimeout(() => {
      dialogVisibleUpdate(false)
      success.value = null
      warning.value = null
      cancellationReason.value = ''
    }, 1500)
  } catch (error) {
    console.error('Error al cancelar orden:', error)
    if (error.response?._data?.backendMessage) {
      error_exists.value = error.response._data.backendMessage
    } else if (error.response?.status === 403) {
      error_exists.value = "No tiene permisos para cancelar órdenes"
    } else {
      error_exists.value = "Hubo un problema al cancelar la orden. Por favor, intente nuevamente."
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
    @update:model-value="dialogVisibleUpdate"
  >
    <template v-if="orderNumber">
      <VCard title="¿Cancelar orden?">
        <DialogCloseBtn
          variant="text"
          size="default"
          @click="handleCloseDialog"
        />
        <VCardText>
          ¿Está seguro que desea cancelar la orden <b>{{ orderNumber }}</b>?<br>
          <VTextField
            v-model="cancellationReason"
            label="Razón de cancelación"
            placeholder="Ingrese la razón de la cancelación"
            class="mt-4"
            :error-messages="warning"
            variant="outlined"
            rows="3"
            type="textarea"
          />
          <VAlert
            v-if="error_exists"
            type="error"
            class="mt-3"
          >
            {{ error_exists }}
          </VAlert>
          <VAlert
            v-if="success"
            type="success"
            class="mt-3"
          >
            {{ success }}
          </VAlert>
        </VCardText>

        <VCardText class="d-flex justify-end flex-wrap gap-4">
          <VBtn
            color="error"
            variant="tonal"
            :loading="loading"
            @click="confirmCancel"
            prepend-icon="ri-close-circle-line"
            :disabled="!cancellationReason.trim()"
          >
            Cancelar Orden
          </VBtn>
          <VBtn
            variant="tonal"
            @click="handleCloseDialog"
            prepend-icon="ri-close-circle-fill"
          >
            Cerrar
          </VBtn>
        </VCardText>
      </VCard>
    </template>
  </VDialog>
</template> 