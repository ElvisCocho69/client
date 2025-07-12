<script setup>
import { $api } from '@/utils/api'
import { ref, watch } from 'vue'

const loading = ref(false)
const category = ref(null)
const error_exists = ref(null)

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  categoryData: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const emit = defineEmits(['update:isDialogVisible', 'category-disabled'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const handleCloseDialog = () => {
  emit('update:isDialogVisible', false)
  category.value = null
  error_exists.value = null
}

// Cuando se abre el diálogo, cargar los datos de la categoría
watch(
  [() => props.categoryData, () => props.isDialogVisible],
  ([newCategory, isVisible]) => {
    if (isVisible && newCategory && newCategory.id) {
      category.value = newCategory.name
    }
    if (!isVisible) {
      category.value = null
    }
  },
  { immediate: true }
)

// Función para desactivar la categoría
const disableCategory = async () => {
  error_exists.value = null
  loading.value = true

  try {
    await $api(`/materials/category/${props.categoryData.id}/disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    emit('category-disabled')
    dialogVisibleUpdate(false)
  } catch (error) {
    console.error('Error al desactivar categoría:', error)
    if (error.response?._data?.backendMessage) {
      error_exists.value = error.response._data.backendMessage
    } else if (error.response?.status === 403) {
      error_exists.value = "No tiene permisos para desactivar categorías"
    } else {
      error_exists.value = "Hubo un problema al desactivar la categoría. Por favor, intente nuevamente."
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
    <template v-if="category">
      <VCard title="¿Desactivar categoría?">
        <DialogCloseBtn
          variant="text"
          size="default"
          @click="handleCloseDialog"
        />
        <VCardText>
          ¿Estás seguro que deseas desactivar la categoría <b>{{ category }}</b>?<br>
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
            @click="disableCategory"
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