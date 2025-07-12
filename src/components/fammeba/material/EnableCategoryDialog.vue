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

const emit = defineEmits(['update:isDialogVisible', 'category-enabled'])

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

// Función para activar la categoría
const enableCategory = async () => {
  error_exists.value = null
  loading.value = true

  try {
    await $api(`/materials/category/${props.categoryData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: {
        ...props.categoryData,
        status: 'ACTIVE'
      }
    })

    emit('category-enabled')
    dialogVisibleUpdate(false)
  } catch (error) {
    console.error('Error al activar categoría:', error)
    if (error.response?._data?.backendMessage) {
      error_exists.value = error.response._data.backendMessage
    } else if (error.response?.status === 403) {
      error_exists.value = "No tiene permisos para activar categorías"
    } else {
      error_exists.value = "Hubo un problema al activar la categoría. Por favor, intente nuevamente."
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
      <VCard title="¿Activar categoría?">
        <DialogCloseBtn
          variant="text"
          size="default"
          @click="handleCloseDialog"
        />
        <VCardText>
          ¿Estás seguro que deseas activar la categoría <b>{{ category }}</b>?<br>
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
            color="success"
            variant="tonal"
            :loading="loading"
            @click="enableCategory"
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