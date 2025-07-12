<script setup>
import { $api } from '@/utils/api'
import { ref, watch } from 'vue'

const loading = ref(false)
const success = ref(null)
const error_exists = ref(null)
const user = ref(null)

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

const emit = defineEmits(['update:isDialogVisible', 'user-enabled'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const handleCloseDialog = () => {
  emit('update:isDialogVisible', false)
  user.value = null
  error_exists.value = null
  success.value = null
}

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

const enableUser = async () => {
  loading.value = true
  error_exists.value = null
  success.value = null

  try {
    // Preparar los datos del usuario manteniendo sus datos actuales y solo actualizando el estado
    const userData = {
      name: props.userData.name,
      lastname: props.userData.lastname,
      email: props.userData.email,
      contacto: props.userData.contacto,
      username: props.userData.username,
      role: props.userData.role,
      status: 'ENABLED' // Forzamos el estado a ENABLED
    }

    await $api(`/users/${props.userData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: userData
    })
    
    success.value = "Usuario activado correctamente"
    emit('user-enabled')

    setTimeout(() => {
      dialogVisibleUpdate(false)
      success.value = null
    }, 1500)
  } catch (error) {
    console.error('Error al activar usuario:', error)
    if (error.response?._data?.backendMessage) {
      error_exists.value = error.response._data.backendMessage
    } else if (error.response?.status === 403) {
      error_exists.value = "No tiene permisos para activar usuarios"
    } else {
      error_exists.value = "Hubo un problema al activar el usuario. Por favor, intente nuevamente."
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
    <template v-if="user">
      <VCard title="¿Activar usuario?">
        <DialogCloseBtn
          variant="text"
          size="default"
          @click="handleCloseDialog"
        />
        <VCardText>
          ¿Estás seguro que deseas activar el usuario <b>{{ user }}</b>?<br>
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
            color="#0277BD"
            variant="tonal"
            :loading="loading"
            @click="enableUser"
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