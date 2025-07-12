<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { ref, nextTick, computed } from 'vue'
import { $api } from '@/utils/api'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:isDrawerOpen', 'customer-created'])

const isFormValid = ref(false)
const refForm = ref()
const error = ref(null)
const success = ref(null)

const customerData = ref({
  documentType: '',
  email: '',
  contact: '',
  address: '',
  documentnumber: '',
  status: 'ENABLED',
  // Campos para cliente natural
  name: '',
  lastname: '',
  birthdate: '',
  // Campos para cliente jurídico
  razonsocial: '',
})

const documentTypes = [
  { title: 'DNI', value: 'DNI' },
  { title: 'RUC', value: 'RUC' },
]

const isJuridico = computed(() => customerData.value.documentType === 'RUC')

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

const documentNumberValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (!/^\d+$/.test(value)) return 'El número de documento debe contener solo números'
  if (isJuridico.value && !/^\d{11}$/.test(value)) return 'El RUC debe tener 11 dígitos'
  if (!isJuridico.value && !/^\d{8}$/.test(value)) return 'El DNI debe tener 8 dígitos'
  return true
}

const requiredValidator = (value) => {
  if (!value) return 'Este campo es requerido'
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

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
    error.value = null
    success.value = null
    customerData.value.documentType = ''
  })
}

const onSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      try {
        const dataToSend = {
          ...customerData.value,
          clientType: isJuridico.value ? 'JURIDICO' : 'NATURAL' 
        }
        
        delete dataToSend.documentType

        const response = await $api('/clients', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: dataToSend
        })

        success.value = 'Cliente creado correctamente'
        emit('customer-created')
        
        setTimeout(() => {
          closeNavigationDrawer()
        }, 1500)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al crear el cliente'
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
      title="Añadir Cliente"
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
              <!-- 👉 Document Type -->
              <VCol cols="12">
                <VSelect
                  v-model="customerData.documentType"
                  :rules="[requiredValidator]"
                  label="Tipo de Documento"
                  :items="documentTypes"
                  item-title="title"
                  item-value="value"
                  prepend-inner-icon="ri-file-copy-2-line"
                />
              </VCol>

              <template v-if="customerData.documentType">
                <template v-if="isJuridico">
                  <!-- 👉 Business Name -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.razonsocial"
                      :rules="[razonSocialValidator]"
                      label="Razón Social"
                      placeholder="Empresa S.A."
                      prepend-inner-icon="ri-community-line"
                    />
                  </VCol>

                  <!-- 👉 RUC Number -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.documentnumber"
                      :rules="[documentNumberValidator]"
                      label="Número de RUC"
                      placeholder="20123456789"
                      prepend-inner-icon="ri-hashtag"
                    />
                  </VCol>

                  <!-- 👉 Email -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.email"
                      :rules="[emailValidator]"
                      label="Email"
                      placeholder="empresa@example.com"
                      prepend-inner-icon="ri-mail-line"
                    />
                  </VCol>

                  <!-- 👉 Contact -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.contact"
                      :rules="[contactValidator]"
                      label="Contacto"
                      placeholder="123456789"
                      prepend-inner-icon="ri-phone-line"
                    />
                  </VCol>

                  <!-- 👉 Address -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.address"
                      :rules="[addressValidator]"
                      label="Dirección"
                      placeholder="Calle Principal 123"
                      prepend-inner-icon="ri-road-map-line"
                    />
                  </VCol>
                </template>

                <template v-else>
                  <!-- 👉 First Name -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.name"
                      :rules="[minLengthValidator(2)]"
                      label="Nombre"
                      placeholder="Juan"
                      prepend-inner-icon="ri-user-line"
                    />
                  </VCol>

                  <!-- 👉 Last Name -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.lastname"
                      :rules="[minLengthValidator(2)]"
                      label="Apellido"
                      placeholder="Pérez"
                      prepend-inner-icon="ri-user-line"
                    />
                  </VCol>

                  <!-- 👉 Document Number -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.documentnumber"
                      :rules="[documentNumberValidator]"
                      label="Número de DNI"
                      placeholder="12345678"
                      prepend-inner-icon="ri-hashtag"
                    />
                  </VCol>

                  <!-- 👉 Birth Date -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.birthdate"
                      :rules="[birthdateValidator]"
                      label="Fecha de Nacimiento"
                      type="date"
                      :max="new Date().toISOString().split('T')[0]"
                      prepend-inner-icon="ri-calendar-todo-line"
                    />
                  </VCol>

                  <!-- 👉 Email -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.email"
                      :rules="[emailValidator]"
                      label="Email"
                      placeholder="juan@example.com"
                      prepend-inner-icon="ri-mail-line"
                    />
                  </VCol>

                  <!-- 👉 Contact -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.contact"
                      :rules="[contactValidator]"
                      label="Contacto"
                      placeholder="123456789"
                      prepend-inner-icon="ri-phone-line"
                    />
                  </VCol>

                  <!-- 👉 Address -->
                  <VCol cols="12">
                    <VTextField
                      v-model="customerData.address"
                      :rules="[addressValidator]"
                      label="Dirección"
                      placeholder="Calle Principal 123"
                      prepend-inner-icon="ri-road-map-line"
                    />
                  </VCol>
                </template>

                <!-- 👉 Status -->
                <VCol cols="12">
                  <VSelect
                    v-model="customerData.status"
                    label="Estado"
                    :items="[
                      { title: 'Activo', value: 'ENABLED' },
                      { title: 'Inactivo', value: 'DISABLED' }
                    ]"
                    item-title="title"
                    item-value="value"
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
              </template>

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