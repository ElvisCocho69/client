<script setup>
import { ref } from 'vue'
import { $api } from '@/utils/api'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  order: {
    type: Object,
    required: true,
  }
})

const emit = defineEmits(['update:isDialogVisible', 'rating-registered'])

// Estados
const rating = ref(0)
const comment = ref('')
const error = ref(null)
const success = ref(null)
const loading = ref(false)

// Función para manejar el cambio de calificación
const handleRatingChange = (value) => {
  console.log('Valor de calificación:', value)
  rating.value = value
}

// Función para cerrar el diálogo
const closeDialog = () => {
  emit('update:isDialogVisible', false)
  rating.value = 0
  comment.value = ''
  error.value = null
  success.value = null
}

// Función para registrar la calificación
const registerRating = async () => {
  console.log('Intentando guardar calificación:', rating.value)
  if (rating.value === 0) {
    error.value = 'Por favor seleccione una calificación'
    return
  }

  loading.value = true
  error.value = null
  try {
    const ratingData = {
      rating: rating.value,
      comment: comment.value,
      orderId: props.order.id
    }
    console.log('Datos a enviar:', ratingData)

    await $api('/ratings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ratingData)
    })

    success.value = 'Calificación registrada correctamente'
    emit('rating-registered')
    
    setTimeout(() => {
      closeDialog()
    }, 1500)
  } catch (err) {
    console.error('Error al guardar calificación:', err)
    error.value = err.response?._data?.message || 'Error al registrar la calificación'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    persistent
    max-width="500px"
    @update:model-value="val => emit('update:isDialogVisible', val)"
  >
    <VCard>
      <VCardText class="pt-5">
        <div class="text-center pb-6">
          <h4 class="text-h4 mb-2">
            Calificar Orden #{{ order?.id }}
          </h4>
          <div class="text-body-1">
            Ingrese su calificación y comentario para esta orden.
          </div>
        </div>

        <VForm @submit.prevent="registerRating">
          <VRow>
            <!-- Calificación con estrellas -->
            <VCol cols="12">
              <div class="d-flex flex-column align-center">
                <VRating hover 
                  v-model="rating"
                  @update:model-value="handleRatingChange"
                />
                <span class="text-body-1 mt-2">
                  {{ rating ? `Calificación: ${rating} estrellas` : 'Seleccione una calificación' }}
                </span>
              </div>
            </VCol>

            <!-- Comentario -->
            <VCol cols="12">
              <VTextarea
                v-model="comment"
                label="Comentario"
                placeholder="Ingrese su comentario aquí..."
                rows="3"
                :rules="[v => v.length <= 500 || 'Máximo 500 caracteres']"
              />
            </VCol>

            <!-- Alerts -->
            <VCol cols="12">
              <VAlert
                v-if="error"
                type="error"
                closable
                class="mb-4"
              >
                {{ error }}
              </VAlert>

              <VAlert
                v-if="success"
                type="success"
                closable
                class="mb-4"
              >
                {{ success }}
              </VAlert>
            </VCol>

            <!-- Botones -->
            <VCol cols="12" class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="tonal"
                @click="closeDialog"
                prepend-icon="ri-close-circle-fill"
              >
                Cancelar
              </VBtn>
              <VBtn
                color="primary"
                :loading="loading"
                @click="registerRating"
                prepend-icon="ri-save-line"
              >
                Guardar
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template> 