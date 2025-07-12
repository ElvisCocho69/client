<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
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

const emit = defineEmits(['update:isDialogVisible'])

// Variables para el manejo de imágenes
const isDialogOpen = ref(false)
const imageBlobUrls = ref([])
const isFullscreenImageVisible = ref(false)
const selectedImageIndex = ref(0)

// Función para obtener las imágenes
const getImages = async () => {
  if (!props.design?.imagepath) {
    imageBlobUrls.value = []
    return
  }
  
  try {
    const imagePaths = props.design.imagepath.split(',')
    imageBlobUrls.value = []
    
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
      imageBlobUrls.value.push(URL.createObjectURL(response))
    }
  } catch (error) {
    console.error('Error al obtener las imágenes:', error)
    imageBlobUrls.value = []
  }
}

// Observar cambios en el diseño
watch(() => props.design, () => {
  if (props.design?.imagepath) {
    getImages()
  } else {
    imageBlobUrls.value = []
  }
}, { immediate: true })

// Sincronizar con la prop isDialogVisible
watch(() => props.isDialogVisible, (newValue) => {
  isDialogOpen.value = newValue
})

// Emitir cambios cuando se cierra el diálogo
watch(isDialogOpen, (newValue) => {
  if (!newValue) {
    if (imageBlobUrls.value && imageBlobUrls.value.length > 0) {
      imageBlobUrls.value.forEach(url => URL.revokeObjectURL(url))
      imageBlobUrls.value = []
    }
  }
  if (newValue !== props.isDialogVisible) {
    emit('update:isDialogVisible', newValue)
  }
})

const closeDialog = () => {
  isDialogOpen.value = false
}

const openFullscreenImage = (index) => {
  selectedImageIndex.value = index
  isFullscreenImageVisible.value = true
}

const closeFullscreenImage = () => {
  isFullscreenImageVisible.value = false
}

const nextImage = () => {
  if (selectedImageIndex.value < imageBlobUrls.value.length - 1) {
    selectedImageIndex.value++
  }
}

const previousImage = () => {
  if (selectedImageIndex.value > 0) {
    selectedImageIndex.value--
  }
}

// Manejar teclas de dirección
const handleKeyDown = (event) => {
  if (!isDialogOpen.value) return

  switch (event.key) {
    case 'ArrowLeft':
      previousImage()
      break
    case 'ArrowRight':
      nextImage()
      break
  }
}

// Agregar y remover event listener para las teclas
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (imageBlobUrls.value && imageBlobUrls.value.length > 0) {
    imageBlobUrls.value.forEach(url => URL.revokeObjectURL(url))
  }
})
</script>

<template>
  <VDialog
    v-model="isDialogOpen"
    max-width="800"
    persistent
  >
    <VCard>
      <div class="text-center mt-5">
        <h4 class="text-h4 mb-2">
          Detalles del Diseño
        </h4>          
      </div>

      <VCardText class="pa-6">
        <VRow>
          <VCol cols="12" md="6">
            <div class="d-flex flex-column gap-4">
              <div>
                <h6 class="text-h6 mb-2">Nombre:</h6>
                <p class="text-body-1">{{ design?.name }}</p>
              </div>

              <div>
                <h6 class="text-h6 mb-2">Descripción:</h6>
                <p class="text-body-1">{{ design?.description }}</p>
              </div>

              <div>
                <h6 class="text-h6 mb-2">Versión:</h6>
                <p class="text-body-1">{{ design?.version }}</p>
              </div>
            </div>
          </VCol>

          <VCol cols="12" md="6">
            <div class="d-flex flex-column align-center gap-4">
              <div class="d-flex gap-2">
                <VBtn
                  icon
                  variant="text"
                  :disabled="selectedImageIndex === 0"
                  @click="previousImage"
                >
                  <VIcon>ri-arrow-left-s-line</VIcon>
                </VBtn>
                
                <VImg
                  v-if="imageBlobUrls.length > 0"
                  :src="imageBlobUrls[selectedImageIndex]"
                  width="256"
                  height="256"
                  cover
                  class="rounded cursor-pointer"
                  @click="openFullscreenImage(selectedImageIndex)"
                />
                <VProgressCircular
                  v-else
                  indeterminate
                  color="primary"
                />
                
                <VBtn
                  icon
                  variant="text"
                  :disabled="selectedImageIndex === imageBlobUrls.length - 1"
                  @click="nextImage"
                >
                  <VIcon>ri-arrow-right-s-line</VIcon>
                </VBtn>
              </div>
              
              <div class="d-flex gap-2">
                <div
                  v-for="(_, index) in imageBlobUrls"
                  :key="index"
                  class="carousel-dot"
                  :class="{ 'active': selectedImageIndex === index }"
                  @click="selectedImageIndex = index"
                />
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>

      <VCardText class="d-flex justify-end flex-wrap gap-4 pa-6">
        <VBtn
          variant="outlined"
          color="error"
          @click="closeDialog"
          prepend-icon="ri-close-fill"
        >
          Cerrar
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- Diálogo de imagen a pantalla completa -->
  <VDialog
    v-model="isFullscreenImageVisible"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <VCard>
      <VToolbar>
        <VBtn
          icon
          @click="closeFullscreenImage"
        >
          <VIcon>ri-close-line</VIcon>
        </VBtn>
        <VToolbarTitle>Imagen {{ selectedImageIndex + 1 }} de {{ imageBlobUrls.length }}</VToolbarTitle>
        <VSpacer />
        <VBtn
          icon
          :disabled="selectedImageIndex === 0"
          @click="previousImage"
        >
          <VIcon>ri-arrow-left-s-line</VIcon>
        </VBtn>
        <VBtn
          icon
          :disabled="selectedImageIndex === imageBlobUrls.length - 1"
          @click="nextImage"
        >
          <VIcon>ri-arrow-right-s-line</VIcon>
        </VBtn>
      </VToolbar>

      <VCardText class="d-flex justify-center align-center" style="height: calc(100vh - 64px)">
        <VImg
          v-if="imageBlobUrls.length > 0"
          :src="imageBlobUrls[selectedImageIndex]"
          max-width="90vw"
          max-height="90vh"
          contain
        />
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss" scoped>
.v-card {
  border-radius: 8px;
}

.v-img {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cursor-pointer {
  cursor: pointer;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(var(--v-theme-on-surface), 0.2);
  cursor: pointer;
  transition: all 0.3s ease;

  &.active {
    background-color: rgb(var(--v-theme-primary));
    transform: scale(1.2);
  }

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.7);
  }
}

.fullscreen-image-card {
  background-color: rgba(0, 0, 0, 0.9);
}

.fullscreen-image-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
}

.fullscreen-image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 0;
  margin-top: 64px;
}

.fullscreen-image {
  max-width: 100%;
  max-height: calc(100vh - 64px);
  object-fit: contain;
}
</style> 