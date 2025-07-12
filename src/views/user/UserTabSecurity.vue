<script setup>
import { $api } from '@/utils/api'
import { computed } from 'vue'

const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true
  }
})

const passwordRequirements = computed(() => [
  {
    text: 'Mínimo 8 caracteres',
    met: newPassword.value.length >= 8
  },
  {
    text: 'Al menos una letra mayúscula',
    met: /[A-Z]/.test(newPassword.value)
  },
  {
    text: 'Al menos un número',
    met: /[0-9]/.test(newPassword.value)
  },
  {
    text: 'Al menos un símbolo especial',
    met: /[!@#$%^&*()_+\-=\[\]{};'"\\|,.<>\/?]/.test(newPassword.value)
  },
  {
    text: 'Sin espacios en blanco',
    met: !/\s/.test(newPassword.value)
  },
  {
    text: 'Las contraseñas coinciden',
    met: newPassword.value === confirmPassword.value && newPassword.value !== ''
  }
])

const validatePassword = (password) => {
  if (!password || !confirmPassword.value) {
    return 'Las contraseñas no pueden estar vacías'
  }

  if (password !== confirmPassword.value) {
    return 'Las contraseñas no coinciden'
  }

  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres'
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra mayúscula'
  }

  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe contener al menos un número'
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};'"\\|,.<>\/?]/.test(password)) {
    return 'La contraseña debe contener al menos un símbolo especial'
  }

  if (/\s/.test(password)) {
    return 'La contraseña no puede contener espacios en blanco'
  }

  return null
}

const handleSubmit = async () => {
  const validationError = validatePassword(newPassword.value)
  if (validationError) {
    errorMessage.value = validationError
    successMessage.value = ''
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $api(`/users/${props.userId}/change-password`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: {
        password: newPassword.value,
        repeatedPassword: confirmPassword.value,
      },
    })
    
    // Reset form
    newPassword.value = ''
    confirmPassword.value = ''
    successMessage.value = 'Contraseña actualizada exitosamente'
  } catch (error) {
    console.error('Error changing password:', error)
    
    if (error?.response?.data?.message) {
      errorMessage.value = error.response.data.message
    } else if (error?.message) {
      errorMessage.value = error.message
    } else if (error?.response?.data?.error) {
      errorMessage.value = error.response.data.error
    } else {
      errorMessage.value = 'Error al cambiar la contraseña. Por favor, intente nuevamente.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- 👉 Change password -->
      <VCard title="Cambiar Contraseña">
        <VCardText>
          <VAlert
            v-if="errorMessage"
            variant="tonal"
            color="error"
            closable
            class="mb-4"
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </VAlert>

          <VAlert
            v-if="successMessage"
            variant="tonal"
            color="success"
            closable
            class="mb-4"
            @click:close="successMessage = ''"
          >
            {{ successMessage }}
          </VAlert>

          <VForm @submit.prevent="handleSubmit">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="newPassword"
                  label="Nueva Contraseña"
                  placeholder="············"
                  :type="isNewPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isNewPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                  :disabled="isLoading"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="confirmPassword"
                  label="Confirmar Contraseña"
                  placeholder="············"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isConfirmPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  :disabled="isLoading"
                />
              </VCol>

              <VCol cols="12">
                <VCard variant="outlined" class="mb-4">
                  <VCardText>
                    <div class="text-subtitle-2 mb-2">Requisitos de la contraseña:</div>
                    <VList density="compact" class="pa-0">
                      <VListItem
                        v-for="(requirement, index) in passwordRequirements"
                        :key="index"
                        :class="{ 'password-met': requirement.met }"
                        class="py-1"
                      >
                        <template #prepend>
                          <VIcon
                            :icon="requirement.met ? 'ri-checkbox-circle-fill' : 'ri-checkbox-circle-line'"
                            :color="requirement.met ? '#66BB6A' : 'default'"
                            size="small"
                          />
                        </template>
                        {{ requirement.text }}
                      </VListItem>
                    </VList>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol cols="12">
                <VBtn 
                  type="submit"
                  prepend-icon="ri-key-fill"
                  :disabled="!passwordRequirements.every(req => req.met) || isLoading"
                  :loading="isLoading"
                >
                  {{ isLoading ? 'Cambiando contraseña...' : 'Confirmar' }}
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>    
  </VRow>

  <!-- 👉 Enable One Time Password Dialog -->
  
</template>

<style scoped>
.v-list-item {
  min-height: 32px;
}

.password-met {
  color: #66BB6A !important;
}
</style>
