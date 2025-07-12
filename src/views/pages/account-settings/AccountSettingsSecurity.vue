<script setup>
import boyWithTab from '@images/illustrations/account-settings-security-illustration.png'
import { $api } from '@/utils/api'
import { computed } from 'vue'

const isCurrentPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

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
  if (!currentPassword.value) {
    errorMessage.value = 'La contraseña actual es requerida'
    return
  }

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
    await $api('/users/change-password', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: {
        oldPassword: currentPassword.value,
        password: newPassword.value,
        repeatedPassword: confirmPassword.value,
      },
    })
    
    // Reset form
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    successMessage.value = 'Contraseña actualizada exitosamente'
  } catch (error) {
    console.error('Error changing password:', error)
    
    if (error?.response?.status === 403) {
      errorMessage.value = 'Contraseña incorrecta!'
    } else if (error?.response?.status === 401) {
      errorMessage.value = 'Contraseña incorrecta!'
    } else if (error?.response?.data?.message) {
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

const resetForm = () => {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}
</script>

<template>
  <VRow>
    <!-- SECTION: Change Password -->
    <VCol cols="12">
      <VCard>
        <VCardItem class="pb-6">
          <VCardTitle>Cambiar Contraseña</VCardTitle>
        </VCardItem>
        <VForm @submit.prevent="handleSubmit">
          <VCardText class="pt-0">
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

            <!-- 👉 Current Password -->
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <!-- 👉 current password -->
                <VTextField
                  v-model="currentPassword"
                  :type="isCurrentPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isCurrentPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  autocomplete="on"
                  label="Contraseña Actual"
                  placeholder="············"
                  @click:append-inner="isCurrentPasswordVisible = !isCurrentPasswordVisible"
                  :disabled="isLoading"
                />
              </VCol>
            </VRow>

            <!-- 👉 New Password -->
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <!-- 👉 new password -->
                <VTextField
                  v-model="newPassword"
                  :type="isNewPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isNewPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  label="Nueva Contraseña"
                  autocomplete="on"
                  placeholder="············"
                  @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                  :disabled="isLoading"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <!-- 👉 confirm password -->
                <VTextField
                  v-model="confirmPassword"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isConfirmPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  autocomplete="on"
                  label="Confirmar Nueva Contraseña"
                  placeholder="············"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  :disabled="isLoading"
                />
              </VCol>
            </VRow>
          </VCardText>

          <!-- 👉 Password Requirements -->
          <VCardText>
            <h6 class="text-h6 text-medium-emphasis mt-1">
              Requisitos de la contraseña:
            </h6>

            <VList>
              <VListItem
                v-for="(requirement, index) in passwordRequirements"
                :key="index"
                :class="{ 'text-success': requirement.met }"
                class="px-0"
              >
                <template #prepend>
                  <VIcon
                    :icon="requirement.met ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'"
                    :color="requirement.met ? 'success' : 'default'"
                    size="small"
                  />
                </template>
                <VListItemTitle class="text-wrap">
                  {{ requirement.text }}
                </VListItemTitle>
              </VListItem>
            </VList>

            <!-- 👉 Action Buttons -->
            <div class="d-flex flex-wrap gap-4 mt-2">
              <VBtn
                type="submit"
                :disabled="!passwordRequirements.every(req => req.met) || isLoading"
                :loading="isLoading"
              >
                {{ isLoading ? 'Cambiando contraseña...' : 'Guardar cambios' }}
              </VBtn>

              <VBtn
                type="button"
                color="secondary"
                variant="outlined"
                @click="resetForm"
                :disabled="isLoading"
              >
                Reiniciar
              </VBtn>
            </div>
          </VCardText>
        </VForm>
      </VCard>
    </VCol>    
    
  </VRow>
</template>
