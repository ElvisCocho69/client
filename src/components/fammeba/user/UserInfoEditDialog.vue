<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDialogVisible',
  'user-updated'
])

// Estados
const name = ref('')
const lastname = ref('')
const email = ref('')
const contacto = ref('')
const username = ref('')
const role = ref()
const status = ref()
const roles = ref([])
const error = ref(null)
const success = ref(null)

// Estados disponibles
const statusOptions = [
  { title: 'Activo', value: 'ENABLED' },
  { title: 'Inactivo', value: 'DISABLED' },
]

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

const requiredSelectValidator = (value) => {
  if (!value) return 'Por favor seleccione una opción'
  return true
}

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

// Función para cargar los datos del usuario
const loadUserData = () => {
  if (props.userData) {
    name.value = props.userData.name
    lastname.value = props.userData.lastname
    email.value = props.userData.email
    contacto.value = props.userData.contacto
    username.value = props.userData.username
    role.value = props.userData.role
    status.value = props.userData.status
  }
}

// Observar cambios en la visibilidad del diálogo
watch(
  () => props.isDialogVisible,
  (newValue) => {
    if (newValue) {
      loadUserData()
      error.value = null
      success.value = null
    }
  }
)

// Observar cambios en los datos del usuario
watch(
  () => props.userData,
  () => {
    if (props.isDialogVisible) {
      loadUserData()
    }
  }
)

const isFormValid = ref(false)
const refForm = ref()

const onFormSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      try {
        const userData = {
          name: name.value,
          lastname: lastname.value,
          email: email.value,
          contacto: contacto.value,
          username: username.value,
          status: status.value,
          role: role.value
        }

        const response = await $api(`/users/${props.userData.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: userData
        })

        success.value = 'Usuario actualizado correctamente'
        emit('user-updated')
        
        setTimeout(() => {
          dialogVisibleUpdate(false)
        }, 1500)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al actualizar el usuario'
      }
    }
  })
}

const onFormReset = () => {
  refForm.value?.reset()
  refForm.value?.resetValidation()
  error.value = null
  success.value = null
  dialogVisibleUpdate(false)
}

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.isDialogVisible"
    @update:model-value="dialogVisibleUpdate"
  >
    <VCard class="pa-sm-11 pa-3">
      <!-- 👉 dialog close btn -->
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="onFormReset"
      />

      <VCardText class="pt-5">
        <div class="text-center pb-6">
          <h4 class="text-h4 mb-2">
            Editar Usuario
          </h4>
          <div class="text-body-1">
            Actualice la información del usuario según sea necesario.
          </div>
        </div>

        <!-- 👉 Form -->
        <VForm
          ref="refForm"
          v-model="isFormValid"
          class="mt-4"
          @submit.prevent="onFormSubmit"
        >
          <VRow>
            <!-- 👉 Name -->
            <VCol 
              cols="12"
              md="6"
            >
              <VTextField
                v-model="name"
                :rules="[minLengthValidator(4)]"
                label="Nombres"
                placeholder="Juan"
              />
            </VCol>

            <!-- 👉 Lastname -->
            <VCol 
              cols="12"
              md="6"
              >
              <VTextField
                v-model="lastname"
                :rules="[minLengthValidator(4)]"
                label="Apellidos"
                placeholder="Pérez"
              />
            </VCol>

            <!-- 👉 Username -->
            <VCol cols="12">
              <VTextField
                v-model="username"
                :rules="[minLengthValidator(4)]"
                label="Usuario"
                placeholder="juanp"
              />
            </VCol>
            
            <!-- 👉 Email -->
            <VCol 
              cols="12"
              md="6"
            >
              <VTextField
                v-model="email"
                :rules="[emailValidator]"
                label="Email"
                placeholder="juan@mail.com"
              />
            </VCol>

            <!-- 👉 Contact -->
            <VCol 
              cols="12"
              md="6"
            >
              <VTextField
                v-model="contacto"
                :rules="[contactValidator]"
                label="Contacto"
                placeholder="123456789"
              />
            </VCol>
                       
            <!-- 👉 Role -->
            <VCol 
              cols="12"
              md="6"
              >
              <VSelect
                v-model="role"
                label="Seleccionar Rol"
                placeholder="Seleccionar Rol"
                :rules="[requiredSelectValidator]"
                :items="roles"
              />
            </VCol>             

            <!-- 👉 Status -->
            <VCol 
              cols="12"
              md="6"
              >
              <VSelect
                v-model="status"
                label="Seleccionar Estado"
                placeholder="Seleccionar Estado"
                :rules="[requiredSelectValidator]"
                :items="statusOptions"
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
            <VCol 
              cols="12"
              class="d-flex flex-wrap justify-center gap-4"
              >
              <VBtn
                type="submit"
                class="me-4"
                prepend-icon="ri-edit-line"
              >
                Actualizar
              </VBtn>
              <VBtn
                type="reset"
                variant="outlined"
                color="error"
                @click="onFormReset"
                prepend-icon="ri-close-fill"
              >
                Cancelar
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
