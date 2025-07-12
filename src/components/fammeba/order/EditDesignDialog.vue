<script setup>
import { ref, watch, onMounted } from 'vue'
import { useDropZone, useFileDialog, useObjectUrl } from '@vueuse/core'
import { $api } from '@/utils/api'

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

const emit = defineEmits([
  'update:isDialogVisible',
  'design-updated'
])

// Variables para el manejo de imágenes
const dropZoneRef = ref()
const fileData = ref([])
const { open, onChange } = useFileDialog({ accept: 'image/*' })

// Variables para el formulario de diseño
const editedDesign = ref({
  name: '',
  description: '',
  version: '',
  imageFile: null
})

// Variables para las alertas
const success = ref(false)
const error = ref(null)
const loading = ref(false)

// Variable local para controlar el diálogo
const isDialogOpen = ref(false)

// Referencia al formulario y estado de validación
const refForm = ref()
const isFormValid = ref(false)

// Agregar variable para la URL de la imagen
const imageBlobUrl = ref('')

// Sincronizar con la prop
watch(() => props.isDialogVisible, (newValue) => {
  isDialogOpen.value = newValue
  if (newValue) {
    // Limpiar todo al abrir el diálogo
    fileData.value = []
    imageBlobUrl.value = ''
    loadDesignData()
  }
})

// Emitir cambios cuando se cierra el diálogo
watch(isDialogOpen, (newValue) => {
  if (!newValue && imageBlobUrl.value) {
    URL.revokeObjectURL(imageBlobUrl.value)
    imageBlobUrl.value = ''
  }
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
    editedDesign.value.imageFile = file
  })
}

onChange(selectedFiles => {
  if (!selectedFiles) return
  const file = selectedFiles[0]
  fileData.value.push({
    file,
    url: useObjectUrl(file).value ?? '',
  })
  editedDesign.value.imageFile = file
})

useDropZone(dropZoneRef, onDrop)

// Función para obtener la imagen
const getImage = async () => {
  if (!props.design?.imagepath) return
  
  try {
    // Limpiar imágenes existentes
    fileData.value = []
    if (imageBlobUrl.value) {
      URL.revokeObjectURL(imageBlobUrl.value)
      imageBlobUrl.value = ''
    }
    
    const imagePaths = props.design.imagepath.split(',')
    
    for (const imagePath of imagePaths) {
      if (!imagePath) continue
      const fileName = imagePath.split('/').pop()
      const response = await $api(`/files/designs/${fileName}`, {
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Crear URL del blob
      const blobUrl = URL.createObjectURL(response)
      fileData.value.push({
        url: blobUrl,
        existingPath: imagePath
      })
    }
  } catch (error) {
    console.error('Error al obtener las imágenes:', error)
    fileData.value = []
    imageBlobUrl.value = ''
  }
}

// Modificar loadDesignData para incluir la carga de la imagen
const loadDesignData = () => {
  if (props.design) {
    editedDesign.value = {
      ...props.design,
      imageFile: null
    }
    if (props.design.imagepath) {
      getImage()
    }
  }
}

const onFormSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      // Validar que haya al menos una imagen (nueva o existente)
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
        
        // Crear el objeto request con los datos del formulario
        const requestData = {
          name: editedDesign.value.name,
          description: editedDesign.value.description,
          version: editedDesign.value.version,
          structureId: editedDesign.value.structure.id
        }
        
        // Agregar el objeto request como JSON string
        formData.append('request', new Blob([JSON.stringify(requestData)], {
          type: 'application/json'
        }))
        
        // Agregar las imágenes existentes que se mantienen
        const existingPaths = fileData.value
          .filter(item => item.existingPath)
          .map(item => item.existingPath)
          .join(',')
        
        if (existingPaths) {
          formData.append('existingImagePaths', existingPaths)
        }
        
        // Agregar los archivos de imagen nuevos
        fileData.value
          .filter(item => item.file)
          .forEach(item => {
            formData.append('imageFiles', item.file)
          })

        const response = await $api(`/designs/${props.design.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })

        success.value = true
        emit('design-updated')
        
        // Cerrar el diálogo después de un breve retraso
        setTimeout(() => {
          onFormReset()
        }, 1500)
      } catch (err) {
        error.value = err.response?._data?.message || 'Error al actualizar el diseño'
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
  editedDesign.value = {
    name: '',
    description: '',
    version: '',
    imageFile: null
  }
  isDialogOpen.value = false
}
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
        @click="onFormReset"
      />

      <div class="text-center mt-5">
        <h4 class="text-h4 mb-2">
          Editar Diseño
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
                v-model="editedDesign.name"
                label="Nombre del Diseño"
                placeholder="Ingrese el nombre del diseño"
                :rules="[v => !!v || 'El nombre es requerido']"
                prepend-inner-icon="ri-bar-chart-box-line"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="editedDesign.description"
                label="Descripción"
                placeholder="Ingrese la descripción del diseño"
                :rules="[v => !!v || 'La descripción es requerida']"
                prepend-inner-icon="ri-t-box-line"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="editedDesign.version"
                label="Versión"
                placeholder="Ingrese la versión del diseño"
                :rules="[v => !!v || 'La versión es requerida']"
                prepend-inner-icon="ri-git-branch-line"
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
                                  cover
                                />
                              </VCardText>
                              <VCardActions>
                                <VBtn
                                  variant="text"
                                  block
                                  @click.stop="() => {
                                    fileData.splice(index, 1)
                                    if (item.existingPath) {
                                      // Si es una imagen existente, actualizar imagepath
                                      const paths = props.design.imagepath.split(',')
                                      const newPaths = paths.filter(p => p !== item.existingPath)
                                      props.design.imagepath = newPaths.join(',')
                                    }
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
              Diseño actualizado correctamente
            </VAlert>
          </VRow>
        </VForm>
      </VCardText>

      <VCardText class="d-flex justify-end flex-wrap gap-4 pa-6">
        <VBtn
          variant="outlined"
          color="error"
          @click="onFormReset"
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