<script setup>
import { $api } from '@/utils/api'
import { ref, watch } from 'vue'

const loading = ref(false)

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  userData: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const emit = defineEmits(['update:isDialogVisible', 'user-disabled'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const handleCloseDialog = () => {
 emit('update:isDialogVisible', false)
 user.value = null
 warning.value = null
 error_exists.value = null
 success.value = null
}

const user = ref(null)
const warning = ref(null)
const error_exists = ref(null)
const success = ref(null)

// Cuando se abre el diálogo, cargar los datos del usuario
watch(
  [() => props.userData, () => props.isDialogVisible],
  ([newUser, isVisible]) => {
    if (isVisible && newUser && newUser.id) {
      user.value = newUser.username
    }
    if (!isVisible) {
      user.value = null
    }
  },
  { immediate: true }
)

// Función para confirmar la deshabilitación del usuario
const confirmDisable = async () => {
  warning.value = null
  error_exists.value = null
  success.value = null


  const closeDialog = () => {
  emit('update:isDialogVisible', false)
  error.value = null
}
  
  try {
    await $api(`/users/${props.userData.id}/disable`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
    })
    success.value = "Usuario deshabilitado correctamente"
    emit('user-disabled')

    setTimeout(() => {
      dialogVisibleUpdate(false)
      success.value = null
      warning.value = null
      
    }, 1500)
  } catch (error) {
    console.error('Error al deshabilitar usuario:', error)
    if (error.response?._data?.backendMessage) {
      error_exists.value = error.response._data.backendMessage
    } else if (error.response?.status === 403) {
      error_exists.value = "No tiene permisos para deshabilitar usuarios"
    } else {
      error_exists.value = "Hubo un problema al deshabilitar el usuario. Por favor, intente nuevamente."
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
      @update:model-value="closeDialog"
    >
      <template v-if="user">
        <VCard :title="'¿Deshabilitar usuario?'">
          <DialogCloseBtn
            variant="text"
            size="default"
            @click="handleCloseDialog"
          />
          <VCardText>
            ¿Estás seguro que deseas deshabilitar el usuario <b>{{ user }}</b>?<br>
            <VAlert v-if="error" type="error" class="mt-3">{{ error }}</VAlert>
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