<script setup>
const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  structureId: {
    type: Number,
    required: false,
    default: null
  },
})

const emit = defineEmits([
  'update:isDialogVisible',
  'design-added',
])

import { ref, watch } from 'vue'
import { useDropZone, useFileDialog, useObjectUrl } from '@vueuse/core'
import { $api } from '@/utils/api'

// Variables para el manejo de imágenes
const dropZoneRef = ref()
const fileData = ref([])
const { open, onChange } = useFileDialog({ accept: 'image/*', multiple: true })

// Variables para el formulario de diseño
const designForm = ref({
  name: '',
  description: '',
  version: '',
  imageFiles: []
})

// Variables para las alertas
const success = ref(false)
const error = ref(null)

// Variable local para controlar el diálogo
const isDialogOpen = ref(false)

// Referencia al formulario y estado de validación
const refForm = ref()
const isFormValid = ref(false)

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
    designForm.value.imageFiles.push(file)
  })
}

onChange(selectedFiles => {
  if (!selectedFiles) return
  Array.from(selectedFiles).forEach(file => {
    fileData.value.push({
      file,
      url: useObjectUrl(file).value ?? '',
    })
    designForm.value.imageFiles.push(file)
  })
})

useDropZone(dropZoneRef, onDrop)

const closeDialog = () => {
  isDialogOpen.value = false
  fileData.value = []
  designForm.value = {
    name: '',
    description: '',
    version: '',
    imageFiles: []
  }
  success.value = false
  error.value = null
  refForm.value?.reset()
  refForm.value?.resetValidation()
}

const submitDesign = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      // Validar que haya al menos una imagen
      if (fileData.value.length === 0) {
        error.value = 'Debe seleccionar al menos una imagen'
        setTimeout(() => {
          error.value = null
        }, 3000)
        return
      }

      try {
        error.value = null
        const formData = new FormData()
        
        // Crear el objeto request con los datos del formulario
        const requestData = {
          name: designForm.value.name,
          description: designForm.value.description,
          version: designForm.value.version,
          structureId: props.structureId
        }
        
        // Agregar el objeto request como JSON string
        formData.append('request', new Blob([JSON.stringify(requestData)], {
          type: 'application/json'
        }))
        
        // Agregar los archivos de imagen si existen
        if (designForm.value.imageFiles.length > 0) {
          designForm.value.imageFiles.forEach((file, index) => {
            formData.append('imageFiles', file)
          })
        }

        const response = await fetch('http://127.0.0.1:8080/designs', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Error al guardar el diseño')
        }

        success.value = true
        emit('design-added')
        
        // Cerrar el diálogo después de un breve retraso
        setTimeout(() => {
          closeDialog()
        }, 1500)
      } catch (err) {
        console.error('Error completo:', err)
      }
    }
  })
}
</script>

<template>
  <VDialog
    v-model="isDialogOpen"
    max-width="800"
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
          Agregar Diseño
        </h4>          
      </div>

      <VCardText class="pa-6">

        <VForm
          ref="refForm"
          v-model="isFormValid"
          @submit.prevent="submitDesign"
        >
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="designForm.name"
                label="Nombre del Diseño"
                placeholder="Ingrese el nombre del diseño"
                :rules="[v => !!v || 'El nombre es requerido']"
                prepend-inner-icon="ri-bar-chart-box-line"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="designForm.description"
                label="Descripción"
                placeholder="Ingrese la descripción del diseño"
                :rules="[v => !!v || 'La descripción es requerida']"
                prepend-inner-icon="ri-t-box-line"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="designForm.version"
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

            <VAlert
              v-if="success"
              type="success"
              class="mb-4"
              closable
            >
              Diseño agregado correctamente
            </VAlert>
          </VRow>
        </VForm>
      </VCardText>

      

      <VCardText class="d-flex justify-end flex-wrap gap-4 pa-6">
        <VBtn
          variant="outlined"
          color="error"
          @click="closeDialog"
          prepend-icon="ri-close-fill"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          @click="submitDesign"
          prepend-icon="ri-save-2-line"
        >
          Guardar Diseño
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