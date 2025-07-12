<script setup>
import { $api } from '@/utils/api'
import { ref, watch } from 'vue'

const loading = ref(false)
const success = ref(null)
const error_exists = ref(null)
const material = ref(null)

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  materialData: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const emit = defineEmits(['update:isDialogVisible', 'material-disabled'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const handleCloseDialog = () => {
  emit('update:isDialogVisible', false)
  material.value = null
  error_exists.value = null
  success.value = null
}

// Cuando se abre el diálogo, cargar los datos del material
watch(
  [() => props.materialData, () => props.isDialogVisible],
  ([newMaterial, isVisible]) => {
    if (isVisible && newMaterial && newMaterial.id) {
      material.value = newMaterial.name
    }
    if (!isVisible) {
      material.value = null
    }
  },
  { immediate: true }
)

const disableMaterial = async () => {
  loading.value = true
  error_exists.value = null
  success.value = null

  try {
    // Preparar los datos del material manteniendo sus datos actuales y solo actualizando el estado
    const materialData = {
      name: props.materialData.name,
      code: props.materialData.code,
      description: props.materialData.description,
      measurementUnit: props.materialData.measurementUnit,
      materialCategory: props.materialData.materialCategory,
      status: 'INACTIVE' // Forzamos el estado a INACTIVE
    }

    await $api(`/materials/${props.materialData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: materialData
    })
    
    success.value = "Material desactivado correctamente"
    emit('material-disabled')

    setTimeout(() => {
      dialogVisibleUpdate(false)
      success.value = null
    }, 1500)
  } catch (error) {
    console.error('Error al desactivar material:', error)
    if (error.response?._data?.backendMessage) {
      error_exists.value = error.response._data.backendMessage
    } else if (error.response?.status === 403) {
      error_exists.value = "No tiene permisos para desactivar materiales"
    } else {
      error_exists.value = "Hubo un problema al desactivar el material. Por favor, intente nuevamente."
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
    <template v-if="material">
      <VCard title="¿Desactivar material?">
        <DialogCloseBtn
          variant="text"
          size="default"
          @click="handleCloseDialog"
        />
        <VCardText>
          ¿Estás seguro que deseas desactivar el material <b>{{ material }}</b>?<br>
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
            @click="disableMaterial"
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