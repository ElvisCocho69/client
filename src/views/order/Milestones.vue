<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { $api } from '@/utils/api'
import AddMilestoneDialog from '@/components/fammeba/milestone/AddMilestoneDialog.vue'
import ViewMilestoneImagesDialog from '@/components/fammeba/milestone/ViewMilestoneImagesDialog.vue'
import EditMilestoneDialog from '@/components/fammeba/milestone/EditMilestoneDialog.vue'

const route = useRoute()
const router = useRouter()
const milestones = ref([])
const loading = ref(true)
const error = ref(null)
const structureId = ref('')
const nextMilestoneStage = ref(null)
const lastMilestone = ref(null)

const isAddMilestoneDialogVisible = ref(false)
const isViewImagesDialogVisible = ref(false)
const isEditMilestoneDialogVisible = ref(false)
const selectedMilestone = ref(null)

const milestoneStageOrder = [
  'PENDING',
  'MATERIALS_SELECTION',
  'CUTTING',
  'ASSEMBLING',
  'COMPLETED',
]

const calculateProgress = computed(() => {
  if (!milestones.value || milestones.value.length === 0) return 0

  const registeredStages = new Set()
  milestones.value.forEach(milestone => {
    registeredStages.add(milestone.stage)
  })

  const totalStages = milestoneStageOrder.length
  const completedStagesCount = registeredStages.size

  return (completedStagesCount / totalStages) * 100
})

const formatStageName = (stage) => {
  const stageMap = {
    PENDING: 'Pendiente',
    MATERIALS_SELECTION: 'Selección de Materiales',
    CUTTING: 'Corte',
    ASSEMBLING: 'Ensamblaje',
    COMPLETED: 'Completado',
  }
  return stageMap[stage] || stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

const getStageIcon = (stage) => {
  switch (stage) {
    case 'PENDING':
      return 'ri-time-line'
    case 'MATERIALS_SELECTION':
      return 'ri-shopping-bag-line'
    case 'CUTTING':
      return 'ri-scissors-cut-line'
    case 'ASSEMBLING':
      return 'ri-tools-line'
    case 'COMPLETED':
      return 'ri-check-line'
    default:
      return 'ri-information-line'
  }
}

const getNextStage = (currentStage) => {
  const currentIndex = milestoneStageOrder.indexOf(currentStage)
  if (currentIndex === -1 || currentIndex === milestoneStageOrder.length - 1) {
    return null // Etapa inválida o ya en la última etapa
  }
  return milestoneStageOrder[currentIndex + 1]
}

const fetchMilestones = async () => {
  try {
    structureId.value = route.params.structureId
    if (!structureId.value) {
      throw new Error('No se proporcionó un ID de estructura')
    }

    const response = await $api(`/milestones/structure/${structureId.value}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      params: { size: 1000, sort: 'date,desc' } // Obtener todos los hitos, ordenados por fecha descendente
    })
    const originalMilestones = response.content || []

    // Ordenar los hitos: primero por fecha (ascendente), luego por etapa (ascendente)
    originalMilestones.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)

      // Ordenar por fecha ascendente
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime()
      }

      // Si las fechas son iguales, ordenar por etapa según milestoneStageOrder
      const stageIndexA = milestoneStageOrder.indexOf(a.stage)
      const stageIndexB = milestoneStageOrder.indexOf(b.stage)
      return stageIndexA - stageIndexB
    })

    if (originalMilestones.length > 0) {
      let currentLastMilestone = originalMilestones[originalMilestones.length - 1] // El último hito después de ordenar ascendentemente

      // La lógica para encontrar el lastMilestone ya considera la etapa más avanzada
      lastMilestone.value = currentLastMilestone
      nextMilestoneStage.value = getNextStage(lastMilestone.value.stage)
    } else {
      lastMilestone.value = null
      nextMilestoneStage.value = milestoneStageOrder[0] // Si no hay hitos, la primera etapa es PENDING
    }

    // Asignar los hitos directamente, ya están ordenados para la línea de tiempo
    milestones.value = originalMilestones

  } catch (err) {
    error.value = err.message || 'Error al cargar los hitos'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

const handleMilestoneAdded = () => {
  isAddMilestoneDialogVisible.value = false
  fetchMilestones()
}

const handleMilestoneUpdated = () => {
  isEditMilestoneDialogVisible.value = false
  fetchMilestones()
}

const openViewImagesDialog = (milestone) => {
  selectedMilestone.value = milestone
  isViewImagesDialogVisible.value = true
}

const openEditMilestoneDialog = (milestone) => {
  selectedMilestone.value = milestone
  isEditMilestoneDialogVisible.value = true
}

onMounted(() => {
  fetchMilestones()
})

const goBack = () => {
  router.back()
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard class="pa-6">
        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-center align-center pa-6">
          <VProgressCircular indeterminate />
        </div>

        <!-- Error State -->
        <VAlert
          v-if="error"
          type="error"
          class="ma-4"
        >
          {{ error }}
        </VAlert>

        <!-- Content -->
        <template v-if="!loading">
          <!-- Header -->
          <div class="d-flex justify-space-between align-center mb-6">
            <h5 class="text-h5">Hitos de la Estructura</h5>
            <VBtn
              prepend-icon="ri-add-line"
              @click="isAddMilestoneDialogVisible = true"
              :disabled="!nextMilestoneStage"
            >
              Registrar Hito
            </VBtn>
            <VBtn
              prepend-icon="ri-arrow-left-line"
              @click="goBack"
            >
              Volver
            </VBtn>
          </div>

          <!-- Lista de Hitos -->
          <div v-if="milestones.length > 0">
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
            <VTimeline
              align="start"
              line-inset="16"
              truncate-line="start"
              justify="center"
              :density="$vuetify.display.smAndDown ? 'compact' : 'default'"
              class="mt-10"
            >
              <VTimelineItem
                v-for="milestone in milestones"
                :key="milestone.id"
                fill-dot
                size="small"
              >
                <template #opposite>
                  <span class="app-timeline-meta">
                    {{ milestone.date ? new Date(milestone.date).toLocaleDateString() : '' }}
                  </span>
                </template>
                <template #icon>
                  <div class="v-timeline-avatar-wrapper rounded-circle">
                    <VAvatar
                      size="32"
                      color="primary"
                      variant="tonal"
                    >
                      <VIcon
                        :icon="getStageIcon(milestone.stage)"
                        size="20"
                      />
                    </VAvatar>
                  </div>
                </template>
                <VCard class="mb-10 mt-n4">
                  <VCardItem class="pb-4">
                    <VCardTitle>{{ milestone.name }}</VCardTitle>
                  </VCardItem>
                  <VCardText>
                    <p class="app-timeline-text mb-3">
                      {{ milestone.description }}
                    </p>
                    <p class="app-timeline-text mb-3">
                      <strong>Etapa:</strong> {{ formatStageName(milestone.stage) }}
                    </p>
                    <p class="app-timeline-text mb-3">
                      <strong>Fecha:</strong> {{ milestone.date ? new Date(milestone.date).toLocaleDateString() : '' }}
                    </p>
                    <div v-if="milestone.imagepath">
                      <VBtn
                        variant="tonal"
                        color="primary"
                        size="small"
                        prepend-icon="ri-image-line"
                        @click="openViewImagesDialog(milestone)"
                        class="me-2"
                      >
                        Ver Imágenes
                      </VBtn>
                      <VBtn
                        variant="tonal"
                        color="warning"
                        size="small"
                        prepend-icon="ri-edit-line"
                        @click="openEditMilestoneDialog(milestone)"
                      >
                        Editar Hito
                      </VBtn>
                    </div>
                  </VCardText>
                </VCard>
              </VTimelineItem>
            </VTimeline>
          </div>
          <div v-else class="text-center pa-4">
            <p>No hay hitos registrados para esta estructura.</p>
          </div>
        </template>
      </VCard>
    </VCol>
  </VRow>

  <AddMilestoneDialog
    v-model:isDialogVisible="isAddMilestoneDialogVisible"
    :structure-id="structureId"
    :next-stage="nextMilestoneStage"
    :last-milestone="lastMilestone"
    @milestone-added="handleMilestoneAdded"
  />

  <ViewMilestoneImagesDialog
    v-if="isViewImagesDialogVisible"
    v-model:isDialogVisible="isViewImagesDialogVisible"
    :milestone="selectedMilestone"
  />

  <EditMilestoneDialog
    v-if="isEditMilestoneDialogVisible"
    v-model:isDialogVisible="isEditMilestoneDialogVisible"
    :milestone="selectedMilestone"
    @milestone-updated="handleMilestoneUpdated"
  />
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