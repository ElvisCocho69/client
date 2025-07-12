<!-- eslint-disable vue/no-mutating-props -->
<script setup>
import { computed, watch } from 'vue'
import { $api } from '@/utils/api'

const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
  data: {
    type: Object,
    required: true,
    default: () => ({
      id: null,
      quantity: 1,
      unitprice: 0,
      cancellationreason: null,
      orderId: null,
      structure: {
        id: null,
        name: '',
        description: '',
        colors: '',
        materials: '',
        startdate: null,
        estimatedenddate: null,
        realenddate: null,
        observations: '',
        orderdetailId: null
      }
    }),
  },
  isEditMode: {
    type: Boolean,
    required: false,
    default: false,
  },
})

// Reglas de validación
const requiredField = (value) => {
  if (!value || value.trim() === '') return 'Este campo es requerido'
  return true
}

const numberGreaterThanZero = (value) => {
  if (!value) return 'Este campo es requerido'
  if (value <= 0) return 'El valor debe ser mayor a 0'
  return true
}

const dateValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  return true
}

const emit = defineEmits([
  'remove',
  'update:data'
])

// Usar computed para los datos locales
const localProductData = computed({
  get: () => ({...props.data}), 
  set: (value) => {
    emit('update:data', {
      id: props.index,
      data: {...value} 
    })
  }
})

// Observar cambios en las props para actualizar los datos locales
watch(() => props.data, (newValue) => {
  if (JSON.stringify(newValue) !== JSON.stringify(localProductData.value)) {
    emit('update:data', {
      id: props.index,
      data: {...newValue} // Emitir una copia del valor
    })
  }
}, { deep: true })

// Función para actualizar un campo específico
const updateField = async (field, value) => {
  const newData = {
    ...localProductData.value,
    [field]: value
  }

  if (props.data.id) {
    try {
      const updateData = {
        [field]: value
      }

      await $api(`/order-details/${props.data.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
    } catch (error) {
      console.error('Error al actualizar el detalle:', error)
      return
    }
  }

  // Actualizamos el estado local
  emit('update:data', {
    id: props.index,
    data: newData
  })
}

// Función para actualizar un campo de la estructura
const updateStructureField = async (field, value) => {
  const newData = {
    ...localProductData.value,
    structure: {
      ...localProductData.value.structure,
      [field]: value
    }
  }

  if (props.data.id) {
    try {
      const updateData = {
        structure: {
          id: localProductData.value.structure.id,
          [field]: value
        }
      }

      await $api(`/order-details/${props.data.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
    } catch (error) {
      console.error('Error al actualizar la estructura:', error)
      return
    }
  }

  // Actualizamos el estado local
  emit('update:data', {
    id: props.index,
    data: newData
  })
}

const removeProduct = () => {
  emit('remove', props.index)
}
</script>

<template>
  <div class="add-products-header mb-2 d-none d-md-flex mb-4">
    <VRow class="me-10">
      <VCol cols="12">
        <h6 class="text-h6">
          Estructura
        </h6>
      </VCol>
    </VRow>
  </div>

  <VCard
    flat
    border
    class="d-flex flex-sm-row flex-column-reverse mb-4"
  >
    <!-- 👉 Left Form -->
    <div class="pa-5 flex-grow-1">
      <!-- Detalles de la Orden -->
      <VRow class="mb-2">
        <VCol :cols="12" :md="isEditMode ? 6 : 6">
          <VTextField
            :model-value="localProductData.quantity"
            type="number"
            label="Cantidad"
            min="1"
            class="mb-2"
            :rules="[numberGreaterThanZero]"
            @update:model-value="updateField('quantity', $event)"
          />
        </VCol>
        <VCol :cols="12" :md="isEditMode ? 6 : 6">
          <VTextField
            :model-value="localProductData.unitprice"
            type="number"
            label="Precio Unitario"
            min="0"
            prefix="S/."
            class="mb-2"
            :rules="[numberGreaterThanZero]"
            @update:model-value="updateField('unitprice', $event)"
          />
        </VCol>
      </VRow>

      <!-- Detalles de la Estructura -->
      <VRow class="mb-2">
        <VCol cols="12" md="6">
          <VTextField
            :model-value="localProductData.structure.name"
            label="Nombre de la Estructura"
            placeholder="Ej: Columna Principal"
            class="mb-2"
            :rules="[requiredField]"
            @update:model-value="updateStructureField('name', $event)"
          />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField
            :model-value="localProductData.structure.description"
            label="Descripción"
            placeholder="Descripción de la estructura"
            class="mb-2"
            :rules="[requiredField]"
            @update:model-value="updateStructureField('description', $event)"
          />
        </VCol>
      </VRow>

      <VRow class="mb-2">
        <VCol cols="12" md="6">
          <VTextField
            :model-value="localProductData.structure.colors"
            label="Colores"
            placeholder="Ej: Rojo, Azul"
            class="mb-2"
            :rules="[requiredField]"
            @update:model-value="updateStructureField('colors', $event)"
          />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField
            :model-value="localProductData.structure.materials"
            label="Materiales"
            placeholder="Ej: Madera, Metal"
            class="mb-2"
            :rules="[requiredField]"
            @update:model-value="updateStructureField('materials', $event)"
          />
        </VCol>
      </VRow>

      <VRow class="mb-2">
        <VCol cols="12" md="6">
          <AppDateTimePicker
            :model-value="localProductData.structure.startdate"
            label="Fecha de Inicio"
            placeholder="YYYY-MM-DD"
            class="mb-2"
            :rules="[dateValidator]"
            @update:model-value="updateStructureField('startdate', $event)"
          />
        </VCol>
        <VCol cols="12" md="6">
          <AppDateTimePicker
            :model-value="localProductData.structure.estimatedenddate"
            label="Fecha Estimada de Finalización"
            placeholder="YYYY-MM-DD"
            class="mb-2"
            :rules="[dateValidator]"
            @update:model-value="updateStructureField('estimatedenddate', $event)"
          />
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12">
          <VTextarea
            :model-value="localProductData.structure.observations"
            rows="3"
            label="Observaciones"
            placeholder="Observaciones adicionales sobre la estructura"
            class="mb-2"
            @update:model-value="updateStructureField('observations', $event)"
          />
        </VCol>
      </VRow>
    </div>

    <!-- 👉 Item Actions -->
    <div
      class="d-flex flex-column align-end item-actions"
      :class="$vuetify.display.smAndUp ? 'border-s' : 'border-b' "
    >
      <IconBtn @click="removeProduct">
        <VIcon
          :size="24"
          icon="ri-close-line"
        />
      </IconBtn>
    </div>
  </VCard>
</template>

<style scoped>
.add-products-header {
  position: relative;
}
</style>
