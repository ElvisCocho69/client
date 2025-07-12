<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { $api } from '@/utils/api'
import { ref, nextTick } from 'vue'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  }
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'category-created'
])

// Estados
const name = ref('')
const status = ref('ACTIVE')
const error = ref(null)
const success = ref(null)

// Estados disponibles
const statusOptions = [
  { title: 'Activo', value: 'ACTIVE' },
  { title: 'Inactivo', value: 'INACTIVE' },
]

// Validaciones
const minLengthValidator = (minLength) => (value) => {
  if (!value) return 'Este campo es requerido'
  if (value.length < minLength) return `Mínimo ${minLength} caracteres`
  return true
}

const requiredSelectValidator = (value) => {
  if (!value) return 'Por favor seleccione una opción'
  return true
}

const isFormValid = ref(false)
const refForm = ref()

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
        const categoryData = {
          name: name.value,
          status: status.value
        }

        const response = await $api('/materials/category', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: categoryData
        })

        success.value = 'Categoría creada correctamente'
        emit('category-created')
        
        setTimeout(() => {
          closeNavigationDrawer()
        }, 1500)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al crear la categoría'
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
      title="Añadir Categoría"
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
                  label="Nombre"
                  placeholder="Nombre de la categoría"
                  prepend-inner-icon="ri-folder-line"
                />
              </VCol>

              <!-- 👉 Status -->
              <VCol cols="12">
                <VSelect
                  v-model="status"
                  label="Estado"
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
                  prepend-icon="ri-add-line"
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

<style lang="scss" scoped>
.drawer-header {
  border-bottom: 1px solid rgb(var(--v-border-color));
}
</style> 