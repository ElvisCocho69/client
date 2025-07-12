<script setup>
import { ref, watch } from 'vue'
import { $api } from '@/utils/api'

const props = defineProps({
  supplier: {
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
  'supplier-updated'
])

// Estados
const name = ref('')
const contact = ref('')
const email = ref('')
const address = ref('')
const error = ref(null)
const success = ref(null)

// Validaciones
const minLengthValidator = (minLength) => (value) => {
  if (!value) return 'Este campo es requerido'
  if (value.length < minLength) return `Mínimo ${minLength} caracteres`
  return true
}

const phoneValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  const phoneRegex = /^\d{9}$/
  if (!phoneRegex.test(value)) return 'Debe ser un número de 9 dígitos'
  return true
}

const emailValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) return 'Correo electrónico inválido'
  return true
}

// Función para cargar los datos del proveedor
const loadSupplierData = () => {
  if (props.supplier) {
    name.value = props.supplier.name
    contact.value = props.supplier.contact
    email.value = props.supplier.email
    address.value = props.supplier.address
  }
}

// Observar cambios en la visibilidad del diálogo
watch(
  () => props.isDialogVisible,
  (newValue) => {
    if (newValue) {
      loadSupplierData()
      error.value = null
      success.value = null
    }
  }
)

// Observar cambios en los datos del proveedor
watch(
  () => props.supplier,
  () => {
    if (props.isDialogVisible) {
      loadSupplierData()
    }
  }
)

const isFormValid = ref(false)
const refForm = ref()

const onFormSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      try {
        const supplierData = {
          name: name.value,
          contact: contact.value,
          email: email.value,
          address: address.value
        }

        const response = await $api(`/materials/supplier/${props.supplier.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: supplierData
        })

        success.value = 'Proveedor actualizado correctamente'
        emit('supplier-updated')
        
        setTimeout(() => {
          dialogVisibleUpdate(false)
        }, 1500)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al actualizar el proveedor'
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
            Editar Proveedor
          </h4>
          <div class="text-body-1">
            Actualice la información del proveedor según sea necesario.
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
                label="Nombre"
                placeholder="Nombre del proveedor"
                prepend-inner-icon="ri-building-line"
              />
            </VCol>

            <!-- 👉 Contact -->
            <VCol 
              cols="12"
              md="6"
            >
              <VTextField
                v-model="contact"
                :rules="[phoneValidator]"
                label="Contacto"
                placeholder="Número de teléfono"
                prepend-inner-icon="ri-user-line"
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
                label="Correo"
                placeholder="correo@ejemplo.com"
                prepend-inner-icon="ri-mail-line"
              />
            </VCol>

            <!-- 👉 Address -->
            <VCol 
              cols="12"
              md="6"
            >
              <VTextField
                v-model="address"
                :rules="[minLengthValidator(4)]"
                label="Dirección"
                placeholder="Dirección del proveedor"
                prepend-inner-icon="ri-map-pin-line"
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