<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { $api } from '@/utils/api'
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'userData',
  'user-created'
])

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

const passwordValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (!/[A-Z]/.test(value)) return 'La contraseña debe contener al menos una letra mayúscula'
  if (!/[0-9]/.test(value)) return 'La contraseña debe contener al menos un número'
  if (!/[!@#$%^&*()_+\-=\[\]{};'"\\|,.<>\/?]/.test(value)) return 'La contraseña debe contener al menos un símbolo especial'
  if (/\s/.test(value)) return 'La contraseña no puede contener espacios en blanco'
  return true
}

const passwordMatchValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (value !== password.value) return 'Las contraseñas no coinciden'
  return true
}

const emailValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Por favor ingrese un email válido'
  return true
}

const requiredSelectValidator = (value) => {
  if (!value) return 'Por favor seleccione una opción'
  return true
}

// Computed para los requisitos de la contraseña
const passwordRequirements = computed(() => [
  {
    text: 'Mínimo 8 caracteres',
    met: password.value.length >= 8
  },
  {
    text: 'Al menos una letra mayúscula',
    met: /[A-Z]/.test(password.value)
  },
  {
    text: 'Al menos un número',
    met: /[0-9]/.test(password.value)
  },
  {
    text: 'Al menos un símbolo especial',
    met: /[!@#$%^&*()_+\-=\[\]{};'"\\|,.<>\/?]/.test(password.value)
  },
  {
    text: 'Sin espacios en blanco',
    met: !/\s/.test(password.value)
  },
  {
    text: 'Las contraseñas coinciden',
    met: password.value === repeatedPassword.value && password.value !== ''
  }
])

const isFormValid = ref(false)
const refForm = ref()
const name = ref('')
const lastname = ref('')
const email = ref('')
const contacto = ref('')
const username = ref('')
const password = ref('')
const repeatedPassword = ref('')
const role = ref()
const status = ref()
const roles = ref([])
const error = ref(null)
const success = ref(null)
const showPassword = ref(false)
const showRepeatedPassword = ref(false)

// Estados disponibles
const statusOptions = [
  { title: 'Activo', value: 'ENABLED' },
  { title: 'Inactivo', value: 'DISABLED' },
]

// Cargar roles
onMounted(async () => {
  try {
    const response = await $api('/roles', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    roles.value = response.content.map(role => ({
      title: role.name,
      value: role.name
    }))
  } catch (error) {
    console.error('Error al cargar roles:', error)
  }
})

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
    error.value = null
    success.value = null
  })
}

const onSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      try {
        const userData = {
          name: name.value,
          lastname: lastname.value,
          email: email.value,
          contacto: contacto.value,
          username: username.value,
          password: password.value,
          repeatedPassword: repeatedPassword.value,
          status: status.value,
          role: role.value
        }

        const response = await $api('/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: userData
        })

        success.value = 'Usuario creado correctamente'
        emit('userData', response)
        emit('user-created')
        
        setTimeout(() => {
          closeNavigationDrawer()
        }, 1500)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al crear el usuario'
      }
    }
  })
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}
</script>

<template>
  <VNavigationDrawer
    temporary
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Title -->
    <AppDrawerHeaderSection
      title="Añadir Usuario"
      @cancel="closeNavigationDrawer"
    />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Form -->
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- 👉 Name -->
              <VCol cols="12">
                <VTextField
                  v-model="name"
                  :rules="[minLengthValidator(4)]"
                  label="Nombres"
                  placeholder="Juan"
                  prepend-inner-icon="ri-user-line"
                />
              </VCol>

              <!-- 👉 Lastname -->
              <VCol cols="12">
                <VTextField
                  v-model="lastname"
                  :rules="[minLengthValidator(4)]"
                  label="Apellidos"
                  placeholder="Pérez"
                  prepend-inner-icon="ri-user-line"
                />
              </VCol>
              
              <!-- 👉 Email -->
              <VCol cols="12">
                <VTextField
                  v-model="email"
                  :rules="[emailValidator]"
                  label="Email"
                  placeholder="juan@mail.com"
                  prepend-inner-icon="ri-mail-line"
                />
              </VCol>

              <!-- 👉 Contact -->
              <VCol cols="12">
                <VTextField
                  v-model="contacto"
                  :rules="[contactValidator]"
                  label="Contacto"
                  placeholder="123456789"
                  prepend-inner-icon="ri-phone-line"
                />
              </VCol>

              <!-- 👉 Username -->
              <VCol cols="12">
                <VTextField
                  v-model="username"
                  :rules="[minLengthValidator(4)]"
                  label="Usuario"
                  placeholder="juanp"
                  prepend-inner-icon="ri-user-settings-line"
                />
              </VCol>

              <!-- 👉 Password -->
              <VCol cols="12">
                <VTextField
                  v-model="password"
                  prepend-inner-icon="ri-lock-line"
                  :type="showPassword ? 'text' : 'password'"
                  :rules="[passwordValidator]"
                  label="Contraseña"
                  placeholder="********"
                  :append-inner-icon="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"
                  @click:append-inner="showPassword = !showPassword"
                />
              </VCol>

              <!-- 👉 Repeat Password -->
              <VCol cols="12">
                <VTextField
                  v-model="repeatedPassword"
                  prepend-inner-icon="ri-lock-line"
                  :type="showRepeatedPassword ? 'text' : 'password'"
                  :rules="[passwordMatchValidator]"
                  label="Confirmar Contraseña"
                  placeholder="********"
                  :append-inner-icon="showRepeatedPassword ? 'ri-eye-off-line' : 'ri-eye-line'"
                  @click:append-inner="showRepeatedPassword = !showRepeatedPassword"
                />
              </VCol>

              <!-- 👉 Role -->
              <VCol cols="12">
                <VSelect
                  v-model="role"
                  label="Seleccionar Rol"
                  placeholder="Seleccionar Rol"
                  :rules="[requiredSelectValidator]"
                  :items="roles"
                  prepend-inner-icon="ri-user-4-line"
                />
              </VCol>             

              <!-- 👉 Status -->
              <VCol cols="12">
                <VSelect
                  v-model="status"
                  label="Seleccionar Estado"
                  placeholder="Seleccionar Estado"
                  :rules="[requiredSelectValidator]"
                  :items="statusOptions"
                  prepend-inner-icon="ri-forbid-2-line"
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

              <!-- 👉 Submit and Cancel -->
              <VCol cols="12">
                <VBtn
                  type="submit"
                  class="me-4"
                  prepend-icon="ri-user-add-line"
                >
                  Añadir
                </VBtn>
                <VBtn
                  type="reset"
                  variant="outlined"
                  color="error"
                  @click="closeNavigationDrawer"
                  prepend-icon="ri-close-fill"
                >
                  Cancelar
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
