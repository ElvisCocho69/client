<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  design: {
    type: Object,
    required: false,
    default: null
  },
})

const emit = defineEmits(['update:isDialogVisible'])

const dialogVisible = ref(props.isDialogVisible)

watch(() => props.isDialogVisible, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:isDialogVisible', val)
})

// Calcular el progreso total
const calculateProgress = computed(() => {
  if (!props.design) return 0
  
  const totalSteps = 5 // Total de pasos en el proceso
  const completedSteps = [
    props.design.designApproved,
    props.design.materialSelected,
    props.design.productionStarted,
    props.design.qualityCheck,
    props.design.completed
  ].filter(Boolean).length

  return (completedSteps / totalSteps) * 100
})

// Definir los pasos del timeline
const timelineSteps = [
  {
    title: 'Diseño Aprobado',
    icon: 'ri-check-double-line',
    color: 'success',
    completed: computed(() => props.design?.designApproved),
    date: '2 meses atrás',
    description: 'El diseño ha sido aprobado por el cliente y está listo para continuar con el siguiente paso.'
  },
  {
    title: 'Material Seleccionado',
    icon: 'ri-shopping-cart-line',
    color: 'info',
    completed: computed(() => props.design?.materialSelected),
    date: '1 mes atrás',
    description: 'Los materiales necesarios han sido seleccionados y están listos para la producción.'
  },
  {
    title: 'Producción Iniciada',
    icon: 'ri-tools-line',
    color: 'warning',
    completed: computed(() => props.design?.productionStarted),
    date: '2 semanas atrás',
    description: 'El proceso de producción ha comenzado según lo planificado.'
  },
  {
    title: 'Control de Calidad',
    icon: 'ri-shield-check-line',
    color: 'primary',
    completed: computed(() => props.design?.qualityCheck),
    date: '1 semana atrás',
    description: 'Se está realizando el control de calidad del producto.'
  },
  {
    title: 'Completado',
    icon: 'ri-flag-line',
    color: 'success',
    completed: computed(() => props.design?.completed),
    date: 'Hoy',
    description: 'El proyecto ha sido completado exitosamente.'
  }
]
</script>

<template>
  <VDialog
    v-model="dialogVisible"
    max-width="800px"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center pa-6">
        <span class="text-h5">Progreso del Diseño</span>
        <VBtn
          icon
          variant="text"
          color="default"
          size="small"
          @click="dialogVisible = false"
        >
          <VIcon icon="ri-close-line" />
        </VBtn>
      </VCardTitle>

      <VCardText class="pa-6">
        <!-- Barra de progreso general -->
        <div class="mb-6">
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-1">Progreso Total</span>
            <span class="text-body-1">{{ Math.round(calculateProgress) }}%</span>
          </div>
          <VProgressLinear
            :model-value="calculateProgress"
            color="primary"
            height="10"
            rounded
          />
        </div>

        <!-- Timeline -->
        <VTimeline
          align="start"
          line-inset="16"
          truncate-line="start"
          justify="center"
          :density="$vuetify.display.smAndDown ? 'compact' : 'default'"
          class="mt-4"
        >
          <VTimelineItem
            v-for="(step, index) in timelineSteps"
            :key="index"
            fill-dot
            size="small"
          >
            <template #opposite>
              <span class="app-timeline-meta">
                {{ step.date }}
              </span>
            </template>
            <template #icon>
              <div class="v-timeline-avatar-wrapper rounded-circle">
                <VAvatar
                  size="32"
                  :color="step.completed ? step.color : 'grey'"
                  variant="tonal"
                >
                  <VIcon
                    :icon="step.icon"
                    size="20"
                  />
                </VAvatar>
              </div>
            </template>
            <VCard class="mb-10 mt-n4">
              <VCardItem class="pb-4">
                <VCardTitle>{{ step.title }}</VCardTitle>
              </VCardItem>
              <VCardText>
                <p class="app-timeline-text mb-3">
                  {{ step.description }}
                </p>
                <div v-if="step.completed" class="d-flex align-center">
                  <VIcon
                    icon="ri-check-line"
                    color="success"
                    class="me-2"
                  />
                  <span class="text-success">Completado</span>
                </div>
                <div v-else class="d-flex align-center">
                  <VIcon
                    icon="ri-time-line"
                    color="warning"
                    class="me-2"
                  />
                  <span class="text-warning">Pendiente</span>
                </div>
              </VCardText>
            </VCard>
          </VTimelineItem>
        </VTimeline>

        <!-- Observaciones -->
        <div v-if="design?.progressNotes" class="mt-6">
          <h6 class="text-h6 mb-2">Observaciones del Progreso</h6>
          <p class="text-body-1">{{ design.progressNotes }}</p>
        </div>
      </VCardText>

      <VCardActions class="pa-6">
        <VSpacer />
        <VBtn
          color="primary"
          @click="dialogVisible = false"
        >
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.v-timeline-avatar-wrapper {
  background-color: rgb(var(--v-theme-surface));
}

.app-timeline-meta {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.app-timeline-text {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style> 