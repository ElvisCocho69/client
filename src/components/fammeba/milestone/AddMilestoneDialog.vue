<script setup>
import { ref, watch } from 'vue'
import { $api } from '@/utils/api'
import { VForm } from 'vuetify/components/VForm'
import { useDropZone, useFileDialog, useObjectUrl } from '@vueuse/core'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  structureId: {
    type: [Number, String],
    required: true,
  },
  nextStage: {
    type: String,
    default: null,
  },
  lastMilestone: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isDialogVisible', 'milestoneAdded'])

const milestoneFormRef = ref() // Referencia al componente VForm
const milestoneData = ref({
  description: '',
  date: null,
  imageFiles: [],
})

const loading = ref(false)
const errorMessage = ref(null)
const success = ref(false)

// Variables para el manejo de imágenes
const dropZoneRef = ref()
const fileData = ref([])
const { open, onChange } = useFileDialog({ accept: 'image/*', multiple: true })

// Variable local para controlar el diálogo
const isDialogOpen = ref(false)

const dateRules = [
  v => !!v || 'La fecha es requerida.',
  v => {
    if (props.lastMilestone?.date && v) {
      // `v` es un string 'YYYY-MM-DD'. Al añadir T00:00:00, se interpreta en la zona horaria local.
      const currentDate = new Date(`${v}T00:00:00`);
      const lastDate = new Date(props.lastMilestone.date);

      // Normalizar la fecha del último hito a medianoche para comparar solo fechas.
      lastDate.setHours(0, 0, 0, 0);

      if (currentDate < lastDate) {
        const formattedDate = new Intl.DateTimeFormat('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(lastDate);
        
        return `La fecha no puede ser anterior a la del hito previo (${formattedDate}).`;
      }
    }
    
    return true;
  },
];

// Sincronizar con la prop
watch(() => props.isDialogVisible, (newValue) => {
  isDialogOpen.value = newValue
})

// Emitir cambios cuando se cierra el diálogo
watch(isDialogOpen, (newValue) => {
  if (newValue !== props.isDialogVisible) {
    emit('update:isDialogVisible', newValue)
  }
})

function onDrop(DroppedFiles) {
  DroppedFiles?.forEach(file => {
    if (file.type.slice(0, 6) !== 'image/') {
      return
    }
    fileData.value.push({
      file,
      url: useObjectUrl(file).value ?? '',
    })
    milestoneData.value.imageFiles.push(file)
  })
}

onChange(selectedFiles => {
  if (!selectedFiles) return
  Array.from(selectedFiles).forEach(file => {
    fileData.value.push({
      file,
      url: useObjectUrl(file).value ?? '',
    })
    milestoneData.value.imageFiles.push(file)
  })
})

useDropZone(dropZoneRef, onDrop)

const closeDialog = () => {
  isDialogOpen.value = false
  milestoneData.value = {
    description: '',
    date: null,
    imageFiles: [],
  }
  fileData.value = []
  errorMessage.value = null
  success.value = false
  milestoneFormRef.value?.resetValidation()
}

const addMilestone = async () => {
  const { valid } = await milestoneFormRef.value?.validate()
  if (!valid) return

  loading.value = true
  errorMessage.value = null

  try {
    const formData = new FormData()
    const requestData = {
      description: milestoneData.value.description,
      date: milestoneData.value.date ? `${milestoneData.value.date}T00:00:00` : null,
      stage: props.nextStage, // Asignar la siguiente etapa automáticamente
      structureId: props.structureId,
    }

    formData.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }))

    milestoneData.value.imageFiles.forEach((file) => {
      formData.append('imageFiles', file)
    })

    await $api('/milestones', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    })

    success.value = true
    emit('milestoneAdded')
    setTimeout(() => {
      closeDialog()
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Error al registrar el hito.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const formatStageName = (stage) => {
  if (!stage) return 'N/A' // Manejar el caso de stage nulo
  const stageMap = {
    PENDING: 'Pendiente',
    MATERIALS_SELECTION: 'Selección de Materiales',
    CUTTING: 'Corte',
    ASSEMBLING: 'Ensamblaje',
    COMPLETED: 'Completado',
  }
  return stageMap[stage] || stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}
</script>

<template>
  <VDialog
    v-model="isDialogOpen"
    max-width="600"
    persistent
  >
    <VCard>
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="closeDialog"
      />

      <div class="text-center mt-5">
        <h4 class="text-h4 mb-2">
          Registrar Nuevo Hito
        </h4>
      </div>

      <VCardText class="pa-6">
        <VForm ref="milestoneFormRef">
          <VTextarea
            v-model="milestoneData.description"
            label="Descripción"
            :rules="[v => !!v || 'La descripción es requerida']"
            class="mb-4"
          />
          <VTextField
            v-model="milestoneData.date"
            label="Fecha"
            type="date"
            :rules="dateRules"
            class="mb-4"
          />
          <VTextField
            :model-value="formatStageName(props.nextStage)"
            label="Etapa del Hito"
            readonly
            class="mb-4"
          />
          <VCol cols="12">
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
                                cover
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
          <VAlert
            v-if="errorMessage"
            type="error"
            class="mb-4"
          >
            {{ errorMessage }}
          </VAlert>
          <VAlert
            v-if="success"
            type="success"
            class="mb-4"
            closable
          >
            Hito registrado correctamente
          </VAlert>
        </VForm>
      </VCardText>

      <VCardActions class="d-flex justify-end flex-wrap gap-4 pa-6">
        <VBtn
          color="secondary"
          variant="outlined"
          @click="closeDialog"
          prepend-icon="ri-close-fill"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          :loading="loading"
          @click="addMilestone"
          prepend-icon="ri-save-2-line"
        >
          Registrar
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
