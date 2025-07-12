<script setup>
import { $api } from '@/utils/api'
import { ref, watch } from 'vue'

const loading = ref(false)
const success = ref(null)
const error_exists = ref(null)
const supplier = ref(null)

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  supplier: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const emit = defineEmits(['update:isDialogVisible', 'supplier-disabled'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const handleCloseDialog = () => {
  emit('update:isDialogVisible', false)
  supplier.value = null
  error_exists.value = null
  success.value = null
}

// Cuando se abre el diálogo, cargar los datos del proveedor
watch(
  [() => props.supplier, () => props.isDialogVisible],
  ([newSupplier, isVisible]) => {
    if (isVisible && newSupplier && newSupplier.id) {
      supplier.value = newSupplier.name
    }
    if (!isVisible) {
      supplier.value = null
    }
  },
  { immediate: true }
)

const disableSupplier = async () => {
  loading.value = true
  error_exists.value = null
  success.value = null

  try {
    // Preparar los datos del proveedor manteniendo sus datos actuales y solo actualizando el estado
    const supplierData = {
      name: props.supplier.name,
      contact: props.supplier.contact,
      email: props.supplier.email,
      address: props.supplier.address,
      status: 'INACTIVE' // Forzamos el estado a INACTIVE
    }

    await $api(`/materials/supplier/${props.supplier.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: supplierData
    })
    
    success.value = "Proveedor desactivado correctamente"
    emit('supplier-disabled')

    setTimeout(() => {
      dialogVisibleUpdate(false)
      success.value = null
    }, 1500)
  } catch (error) {
    console.error('Error al desactivar proveedor:', error)
    if (error.response?._data?.backendMessage) {
      error_exists.value = error.response._data.backendMessage
    } else if (error.response?.status === 403) {
      error_exists.value = "No tiene permisos para desactivar proveedores"
    } else {
      error_exists.value = "Hubo un problema al desactivar el proveedor. Por favor, intente nuevamente."
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
    <template v-if="supplier">
      <VCard title="¿Desactivar proveedor?">
        <DialogCloseBtn
          variant="text"
          size="default"
          @click="handleCloseDialog"
        />
        <VCardText>
          ¿Estás seguro que deseas desactivar el proveedor <b>{{ supplier }}</b>?<br>
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
            @click="disableSupplier"
            prepend-icon="ri-prohibited-2-line"
          >
            Desactivar
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