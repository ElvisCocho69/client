<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { $api } from '@/utils/api'
import { ref, nextTick, onMounted } from 'vue'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  }
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'material-created'
])

// Estados
const name = ref('')
const description = ref('')
const measurementunit = ref(null)
const category = ref(null)
const supplier = ref(null)
const status = ref('ACTIVE')
const error = ref(null)
const success = ref(null)
const categories = ref([])
const suppliers = ref([])

// Estados disponibles
const statusOptions = [
  { title: 'Activo', value: 'ACTIVE' },
  { title: 'Inactivo', value: 'INACTIVE' },
]

// Unidades de medida disponibles
const measurementUnitOptions = [
  { title: 'Unidad', value: 'UNIT' },
  { title: 'Kilogramo', value: 'KILOGRAM' },
  { title: 'Gramo', value: 'GRAM' },
  { title: 'Miligramo', value: 'MILLIGRAM' },
  { title: 'Metro', value: 'METRE' },
  { title: 'Metro Cuadrado', value: 'SQUARE_METRE' },
  { title: 'Metro Cúbico', value: 'CUBIC_METRE' },
  { title: 'Centímetro', value: 'CENTIMETRE' },
  { title: 'Centímetro Cuadrado', value: 'SQUARE_CENTIMETRE' },
  { title: 'Centímetro Cúbico', value: 'CUBIC_CENTIMETRE' },
  { title: 'Milímetro', value: 'MILLIMETRE' },
  { title: 'Milímetro Cuadrado', value: 'SQUARE_MILLIMETRE' },
  { title: 'Milímetro Cúbico', value: 'CUBIC_MILLIMETRE' },
  { title: 'Litro', value: 'LITER'},
  { title: 'Miliitro', value: 'MILILITER'},
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

// Cargar categorías
const fetchCategories = async () => {
  try {
    const response = await $api('/materials/category?size=100')
    categories.value = response.content
  } catch (error) {
    console.error('Error al cargar categorías:', error)
  }
}

// Cargar proveedores
const fetchSuppliers = async () => {
  try {
    const response = await $api('/materials/supplier?size=100')
    suppliers.value = response.content
  } catch (error) {
    console.error('Error al cargar proveedores:', error)
  }
}

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
        const materialData = {
          name: name.value,
          description: description.value,
          measurementunit: measurementunit.value,
          materialcategory: { id: category.value },
          supplier: supplier.value ? { id: supplier.value } : null,
          status: status.value
        }

        const response = await $api('/materials', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: materialData
        })

        success.value = 'Material creado correctamente'
        emit('material-created')
        
        setTimeout(() => {
          closeNavigationDrawer()
        }, 1500)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al crear el material'
      }
    }
  })
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}

// Cargar datos al montar el componente
onMounted(() => {
  fetchCategories()
  fetchSuppliers()
})
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
      title="Nuevo Material"
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
                  placeholder="Nombre del material"
                  prepend-inner-icon="ri-tools-fill"
                />
              </VCol>

              <!-- 👉 Description -->
              <VCol cols="12">
                <VTextarea
                  v-model="description"
                  label="Descripción"
                  placeholder="Descripción del material"
                  prepend-inner-icon="ri-file-text-line"
                  rows="3"
                />
              </VCol>

              <!-- 👉 Measurement Unit -->
              <VCol cols="12">
                <VSelect
                  v-model="measurementunit"
                  :items="measurementUnitOptions"
                  label="Unidad de Medida"
                  placeholder="Seleccionar unidad de medida"
                  :rules="[requiredSelectValidator]"
                  prepend-inner-icon="ri-ruler-line"
                />
              </VCol>

              <!-- 👉 Category -->
              <VCol cols="12">
                <VSelect
                  v-model="category"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Categoría"
                  placeholder="Seleccionar categoría"
                  :rules="[requiredSelectValidator]"
                  prepend-inner-icon="ri-folder-line"
                />
              </VCol>

              <!-- 👉 Supplier -->
              <VCol cols="12">
                <VSelect
                  v-model="supplier"
                  :items="suppliers"
                  item-title="name"
                  item-value="id"
                  label="Proveedor"
                  placeholder="Seleccionar proveedor"
                  prepend-inner-icon="ri-building-line"
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
                  prepend-icon="ri-save-line"
                >
                  Crear
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