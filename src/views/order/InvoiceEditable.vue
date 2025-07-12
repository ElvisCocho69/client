<script setup>
import InvoiceProductEdit from '@/views/order/InvoiceProductEdit.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useRouter } from 'vue-router'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  clients: {
    type: Array,
    required: false,
    default: () => [],
  },
  selectedClientId: {
    type: [String, Number, null],
    required: false,
    default: null,
  },
  errors: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  isEditMode: {
    type: Boolean,
    required: false,
    default: false,
  },
  statusOptions: {
    type: Array,
    required: false,
    default: () => [],
  }
})

const emit = defineEmits([
  'push',
  'remove',
  'update-client',
  'update:data',
  'update:status'
])

const orderData = computed({
  get: () => props.data,
  set: (value) => emit('update:data', value)
})

const router = useRouter()

// Filtrar solo clientes activos
const activeClients = computed(() => {
  return props.clients.filter(client => client.status === 'ENABLED')
})

// Validación de fecha de entrega
const deliveryDateRules = computed(() => {
  return [
    v => !!v || 'Campo requerido',
    v => {
      if (!v || !orderData.value.orderdate) return true
      const deliveryDate = new Date(v)
      const orderDate = new Date(orderData.value.orderdate)
      return deliveryDate >= orderDate || 'Fecha Inválida'
    }
  ]
})

const handleClientSelect = (clientId) => {
  emit('update-client', clientId)
}

// 👉 Add item function
const addItem = () => {
  const newData = {
    ...props.data,
    orderDetails: [
      ...props.data.orderDetails,
      {
        quantity: 1,
        unitprice: 0,
        structure: {
          name: '',
          description: '',
          colors: '',
          materials: '',
          startdate: null,
          estimatedenddate: null,
          observations: ''
        }
      }
    ]
  }
  emit('update:data', newData)
}

const removeProduct = id => {
  const newData = {
    ...props.data,
    orderDetails: props.data.orderDetails.filter((_, index) => index !== id)
  }
  emit('update:data', newData)
}

const updateProduct = ({ id, data }) => {
  const newData = {
    ...props.data,
    orderDetails: props.data.orderDetails.map((item, index) => 
      index === id ? data : item
    )
  }
  emit('update:data', newData)
}

const internalSelectedClientId = computed({
  get: () => props.selectedClientId,
  set: (val) => emit('update-client', val),
})

const selectedClient = computed(() => props.clients.find(c => c.value === props.selectedClientId))

const goToCustomers = () => {
  router.push({ name: 'customers' })
}

// Calcular el total
const calculateTotal = computed(() => {
  return orderData.value.orderDetails.reduce((total, detail) => {
    return total + (detail.quantity * detail.unitprice)
  }, 0)
})

watch(calculateTotal, (newTotal) => {
  orderData.value.totalprice = newTotal
}, { immediate: true })

const internalStatus = computed({
  get: () => orderData.value.status,
  set: (val) => {
    orderData.value = {
      ...orderData.value,
      status: val
    }
  }
})
</script>

<template>
  <VCard class="pa-sm-12 pa-6">
    <!-- SECTION Header -->
    <div class="d-flex flex-wrap justify-space-between flex-column rounded bg-var-theme-background flex-sm-row gap-6 pa-6 mb-6">
      <!-- 👉 Left Content -->
      <div>
        <div class="app-logo mb-6">
          <VNodeRenderer :nodes="themeConfig.app.logo" />
          <h1 class="app-logo-title">
            {{ themeConfig.app.title }}
          </h1>
        </div>

        <!-- 👉 Address -->
        <p class="text-high-emphasis mb-0 text-body-1">
          Oficina 237, Av. América Sur 1234, Urb. La Merced
        </p>
        <p class="text-high-emphasis mb-0 text-body-1">
          Trujillo, La Libertad 13007, Perú
        </p>
        <p class="text-high-emphasis mb-0 text-body-1">
          +51 44 123 4567, +51 944 987 654
        </p>
      </div>

      <!-- 👉 Right Content -->
      <div class="d-flex gap-2 flex-column">
        <!-- 👉 Order Date -->
        <div class="d-flex align-start align-sm-center justify-sm-end flex-column flex-sm-row">
          <span class="text-high-emphasis me-4" style="inline-size: 7rem;">Fecha Pedido:</span>
          <span style="inline-size: 9.5rem;">
            <AppDateTimePicker
              v-model="orderData.orderdate"
              density="compact"
              placeholder="YYYY-MM-DD"
              :config="{ position: 'auto right' }"
              :error-messages="errors.orderdate"
              required
            />
          </span>
        </div>

        <!-- 👉 Delivery Date -->
        <div class="d-flex align-start align-sm-center justify-sm-end flex-column flex-sm-row">
          <span class="text-high-emphasis me-4" style="inline-size: 7rem;">Fecha Entrega:</span>
          <span style="min-inline-size: 9.5rem;">
            <AppDateTimePicker
              v-model="orderData.deliverydate"
              density="compact"
              placeholder="YYYY-MM-DD"
              :config="{ position: 'auto right' }"
              :error-messages="errors.deliverydate"
              :rules="deliveryDateRules"
              required
            />
          </span>
        </div>
      </div>
    </div>

    <!-- 👉 Cliente Section -->
    <div style="max-width: 400px;">
      <VCol class="text-no-wrap" style="padding-left: 0; padding-right: 0;">
        <h6 class="text-h6 mb-4">Cliente:</h6>
        <VRow class="mb-4" align="center">
          <VCol cols="8">
            <VAutocomplete
              v-model="internalSelectedClientId"
              :items="activeClients"
              item-title="title"
              item-value="value"
              placeholder="Seleccionar Cliente"
              class="mb-0"
              style="inline-size: 100%;"
              :error-messages="errors.clientId"
              required
              :filter="(item, queryText, itemText) => {
                const searchText = queryText.toLowerCase()
                return itemText.toLowerCase().includes(searchText)
              }"
            />
          </VCol>
          <VCol cols="4" class="d-flex align-center">
            <VBtn 
              prepend-icon="ri-user-add-fill"
              @click="goToCustomers"
              style="min-width: 150px;"
            >
              Añadir Cliente
            </VBtn>
          </VCol>
        </VRow>
        <template v-if="selectedClient">
          <p class="mb-0 text-body-1" v-if="selectedClient.clientType === 'NATURAL'">
            {{ selectedClient.name }} {{ selectedClient.lastname }}
          </p>
          <p class="mb-0 text-body-1" v-if="selectedClient.clientType === 'JURIDICO'">
            {{ selectedClient.razonsocial }}
          </p>
          <p class="mb-0 text-body-1">{{ selectedClient.address }}</p>
          <p class="mb-0 text-body-1" v-if="selectedClient.clientType === 'NATURAL'">
            DNI: {{ selectedClient.documentnumber }}
          </p>
          <p class="mb-0 text-body-1" v-if="selectedClient.clientType === 'JURIDICO'">
            RUC: {{ selectedClient.documentnumber }}
          </p>
          <p class="mb-0 text-body-1">{{ selectedClient.contact }}</p>
          <p class="mb-0 text-body-1">{{ selectedClient.email }}</p>
        </template>
      </VCol>
    </div>

    <!-- 👉 Estado del Pedido (solo en modo edición) -->
    <template v-if="isEditMode">
      <VDivider class="my-6 border-dashed" />
      <div class="mb-6">
        <h6 class="text-h6 mb-4">Estado del Pedido:</h6>
        <VSelect
          v-model="internalStatus"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          style="max-width: 300px"
          density="compact"
        />
        
        <!-- Campo de razón de cancelación -->
        <VTextField
          v-if="orderData.status === 'CANCELADO'"
          v-model="orderData.cancellationreason"
          label="Razón de Cancelación"
          placeholder="Ingrese el motivo de la cancelación"
          class="mt-4"
          style="max-width: 500px"
          :rules="[v => !!v || 'La razón de cancelación es obligatoria']"
          required
        />
      </div>
    </template>

    <VDivider class="my-6 border-dashed" />

    <!-- 👉 Description and Special Notes -->
    <VRow>
      <VCol cols="12" md="6">
        <VTextarea
          v-model="orderData.description"
          label="Descripción"
          placeholder="Descripción detallada del pedido"
          rows="3"
        />
      </VCol>
      <VCol cols="12" md="6">
        <VTextarea
          v-model="orderData.specialnotes"
          label="Notas Especiales"
          placeholder="Notas o instrucciones especiales"
          rows="3"
        />
      </VCol>
    </VRow>

    <VDivider class="my-6 border-dashed" />

    <!-- 👉 Add purchased products -->
    <div class="add-products-form">
      <InvoiceProductEdit
        v-for="(item, index) in orderData.orderDetails"
        :key="index"
        :index="index"
        :data="item"
        :is-edit-mode="isEditMode"
        @remove="removeProduct"
        @update:data="updateProduct"
      />

      <VBtn
        v-if="!isEditMode"
        size="small"
        prepend-icon="ri-add-line"
        @click="addItem"
        class="mt-4"
      >
        Añadir Estructura
      </VBtn>
    </div>

    <VDivider class="my-6 border-dashed" />

    <!-- 👉 Total Amount -->
    <div class="d-flex justify-space-between flex-wrap flex-column flex-sm-row">
      <div class="mb-6 mb-sm-0">
        <h6 class="text-h6 mb-4"></h6>
      </div>

      <div>
        <table class="w-100">
          <tbody>
            <tr>
              <td class="pe-16 text-body-1">Subtotal:</td>
              <td :class="$vuetify.locale.isRtl ? 'text-start' : 'text-end'">
                <h6 class="text-h6">S/. {{ (calculateTotal / 1.18).toFixed(2) }}</h6>
              </td>
            </tr>
            <tr>
              <td class="pe-16 text-body-1">IGV (18%):</td>
              <td :class="$vuetify.locale.isRtl ? 'text-start' : 'text-end'">
                <h6 class="text-h6">S/. {{ (calculateTotal - (calculateTotal / 1.18)).toFixed(2) }}</h6>
              </td>
            </tr>
          </tbody>
        </table>

        <VDivider class="my-2" />

        <table class="w-100">
          <tbody>
            <tr>
              <td class="pe-16 text-body-1">Total:</td>
              <td :class="$vuetify.locale.isRtl ? 'text-start' : 'text-end'">
                <h6 class="text-h6">S/. {{ calculateTotal.toFixed(2) }}</h6>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 👉 Error de servidor si existe -->
    <VAlert
      v-if="errors.server"
      type="error"
      class="mt-4"
      closable
    >
      {{ errors.server }}
    </VAlert>

    <!-- 👉 Error de detalles de orden si existe -->
    <VAlert
      v-if="errors.orderDetails"
      type="error"
      class="mt-4"
      closable
    >
      {{ errors.orderDetails }}
    </VAlert>
  </VCard>
</template>

<style scoped>
.app-logo {
  display: flex;
  align-items: center;
  column-gap: 0.5rem;

  .app-logo-title {
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.27px;
    line-height: 1.5rem;
    text-transform: capitalize;
  }
}
</style>
