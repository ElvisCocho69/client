<script setup>
import { ref, onMounted, computed } from 'vue'
import avatar1 from '@images/avatars/avatar-1.png'
import { $api } from '@/utils/api'

const accountData = ref({
  avatarImg: avatar1,
  name: '',
  lastname: '',
  email: '',
  username: '',
  contacto: '',
  role: '',
})

const accountDataLocal = ref({
  avatarImg: avatar1,
  name: '',
  lastname: '',
  email: '',
  username: '',
  contacto: '',
  role: '',
})

// Validaciones
const minLengthValidator = (minLength) => (value) => {
  if (!value) return 'Este campo es requerido'
  if (value.length < minLength) return `Mínimo ${minLength} caracteres`
  return true
}

const contactValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (!/^\d{9}$/.test(value)) return 'El contacto debe tener exactamente 9 dígitos'
  return true
}

const emailValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Por favor ingrese un email válido'
  return true
}

const resetForm = () => {
  accountDataLocal.value = {
    ...accountData.value
  }
}

// reset avatar image
const resetAvatar = () => {
  accountDataLocal.value.avatarImg = accountData.value.avatarImg
}

// Cargar datos del usuario actual
onMounted(async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
      const userData = {
        avatarImg: avatar1,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        username: user.username,
        contacto: user.contacto,
        role: user.role.name,
      }
      accountData.value = userData
      accountDataLocal.value = { ...userData }
    }
  } catch (error) {
    console.error('Error al cargar datos del usuario:', error)
  }
})

const isFormValid = ref(false)
const refForm = ref()
const error = ref(null)
const success = ref(null)

const isAdmin = computed(() => {
  const user = JSON.parse(localStorage.getItem('user'))
  return user?.role?.name?.toLowerCase() === 'administrador'
})

const canEditField = (fieldName) => {
  if (isAdmin.value) return true
  
  // Solo email y contacto son editables para roles no administrativos
  return ['email', 'contacto'].includes(fieldName)
}

const onFormSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      try {
        const userData = {
          ...(isAdmin.value && { name: accountDataLocal.value.name }),
          ...(isAdmin.value && { lastname: accountDataLocal.value.lastname }),
          ...(isAdmin.value && { username: accountDataLocal.value.username }),
          email: accountDataLocal.value.email,
          contacto: accountDataLocal.value.contacto,
        }

        const response = await $api(`/users/${JSON.parse(localStorage.getItem('user')).id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: userData
        })

        // Actualizar datos en localStorage
        const updatedUser = { ...JSON.parse(localStorage.getItem('user')), ...userData }
        localStorage.setItem('user', JSON.stringify(updatedUser))

        success.value = 'Perfil actualizado correctamente'
        accountData.value = { ...accountDataLocal.value }
        
        setTimeout(() => {
          success.value = null
        }, 3000)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al actualizar el perfil'
      }
    }
  })
}

const timezones = [
  '(GMT-11:00) International Date Line West',
  '(GMT-11:00) Midway Island',
  '(GMT-10:00) Hawaii',
  '(GMT-09:00) Alaska',
  '(GMT-08:00) Pacific Time (US & Canada)',
  '(GMT-08:00) Tijuana',
  '(GMT-07:00) Arizona',
  '(GMT-07:00) Chihuahua',
  '(GMT-07:00) La Paz',
  '(GMT-07:00) Mazatlan',
  '(GMT-07:00) Mountain Time (US & Canada)',
  '(GMT-06:00) Central America',
  '(GMT-06:00) Central Time (US & Canada)',
  '(GMT-06:00) Guadalajara',
  '(GMT-06:00) Mexico City',
  '(GMT-06:00) Monterrey',
  '(GMT-06:00) Saskatchewan',
  '(GMT-05:00) Bogota',
  '(GMT-05:00) Eastern Time (US & Canada)',
  '(GMT-05:00) Indiana (East)',
  '(GMT-05:00) Lima',
  '(GMT-05:00) Quito',
  '(GMT-04:00) Atlantic Time (Canada)',
  '(GMT-04:00) Caracas',
  '(GMT-04:00) La Paz',
  '(GMT-04:00) Santiago',
  '(GMT-03:30) Newfoundland',
  '(GMT-03:00) Brasilia',
  '(GMT-03:00) Buenos Aires',
  '(GMT-03:00) Georgetown',
  '(GMT-03:00) Greenland',
  '(GMT-02:00) Mid-Atlantic',
  '(GMT-01:00) Azores',
  '(GMT-01:00) Cape Verde Is.',
  '(GMT+00:00) Casablanca',
  '(GMT+00:00) Dublin',
  '(GMT+00:00) Edinburgh',
  '(GMT+00:00) Lisbon',
  '(GMT+00:00) London',
]

const currencies = [
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'BRL',
  'CAD',
  'CNY',
  'CZK',
  'DKK',
  'HKD',
  'HUF',
  'INR',
]
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardText>
          <div class="d-flex mb-10">
            <!-- 👉 Avatar -->
            <VAvatar
              rounded
              size="100"
              class="me-6"
              :image="accountDataLocal.avatarImg"
            />
          </div>

          <!-- 👉 Form -->
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onFormSubmit"
          >
            <VRow>
              <!-- 👉 Name -->
              <VCol
                md="6"
                cols="12"
              >
                <VTextField
                  v-model="accountDataLocal.name"
                  :rules="[minLengthValidator(4)]"
                  label="Nombres"
                  placeholder="Juan"
                  :readonly="!canEditField('name')"
                  :disabled="!canEditField('name')"
                />
              </VCol>

              <!-- 👉 Last Name -->
              <VCol
                md="6"
                cols="12"
              >
                <VTextField
                  v-model="accountDataLocal.lastname"
                  :rules="[minLengthValidator(4)]"
                  label="Apellidos"
                  placeholder="Pérez"
                  :readonly="!canEditField('lastname')"
                  :disabled="!canEditField('lastname')"
                />
              </VCol>

              <!-- 👉 Username -->
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="accountDataLocal.username"
                  :rules="[minLengthValidator(4)]"
                  label="Usuario"
                  placeholder="juanp"
                  :readonly="!canEditField('username')"
                  :disabled="!canEditField('username')"
                />
              </VCol>

              <!-- 👉 Email -->
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="accountDataLocal.email"
                  :rules="[emailValidator]"
                  label="Email"
                  placeholder="juan@mail.com"
                  type="email"
                  :readonly="!canEditField('email')"
                  :disabled="!canEditField('email')"
                />
              </VCol>

              <!-- 👉 Contact -->
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="accountDataLocal.contacto"
                  :rules="[contactValidator]"
                  label="Contacto"
                  placeholder="123456789"
                  :readonly="!canEditField('contacto')"
                  :disabled="!canEditField('contacto')"
                />
              </VCol>

              <!-- 👉 Role (readonly) -->
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="accountDataLocal.role"
                  label="Rol"
                  readonly
                  disabled
                />
              </VCol>

              <!-- 👉 Alerts -->
              <VCol cols="12">
                <VAlert
                  v-if="error"
                  type="error"
                  closable
                  class="mb-4"
                >
                  {{ error }}
                </VAlert>

                <VAlert
                  v-if="success"
                  type="success"
                  closable
                  class="mb-4"
                >
                  {{ success }}
                </VAlert>
              </VCol>

              <!-- 👉 Form Actions -->
              <VCol
                cols="12"
                class="d-flex flex-wrap gap-4"
              >
                <VBtn
                  type="submit"
                  prepend-icon="ri-save-line"
                >
                  Guardar cambios
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="outlined"
                  type="reset"
                  @click.prevent="resetForm"
                  prepend-icon="ri-refresh-line"
                >
                  Restablecer
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
