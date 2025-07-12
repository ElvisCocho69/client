<script setup>
import { ref, watch, computed } from 'vue'
import { useDropZone, useFileDialog, useObjectUrl } from '@vueuse/core'
import { $api } from '@/utils/api'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  orderDetailId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update:isDialogVisible', 'timelineUpdated'])


const dialogVisible = ref(props.isDialogVisible)
const timelineData = ref({
  imagepath: '',
  description: '',
  date: new Date().toISOString().slice(0, 16),
  stage: '',
  userId: null,
})
const imageFile = ref(null)
const dropZoneRef = ref()
const fileData = ref([])
const { open, onChange } = useFileDialog({ accept: 'image/*', multiple: true })
const isLoading = ref(false)
const isCompleted = ref(false)

const orderedStages = ['PENDING', 'SELECTED_MATERIALS', 'CUTTING', 'ASSEMBLING', 'FINISHED']
const stageTitles = {
  PENDING: 'Pendiente',
  SELECTED_MATERIALS: 'Materiales Seleccionados',
  CUTTING: 'Cortando',
  ASSEMBLING: 'Ensamblando',
  FINISHED: 'Terminado',
}

const dialogTitle = computed(() => {
  if (isCompleted.value) {
    return 'Proceso Completado'
  }
  const title = stageTitles[timelineData.value.stage]
  return title ? `Registrar Avance: ${title}` : 'Registrar Avance'
})

watch(() => props.isDialogVisible, (val) => {
  dialogVisible.value = val
  if (val) {
    fetchCurrentProgress()
  }
})

watch(dialogVisible, (val) => {
  emit('update:isDialogVisible', val)
})

async function fetchCurrentProgress() {
  if (!props.orderDetailId) return
  isLoading.value = true
  isCompleted.value = false
  try {
    const response = await $api(`/timeline/${props.orderDetailId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (response && response.progressDetails && response.progressDetails.length > 0) {
      const lastStage = response.progressDetails[response.progressDetails.length - 1].stage
      const lastStageIndex = orderedStages.indexOf(lastStage)
      if (lastStageIndex >= 0 && lastStageIndex < orderedStages.length - 1) {
        timelineData.value.stage = orderedStages[lastStageIndex + 1]
      } else {
        isCompleted.value = true
      }
    } else {
      timelineData.value.stage = orderedStages[0] // First stage
    }
  } catch (error) {
    // If the error is a 404, it means no timeline exists, so start with the first stage
    if (error.response && error.response.status === 404) {
      timelineData.value.stage = orderedStages[0]
    } else {
      console.error('Error al cargar el progreso actual:', error)
    }
  } finally {
    isLoading.value = false
  }
}

function onDrop(DroppedFiles) {
  DroppedFiles?.forEach(file => {
    if (file.type.slice(0, 6) !== 'image/') {
      return
    }
    fileData.value = [{ file, url: useObjectUrl(file).value ?? '' }]
    imageFile.value = file
  })
}

onChange(selectedFiles => {
  if (!selectedFiles) return
  const file = selectedFiles[0]
  fileData.value = [{ file, url: useObjectUrl(file).value ?? '' }]
  imageFile.value = file
})

useDropZone(dropZoneRef, onDrop)

const handleSubmit = async () => {
  if (isCompleted.value) return

  try {
    const formData = new FormData()
    const userData = JSON.parse(localStorage.getItem('user'))
    timelineData.value.userId = userData.id

    formData.append('request', new Blob([JSON.stringify(timelineData.value)], { type: 'application/json' }))
    if (imageFile.value) {
      formData.append('imageFiles', imageFile.value)
    }

    await $api(`/timeline/${props.orderDetailId}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })

    dialogVisible.value = false
    emit('timeline-updated')
  } catch (error) {
    console.error('Error al registrar el progreso:', error)
  }
}
</script>

<template>
  <VDialog
    v-model="dialogVisible"
    max-width="600px"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center pa-6">
        <span class="text-h5">{{ dialogTitle }}</span>
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
        <VForm @submit.prevent="handleSubmit">
          <VRow>
            <VCol v-if="!isCompleted" cols="12">
              <div class="flex">
                <div class="w-full h-auto relative">
                  <div
                    ref="dropZoneRef"
                    class="cursor-pointer"
                    @click="() => open()"
                  >
                    <div
                      v-if="fileData.length === 0"
                      class="d-flex flex-column justify-center align-center gap-y-2 pa-12 border-dashed drop-zone"
                    >
                      <VAvatar
                        variant="tonal"
                        color="secondary"
                        rounded
                      >
                        <VIcon icon="ri-upload-2-line" />
                      </VAvatar>
                      <h4 class="text-h4 text-wrap">
                        Arrastre y suelte su imagen aquí
                      </h4>
                      <span class="text-disabled">o</span>

                      <VBtn
                        variant="outlined"
                        size="small"
                      >
                        Buscar Imagen
                      </VBtn>
                    </div>

                    <div
                      v-else
                      class="d-flex justify-center align-center gap-3 pa-8 border-dashed drop-zone flex-wrap"
                    >
                      <VRow class="match-height w-100">
                        <template
                          v-for="(item, index) in fileData"
                          :key="index"
                        >
                          <VCol
                            cols="12"
                            sm="4"
                          >
                            <VCard :ripple="false">
                              <VCardText
                                class="d-flex flex-column"
                                @click.stop
                              >
                                <VImg
                                  :src="item.url"
                                  width="200px"
                                  height="150px"
                                  class="w-100 mx-auto"
                                />
                                <div class="mt-2">
                                  <span class="clamp-text text-wrap">
                                    {{ item.file.name }}
                                  </span>
                                  <span>
                                    {{ item.file.size / 1000 }} KB
                                  </span>
                                </div>
                              </VCardText>
                              <VCardActions>
                                <VBtn
                                  variant="text"
                                  block
                                  @click.stop="fileData.splice(index, 1)"
                                >
                                  Eliminar Archivo
                                </VBtn>
                              </VCardActions>
                            </VCard>
                          </VCol>
                        </template>
                      </VRow>
                    </div>
                  </div>
                </div>
              </div>
            </VCol>
            <VCol v-if="!isCompleted" cols="12">
              <VTextarea
                v-model="timelineData.description"
                label="Descripción"
                rows="3"
                required
              />
            </VCol>
            <VCol v-if="!isCompleted" cols="12">
              <VTextField
                v-model="timelineData.date"
                label="Fecha"
                type="datetime-local"
                required
              />
            </VCol>
            <VCol v-if="isCompleted" cols="12">
              <VAlert type="success" prominent>
                Este proceso ya ha sido completado y no se pueden registrar más avances.
              </VAlert>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VCardActions class="pa-6">
        <VSpacer />
        <VBtn
          color="secondary"
          @click="dialogVisible = false"
        >
          Cancelar
        </VBtn>
        <VBtn
          v-if="!isCompleted"
          color="primary"
          @click="handleSubmit"
        >
          Guardar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
<style lang="scss" scoped>
.drop-zone {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
}
</style>
