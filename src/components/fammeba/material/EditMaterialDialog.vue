<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { $api } from '@/utils/api'
import { ref, nextTick, onMounted, watch } from 'vue'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  materialData: {
    type: Object,
    required: true,
  }
})

const emit = defineEmits([
  'update:isDialogVisible',
  'material-edited'
])

// Estados
const name = ref('')
const description = ref('')
const measurementunit = ref(null)
const category = ref(null)
const supplier = ref(null)
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

// Cargar datos del material cuando se abre el diálogo
watch(() => props.isDialogVisible, (newVal) => {
  if (newVal && props.materialData) {
    name.value = props.materialData.name
    description.value = props.materialData.description
    measurementunit.value = props.materialData.measurementunit
    category.value = props.materialData.materialcategory?.id
    supplier.value = props.materialData.supplier?.id
    error.value = null
    success.value = null
  }
})

// Observar cambios en los datos del material
watch(() => props.materialData, () => {
  if (props.isDialogVisible) {
    name.value = props.materialData.name
    description.value = props.materialData.description
    measurementunit.value = props.materialData.measurementunit
    category.value = props.materialData.materialcategory?.id
    supplier.value = props.materialData.supplier?.id
    error.value = null
    success.value = null
  }
})

// 👉 dialog close
const closeDialog = () => {
  dialogVisibleUpdate(false)
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
          supplier: supplier.value ? { id: supplier.value } : null
        }

        const response = await $api(`/materials/${props.materialData.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: materialData
        })

        success.value = 'Material actualizado correctamente'
        emit('material-edited')
        
        setTimeout(() => {
          dialogVisibleUpdate(false)
        }, 1500)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al actualizar el material'
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

// Cargar datos al montar el componente
onMounted(() => {
  fetchCategories()
  fetchSuppliers()
})
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
            Editar Material
          </h4>
          <div class="text-body-1">
            Actualice la información del material según sea necesario.
          </div>
        </div>

        <!-- 👉 Form -->
        <VForm
          ref="refForm"
          v-model="isFormValid"
          class="mt-4"
          @submit.prevent="onSubmit"
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
                placeholder="Nombre del material"
                prepend-inner-icon="ri-tools-fill"
              />
            </VCol>

            <!-- 👉 Measurement Unit -->
            <VCol 
              cols="12"
              md="6"
            >
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
            <VCol 
              cols="12"
              md="6"
            >
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
            <VCol 
              cols="12"
              md="6"
            >
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