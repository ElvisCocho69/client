<script setup>
import { ref } from 'vue'
import { $api } from '@/utils/api'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  role: {
    type: Object,
    required: false,
    default: null
  }
})

const emit = defineEmits(['update:isDialogVisible', 'role-deleted'])

const loading = ref(false)
const error = ref(null)

const closeDialog = () => {
  emit('update:isDialogVisible', false)
  error.value = null
}

const confirmDelete = async () => {
  loading.value = true
  error.value = null
  try {
    await $api(`/roles/${props.role.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    emit('role-deleted')
    closeDialog()
  } catch (e) {
    error.value = 'No se pudo eliminar el rol.'
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
    @update:model-value="closeDialog"
  >
    <template v-if="role">
      <VCard :title="'¿Eliminar rol?'">
        <DialogCloseBtn
          variant="text"
          size="default"
          @click="closeDialog"
        />
        <VCardText>
          ¿Estás seguro que deseas eliminar el rol <b>{{ role.name }}</b>?<br>
          <strong>Esta acción no se puede deshacer.</strong>
          <VAlert v-if="error" type="error" class="mt-3">{{ error }}</VAlert>
        </VCardText>

        <VCardText class="d-flex justify-end flex-wrap gap-4">
          <VBtn
            color="error"
            variant="tonal"
            :loading="loading"
            @click="confirmDelete"
            prepend-icon="ri-delete-bin-6-fill"
          >
            Eliminar
          </VBtn>
          <VBtn
            variant="tonal"
            @click="closeDialog"
            prepend-icon="ri-close-circle-fill"
          >
            Cancelar
          </VBtn>
        </VCardText>
      </VCard>
    </template>
  </VDialog>
</template>