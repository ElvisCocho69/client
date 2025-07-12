<script setup>
import { ref, watch, onMounted } from 'vue'
import { $api } from '@/utils/api'

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
  'movement-registered'
])

// Estados
const movements = ref([])
const totalMovements = ref(0)
const loading = ref(false)
const error = ref(null)
const success = ref(null)

// Estados para el formulario de nuevo movimiento
const showNewMovementForm = ref(false)
const movementType = ref(null)
const quantity = ref(null)
const description = ref('')
const isFormValid = ref(false)
const refForm = ref()

// Opciones de tipo de movimiento
const movementTypeOptions = [
  { title: 'Entrada', value: 'IN' },
  { title: 'Salida', value: 'OUT' },
  { title: 'Ajuste', value: 'ADJUSTMENT' },
  { title: 'Pérdida', value: 'LOSS' },
  { title: 'Devolución', value: 'RETURN' },
]

// Validaciones
const requiredSelectValidator = (value) => {
  if (!value) return 'Por favor seleccione una opción'
  return true
}

const requiredNumberValidator = (value) => {
  if (!value) return 'Por favor ingrese una cantidad'
  if (value <= 0) return 'La cantidad debe ser mayor a 0'
  return true
}

// Función para obtener movimientos
const fetchMovements = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await $api(`/materials/movements/${props.materialData.code}?size=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    movements.value = response.content || []
    totalMovements.value = response.totalElements || 0
  } catch (err) {
    error.value = 'Error al cargar los movimientos'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

// Función para registrar un nuevo movimiento
const registerMovement = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      loading.value = true
      error.value = null
      success.value = null

      try {
        await $api(`/materials/movements/${props.materialData.code}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: {
            movementType: movementType.value,
            quantity: quantity.value,
            description: description.value,
            userId: JSON.parse(localStorage.getItem('user')).id
          }
        })

        success.value = 'Movimiento registrado correctamente'
        showNewMovementForm.value = false
        resetForm()
        fetchMovements()
        emit('movement-registered')
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al registrar el movimiento'
      } finally {
        loading.value = false
      }
    }
  })
}

// Función para resetear el formulario
const resetForm = () => {
  movementType.value = null
  quantity.value = null
  description.value = ''
  refForm.value?.reset()
  refForm.value?.resetValidation()
}

// Función para cerrar el diálogo
const closeDialog = () => {
  emit('update:isDialogVisible', false)
  showNewMovementForm.value = false
  resetForm()
  error.value = null
  success.value = null
}

// Función para formatear la fecha
const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

// Función para obtener el color según el tipo de movimiento
const getMovementTypeColor = (type) => {
  switch (type) {
    case 'IN':
    case 'RETURN':
      return 'success'
    case 'OUT':
    case 'LOSS':
      return 'error'
    case 'ADJUSTMENT':
      return 'warning'
    default:
      return 'primary'
  }
}

// Observar cambios en la visibilidad del diálogo
watch(() => props.isDialogVisible, (newVal) => {
  if (newVal) {
    fetchMovements()
  }
})

// Headers de la tabla
const headers = [
  {
    title: 'Fecha',
    key: 'movementdate',
    sortable: true,
  },
  {
    title: 'Tipo',
    key: 'movementtype',
    sortable: true,
  },
  {
    title: 'Cantidad',
    key: 'quantity',
    sortable: true,
  },
  {
    title: 'Descripción',
    key: 'description',
    sortable: true,
  },
]
</script>

<template>
  <VDialog
    v-model="props.isDialogVisible"
    max-width="900px"
    persistent
    @update:model-value="closeDialog"
  >
    <VCard>
      <!-- 👉 Header -->
      <VCardItem class="pb-4">
        <VCardTitle class="text-h5">
          Movimientos de {{ materialData.name }}
        </VCardTitle>
        <VCardSubtitle>
          Código: {{ materialData.code }}
        </VCardSubtitle>
      </VCardItem>

      <VDivider />

      <!-- 👉 Content -->
      <VCardText>
        <!-- 👉 Alerts -->
        <VAlert
          v-if="error"
          color="error"
          variant="tonal"
          class="mb-4"
        >
          {{ error }}
        </VAlert>

        <VAlert
          v-if="success"
          color="success"
          variant="tonal"
          class="mb-4"
        >
          {{ success }}
        </VAlert>

        <!-- 👉 New Movement Form -->
        <VExpansionPanels v-model="showNewMovementForm">
          <VExpansionPanel>
            <VExpansionPanelTitle>
              Registrar Nuevo Movimiento
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <VForm
                ref="refForm"
                v-model="isFormValid"
                @submit.prevent="registerMovement"
              >
                <VRow>
                  <!-- 👉 Movement Type -->
                  <VCol cols="12" md="6">
                    <VSelect
                      v-model="movementType"
                      :items="movementTypeOptions"
                      label="Tipo de Movimiento"
                      :rules="[requiredSelectValidator]"
                    />
                  </VCol>

                  <!-- 👉 Quantity -->
                  <VCol cols="12" md="6">
                    <VTextField
                      v-model="quantity"
                      type="number"
                      label="Cantidad"
                      :rules="[requiredNumberValidator]"
                    />
                  </VCol>

                  <!-- 👉 Description -->
                  <VCol cols="12">
                    <VTextarea
                      v-model="description"
                      label="Descripción"
                      rows="3"
                    />
                  </VCol>

                  <!-- 👉 Submit Button -->
                  <VCol cols="12" class="d-flex justify-end">
                    <VBtn
                      type="submit"
                      :loading="loading"
                      :disabled="loading"
                    >
                      Registrar Movimiento
                    </VBtn>
                  </VCol>
                </VRow>
              </VForm>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>

        <!-- 👉 Movements Table -->
        <VDataTable
          :headers="headers"
          :items="movements"
          :loading="loading"
          class="mt-4"
        >
          <!-- Date -->
          <template #item.movementdate="{ item }">
            {{ formatDate(item.movementdate) }}
          </template>

          <!-- Type -->
          <template #item.movementtype="{ item }">
            <VChip
              :color="getMovementTypeColor(item.movementtype)"
              size="small"
            >
              {{ movementTypeOptions.find(opt => opt.value === item.movementtype)?.title }}
            </VChip>
          </template>

          <!-- Quantity -->
          <template #item.quantity="{ item }">
            <span :class="item.movementtype === 'IN' || item.movementtype === 'RETURN' ? 'text-success' : 'text-error'">
              {{ item.movementtype === 'IN' || item.movementtype === 'RETURN' ? '+' : '-' }}{{ item.quantity }}
            </span>
          </template>
        </VDataTable>
      </VCardText>

      <!-- 👉 Footer -->
      <VCardActions>
        <VSpacer />
        <VBtn
          color="primary"
          variant="tonal"
          @click="showNewMovementForm = !showNewMovementForm"
        >
          {{ showNewMovementForm ? 'Cancelar' : 'Nuevo Movimiento' }}
        </VBtn>
        <VBtn
          color="secondary"
          variant="tonal"
          @click="closeDialog"
        >
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template> 