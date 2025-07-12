<script setup>
import { ref, onMounted, watch } from 'vue'
import { $api } from '@/utils/api'

const props = defineProps({
  customerData: {
    type: Object,
    required: true,
  },
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'customer-updated'
])

// Estados
const editedCustomer = ref({
  name: '',
  lastname: '',
  razonsocial: '',
  birthdate: '',
  documentnumber: '',
  email: '',
  contact: '',
  address: '',
  status: 'ENABLED',
})

const error = ref(null)
const success = ref(null)

// Validaciones
const minLengthValidator = (minLength) => (value) => {
  if (!value) return 'Este campo es requerido'
  if (value.length < minLength) return `Mínimo ${minLength} caracteres`
  return true
}

const razonSocialValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (value.length < 3) return 'La razón social debe tener al menos 3 caracteres'
  if (value.length > 30) return 'La razón social no puede tener más de 30 caracteres'
  if (!/^[a-zA-Z0-9\s.,&-]+$/.test(value)) return 'La razón social solo puede contener letras, números, espacios y los caracteres .,&-'
  return true
}

const contactValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (!/^\d{9}$/.test(value)) return 'El contacto debe tener exactamente 9 dígitos'
  return true
}

const addressValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (value.length < 5) return 'La dirección debe tener al menos 5 caracteres'
  if (value.length > 100) return 'La dirección no puede tener más de 100 caracteres'
  return true
}

const emailValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Por favor ingrese un email válido'
  return true
}

const birthdateValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  
  const birthDate = new Date(value)
  const today = new Date()
  
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  if (age < 18) return 'El cliente debe ser mayor de 18 años'
  if (birthDate > today) return 'La fecha de nacimiento no puede ser futura'
  
  return true
}

const requiredValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  return true
}

// Computed para determinar si es cliente jurídico
const isJuridico = computed(() => props.customerData?.clientType === 'JURIDICO')

// Función para cargar los datos del cliente
const loadCustomerData = () => {
  if (props.customerData) {
    // Formatear la fecha de nacimiento si existe
    let formattedBirthdate = ''
    if (props.customerData.birthdate) {
      const date = new Date(props.customerData.birthdate)
      formattedBirthdate = date.toISOString().split('T')[0]
    }

    editedCustomer.value = {
      name: props.customerData.name || '',
      lastname: props.customerData.lastname || '',
      razonsocial: props.customerData.razonsocial || '',
      birthdate: formattedBirthdate,
      documentnumber: props.customerData.documentnumber || '',
      email: props.customerData.email || '',
      contact: props.customerData.contact || '',
      address: props.customerData.address || '',
      status: props.customerData.clientStatus || 'ENABLED',
    }
  }
}

// Observar cambios en la visibilidad del drawer
watch(
  () => props.isDrawerOpen,
  (newValue) => {
    if (newValue) {
      loadCustomerData()
      error.value = null
      success.value = null
    }
  }
)

// Observar cambios en los datos del cliente
watch(
  () => props.customerData,
  () => {
    if (props.isDrawerOpen) {
      loadCustomerData()
    }
  }
)

const isFormValid = ref(false)
const refForm = ref()

const onFormSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      try {
        const dataToSend = {
          ...editedCustomer.value,
          clientType: props.customerData.clientType,
          status: editedCustomer.value.status
        }

        const response = await $api(`/clients/${props.customerData.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: dataToSend
        })

        success.value = 'Cliente actualizado correctamente'
        emit('customer-updated')
        
        setTimeout(() => {
          drawerVisibleUpdate(false)
        }, 1500)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al actualizar el cliente'
      }
    }
  })
}

const onFormReset = () => {
  refForm.value?.reset()
  refForm.value?.resetValidation()
  error.value = null
  success.value = null
  drawerVisibleUpdate(false)
}

const drawerVisibleUpdate = val => {
  emit('update:isDrawerOpen', val)
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.isDrawerOpen"
    @update:model-value="drawerVisibleUpdate"
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
            Editar Cliente
          </h4>
          <div class="text-body-1">
            Actualice la información del cliente según sea necesario.
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
            <template v-if="isJuridico">
              <!-- 👉 Business Name -->
              <VCol cols="12">
                <VTextField
                  v-model="editedCustomer.razonsocial"
                  :rules="[razonSocialValidator]"
                  label="Razón Social"
                  placeholder="Empresa S.A."
                  prepend-inner-icon="ri-community-line"
                />
              </VCol>

              <!-- 👉 Document Number -->
              <VCol cols="12">
                <VTextField
                  v-model="editedCustomer.documentnumber"
                  label="Número de RUC"
                  disabled
                  prepend-inner-icon="ri-hashtag"
                />
              </VCol>
            </template>

            <template v-else>
              <!-- 👉 First Name -->
              <VCol cols="12" md="6">
                <VTextField
                  v-model="editedCustomer.name"
                  :rules="[minLengthValidator(2)]"
                  label="Nombre"
                  placeholder="Juan"
                  prepend-inner-icon="ri-user-line"
                />
              </VCol>

              <!-- 👉 Last Name -->
              <VCol cols="12" md="6">
                <VTextField
                  v-model="editedCustomer.lastname"
                  :rules="[minLengthValidator(2)]"
                  label="Apellido"
                  placeholder="Pérez"
                  prepend-inner-icon="ri-user-line"
                />
              </VCol>

              <!-- 👉 Document Number -->
              <VCol cols="12">
                <VTextField
                  v-model="editedCustomer.documentnumber"
                  label="Número de DNI"
                  disabled
                  prepend-inner-icon="ri-hashtag"
                />
              </VCol>

              <!-- 👉 Birth Date -->
              <VCol cols="12">
                <VTextField
                  v-model="editedCustomer.birthdate"
                  :rules="[birthdateValidator]"
                  label="Fecha de Nacimiento"
                  type="date"
                  :max="new Date().toISOString().split('T')[0]"
                  prepend-inner-icon="ri-calendar-todo-line"
                />
              </VCol>
            </template>

            <!-- 👉 Email -->
            <VCol cols="12" md="6">
              <VTextField
                v-model="editedCustomer.email"
                :rules="[emailValidator]"
                label="Email"
                placeholder="cliente@example.com"
                prepend-inner-icon="ri-mail-line"
              />
            </VCol>

            <!-- 👉 Contact -->
            <VCol cols="12" md="6">
              <VTextField
                v-model="editedCustomer.contact"
                :rules="[contactValidator]"
                label="Contacto"
                placeholder="123456789"
                prepend-inner-icon="ri-phone-line"
              />
            </VCol>

            <!-- 👉 Address -->
            <VCol cols="12">
              <VTextField
                v-model="editedCustomer.address"
                :rules="[addressValidator]"
                label="Dirección"
                placeholder="Calle Principal 123"
                prepend-inner-icon="ri-road-map-line"
              />
            </VCol>

            <!-- 👉 Status -->
            <VCol cols="12">
              <VSelect
                v-model="editedCustomer.status"
                label="Estado"
                :items="[
                  { title: 'Activo', value: 'ENABLED' },
                  { title: 'Inactivo', value: 'DISABLED' }
                ]"
                item-title="title"
                item-value="value"
                :rules="[requiredValidator]"
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
            <VCol cols="12" class="d-flex flex-wrap justify-center gap-4">
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