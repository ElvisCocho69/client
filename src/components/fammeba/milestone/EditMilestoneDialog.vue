<script setup>
import { ref, watch, onMounted } from 'vue'
import { useDropZone, useFileDialog, useObjectUrl } from '@vueuse/core'
import { $api } from '@/utils/api'
import AppDateTimePicker from '@core/components/app-form-elements/AppDateTimePicker.vue'

console.log('EditMilestoneDialog setup function executed.')

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  milestone: {
    type: Object,
    required: false,
    default: null
  },
})

const emit = defineEmits([
  'update:isDialogVisible',
  'milestone-updated'
])

// Image handling variables
const dropZoneRef = ref()
const fileData = ref([])
const { open, onChange } = useFileDialog({ accept: 'image/*' })

// Milestone form data
const editedMilestone = ref({
  description: '',
  date: '',
  imageFile: null
})

// Alert variables
const success = ref(false)
const error = ref(null)
const loading = ref(false)

// Form reference and validation state
const refForm = ref()
const isFormValid = ref(false)

// Sync with the prop
watch(() => props.isDialogVisible, (newValue) => {
  if (newValue) {
    console.log('Dialog opened. props.milestone:', props.milestone)
    fileData.value = []
    loadMilestoneData()
    console.log('After loadMilestoneData. editedMilestone:', editedMilestone.value)
  }
})

// Emit changes when the dialog is closed
watch(() => props.isDialogVisible, (newValue) => {
  if (!newValue) {
    // When dialog is closed, reset form and clear data
    onFormReset()
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
  })
}

onChange(selectedFiles => {
  if (!selectedFiles) return
  for (const file of selectedFiles) {
    fileData.value.push({
      file,
      url: useObjectUrl(file).value ?? '',
    })
  }
})

useDropZone(dropZoneRef, onDrop)

// Function to get images
const getImages = async () => {
  if (!props.milestone?.imagepath) return
  
  try {
    fileData.value = []
    
    const imagePaths = props.milestone.imagepath.split(',')
    
    for (const imagePath of imagePaths) {
      if (!imagePath) continue
      const fileName = imagePath.split('/').pop()
      const response = await $api(`/files/milestones/${fileName}`, {
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const blobUrl = URL.createObjectURL(response)
      fileData.value.push({
        url: blobUrl,
        existingPath: imagePath
      })
    }
  } catch (error) {
    console.error('Error fetching images:', error)
    fileData.value = []
  }
}

// Load milestone data into the form
const loadMilestoneData = () => {
  if (props.milestone) {
    console.log('Inside loadMilestoneData. props.milestone:', props.milestone)
    editedMilestone.value.description = props.milestone.description
    editedMilestone.value.date = props.milestone.date ? new Date(props.milestone.date).toISOString().slice(0, 10) : ''
    if (props.milestone.imagepath) {
      getImages()
    }
  }
}

const onFormSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      if (fileData.value.length === 0) {
        error.value = 'Debe seleccionar al menos una imagen'
        setTimeout(() => {
          error.value = null
        }, 3000)
        return
      }

      try {
        error.value = null
        loading.value = true
        const formData = new FormData()
        
        const requestData = {
          description: editedMilestone.value.description,
          date: editedMilestone.value.date + 'T00:00:00',
        }
        
        formData.append('request', new Blob([JSON.stringify(requestData)], {
          type: 'application/json'
        }))
        
        const existingPaths = fileData.value
          .filter(item => item.existingPath)
          .map(item => item.existingPath)
          .join(',')
        
        if (existingPaths) {
          formData.append('existingImagePaths', existingPaths)
        }
        
        fileData.value
          .filter(item => item.file)
          .forEach(item => {
            formData.append('imageFiles', item.file)
          })

        const response = await $api(`/milestones/${props.milestone.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })

        success.value = true
        emit('milestone-updated')
        
        setTimeout(() => {
          onFormReset()
        }, 1500)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al actualizar el hito'
      } finally {
        loading.value = false
      }
    }
  })
}

const onFormReset = () => {
  refForm.value?.reset()
  refForm.value?.resetValidation()
  error.value = null
  success.value = false
  fileData.value = []
  editedMilestone.value = {
    description: '',
    date: '',
    imageFile: null
  }
  emit('update:isDialogVisible', false)
}

onMounted(() => {
  console.log('EditMilestoneDialog mounted.')
  if (props.isDialogVisible) {
    console.log('Dialog visible on mount. Loading data.')
    fileData.value = []
    loadMilestoneData()
  }
})
</script>

<template>
  <VDialog
    :model-value="isDialogVisible"
    @update:model-value="val => emit('update:isDialogVisible', val)"
    max-width="800"
    persistent
  >
    <VCard>
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="emit('update:isDialogVisible', false)"
      />

      <div class="text-center mt-5">
        <h4 class="text-h4 mb-2">
          Editar Hito
        </h4>          
      </div>

      <VCardText class="pa-6">
        <VForm
          ref="refForm"
          v-model="isFormValid"
          @submit.prevent="onFormSubmit"
        >
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="editedMilestone.description"
                label="Descripción"
                placeholder="Ingrese la descripción del hito"
                :rules="[v => !!v || 'La descripción es requerida']"
                prepend-inner-icon="ri-t-box-line"
              />
            </VCol>

            <VCol cols="12">
              <AppDateTimePicker
                v-model="editedMilestone.date"
                label="Fecha del Hito"
                placeholder="Seleccione una fecha"
                :rules="[v => !!v || 'La fecha es requerida']"
                prepend-inner-icon="ri-calendar-line"
              />
            </VCol>

            <VCol cols="12">
              <div class="flex">
                <div class="w-full h-auto relative">
                  <div
                    ref="dropZoneRef"
                    class="cursor-pointer"
                    @click="() => open()"
                  >
                    <div
                      v-if="!fileData.length"
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
                        Arrastre y suelte sus imágenes aquí
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
                                  cover
                                />
                              </VCardText>
                              <VCardActions>
                                <VBtn
                                  variant="text"
                                  block
                                  @click.stop="() => {
                                    fileData.splice(index, 1)
                                  }"
                                >
                                  Eliminar Imagen
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
              v-if="error"
              type="error"
              class="mb-4"
              closable
            >
              {{ error }}
            </VAlert>

            <VAlert
              v-if="success"
              type="success"
              class="mb-4"
              closable
            >
              Hito actualizado correctamente
            </VAlert>
          </VRow>
        </VForm>
      </VCardText>

      <VCardText class="d-flex justify-end flex-wrap gap-4 pa-6">
        <VBtn
          variant="outlined"
          color="error"
          @click="emit('update:isDialogVisible', false)"
          prepend-icon="ri-close-fill"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          :loading="loading"
          @click="onFormSubmit"
          prepend-icon="ri-save-2-line"
        >
          Guardar Cambios
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss" scoped>
.drop-zone {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
}
</style>
