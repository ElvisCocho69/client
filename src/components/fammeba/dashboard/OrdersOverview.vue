<script setup>
import { ref, onMounted } from 'vue'
import { $api } from '@/utils/api'

const ordersData = ref([])
const totalOrders = ref(0)

const statusConfig = {
  'PENDIENTE': { title: 'Pendientes', icon: 'ri-calendar-2-line', color: { bg: 'rgb(var(--v-theme-warning))', text: 'rgb(var(--v-theme-on-primary))' } },
  'EN_PREPARACION': { title: 'En Preparación', icon: 'ri-wallet-3-line', color: { bg: 'rgb(var(--v-theme-info))', text: 'rgb(var(--v-theme-on-primary))' } },
  'ENTREGADO': { title: 'Entregadas', icon: 'ri-check-double-line', color: { bg: 'rgb(var(--v-theme-success))', text: 'rgb(var(--v-theme-on-primary))' } },
  'CANCELADO': { title: 'Canceladas', icon: 'ri-error-warning-line', color: { bg: 'rgb(var(--v-theme-error))', text: 'rgb(var(--v-theme-on-primary))' } },
}

const fetchOrdersOverview = async () => {
  try {
    const response = await $api('/orders?size=2000', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })

    const orders = response.content || []
    totalOrders.value = orders.length

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    ordersData.value = Object.keys(statusConfig).map(status => {
      const count = statusCounts[status] || 0
      const percentage = totalOrders.value > 0 ? ((count / totalOrders.value) * 100).toFixed(1) : 0
      
      return {
        status,
        count,
        percentage: parseFloat(percentage),
        ...statusConfig[status],
      }
    }).filter(item => item.count > 0)

  } catch (error) {
    console.error('Error fetching orders overview:', error)
  }
}

onMounted(fetchOrdersOverview)
</script>

<template>
  <VCard>
    <VCardItem title="Resumen de Órdenes" />
    <VCardText>
      <!-- Progress Bar Section -->
      <div class="d-flex mb-6">
        <div
          v-for="(item, index) in ordersData"
          :key="item.title"
          :style="`inline-size: ${item.percentage}%;`"
          v-show="item.percentage > 0"
        >
          <div class="orders-progress-label position-relative mb-5 text-body-1 d-none d-sm-block">
            {{ item.title }}
          </div>
          <VProgressLinear
            :color="item.color.bg"
            model-value="100"
            height="46"
            :rounded-bar="false"
            :rounded="false"
            :class="index === 0 ? 'rounded-s-lg' : index === ordersData.length - 1 ? 'rounded-e-lg' : ''"
          >
            <p
              class="text-sm font-weight-medium mb-0"
              :style="`color: ${item.color.text}`"
            >
              {{ item.percentage }}%
            </p>
          </VProgressLinear>
        </div>
      </div>

      <!-- Table Section -->
      <VTable class="text-no-wrap">
        <tbody>
          <tr
            v-for="item in ordersData"
            :key="item.status"
          >
            <td
              width="70%"
              class="ps-0"
              style="block-size: 48px;"
            >
              <div class="d-flex align-center text-high-emphasis">
                <VIcon
                  :icon="item.icon"
                  size="24"
                  class="me-2"
                  :color="item.color.bg"
                />
                <h6 class="text-h6 font-weight-regular">
                  {{ item.title }}
                </h6>
              </div>
            </td>
            <td>
              <h6 class="text-h6">
                {{ item.count }}
              </h6>
            </td>
            <td>
              <span class="text-body-1">{{ item.percentage }}%</span>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.orders-progress-label {
  padding-block-end: 0.875rem;

  &::after {
    position: absolute;
    display: inline-block;
    background-color: rgba(var(--v-theme-on-surface), var(--v-border-opacity));
    block-size: 10px;
    content: "";
    inline-size: 2px;
    inset-block-end: 0;
    inset-inline-start: 0;

    [dir="rtl"] & {
      inset-inline: unset 0;
    }
  }
}
</style>

<style lang="scss">
.v-progress-linear__content {
  justify-content: start;
  padding-inline-start: 1rem;
}

@media (max-width: 1080px) {
  .v-progress-linear__content {
    padding-inline-start: 0.75rem !important;
  }
}

@media (max-width: 576px) {
  .v-progress-linear__content {
    padding-inline-start: 0.3rem !important;
  }
}
</style>
