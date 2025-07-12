<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { ref, nextTick, watch } from 'vue'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  orderData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:isDrawerOpen', 'order-updated'])

const isFormValid = ref(false)
const refForm = ref()
const error = ref(null)
const success = ref(null)

const editedOrderData = ref({
  customerId: '',
  orderDate: '',
  estimatedDeliveryDate: '',
  description: '',
  specialNotes: '',
  status: '',
  subtotal: 0,
  igv: 0,
  total: 0,
})

// Datos de ejemplo para el select de clientes
const customers = [
  { title: 'Juan Pérez', value: 1 },
  { title: 'María García', value: 2 },
  { title: 'Carlos López', value: 3 },
]

const orderStatus = [
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'En Preparación', value: 'EN_PREPARACION' },
  { title: 'Listo para Entrega', value: 'LISTO_ENTREGA' },
  { title: 'Entregado', value: 'ENTREGADO' },
  { title: 'Cancelado', value: 'CANCELADO' },
]

// Validaciones
const requiredValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  return true
}

const numberValidator = (value) => {
  if (!value) return 'Este campo es requerido'
  if (isNaN(value)) return 'Debe ser un número válido'
  if (value < 0) return 'El valor no puede ser negativo'
  return true
}

const calculateTotals = () => {
  const subtotal = parseFloat(editedOrderData.value.subtotal) || 0
  editedOrderData.value.igv = subtotal * 0.18
  editedOrderData.value.total = subtotal + editedOrderData.value.igv
}

// Observar cambios en orderData y actualizar el formulario
watch(() => props.orderData, (newOrderData) => {
  if (newOrderData) {
    editedOrderData.value = { ...newOrderData }
  }
}, { immediate: true })

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

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      // Aquí iría la llamada a la API cuando se implemente
      console.log('Datos del pedido actualizados:', editedOrderData.value)
      
      success.value = 'Pedido actualizado correctamente'
      emit('order-updated')
      
      setTimeout(() => {
        closeNavigationDrawer()
      }, 1500)
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
      title="Editar Pedido"
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
              <!-- 👉 Cliente -->
              <VCol cols="12">
                <VSelect
                  v-model="editedOrderData.customerId"
                  :rules="[requiredValidator]"
                  label="Cliente"
                  :items="customers"
                  item-title="title"
                  item-value="value"
                />
              </VCol>

              <!-- 👉 Fecha del Pedido -->
              <VCol cols="12">
                <VTextField
                  v-model="editedOrderData.orderDate"
                  :rules="[requiredValidator]"
                  label="Fecha del Pedido"
                  type="date"
                />
              </VCol>

              <!-- 👉 Fecha de Entrega Estimada -->
              <VCol cols="12">
                <VTextField
                  v-model="editedOrderData.estimatedDeliveryDate"
                  :rules="[requiredValidator]"
                  label="Fecha de Entrega Estimada"
                  type="date"
                />
              </VCol>

              <!-- 👉 Descripción -->
              <VCol cols="12">
                <VTextarea
                  v-model="editedOrderData.description"
                  :rules="[requiredValidator]"
                  label="Descripción"
                  rows="4"
                  placeholder="Descripción detallada del pedido"
                />
              </VCol>

              <!-- 👉 Notas Especiales -->
              <VCol cols="12">
                <VTextField
                  v-model="editedOrderData.specialNotes"
                  label="Notas Especiales"
                  placeholder="Instrucciones especiales o comentarios adicionales"
                />
              </VCol>

              <!-- 👉 Estado -->
              <VCol cols="12">
                <VSelect
                  v-model="editedOrderData.status"
                  :rules="[requiredValidator]"
                  label="Estado"
                  :items="orderStatus"
                  item-title="title"
                  item-value="value"
                />
              </VCol>

              <!-- 👉 Subtotal -->
              <VCol cols="12">
                <VTextField
                  v-model="editedOrderData.subtotal"
                  :rules="[numberValidator]"
                  label="Subtotal"
                  type="number"
                  prefix="S/"
                  @update:model-value="calculateTotals"
                />
              </VCol>

              <!-- 👉 IGV -->
              <VCol cols="12">
                <VTextField
                  v-model="editedOrderData.igv"
                  label="IGV (18%)"
                  type="number"
                  prefix="S/"
                  readonly
                  disabled
                />
              </VCol>

              <!-- 👉 Total -->
              <VCol cols="12">
                <VTextField
                  v-model="editedOrderData.total"
                  label="Total"
                  type="number"
                  prefix="S/"
                  readonly
                  disabled
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
                  Actualizar Pedido
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