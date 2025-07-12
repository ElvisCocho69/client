<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'submit',
])

const emailFrom = ref('')
const emailTo = ref('')
const invoiceSubject = ref('')

const paymentMessage = ref('')

const onSubmit = () => {
  emit('update:isDrawerOpen', false)
  emit('submit', {
    emailFrom: emailFrom.value,
    emailTo: emailTo.value,
    invoiceSubject: invoiceSubject.value,
    paymentMessage: paymentMessage.value,
  })
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}
</script>

<template>
  <VNavigationDrawer
    temporary
    location="end"
    :width="400"
    :model-value="props.isDrawerOpen"
    class="scrollable-content"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Header -->
    <AppDrawerHeaderSection
      title="Enviar Comprobante"
      @cancel="$emit('update:isDrawerOpen', false)"
    />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <VForm @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="emailFrom"
                  label="De"
                  placeholder="remitente@email.com"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="emailTo"
                  label="Para"
                  placeholder="destinatario@email.com"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="invoiceSubject"
                  label="Asunto"
                  placeholder="Comprobante de compra"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="paymentMessage"
                  rows="10"
                  label="Mensaje"
                  placeholder="¡Gracias por su preferencia!"
                />
              </VCol>

              <VCol cols="12">
                <div class="mb-6">
                  <VChip
                    label
                    color="primary"
                    size="small"
                  >
                    <VIcon
                      start
                      icon="ri-links-line"
                    />
                    Comprobante Adjunto
                  </VChip>
                </div>
                <VBtn
                  type="submit"
                  class="me-3"
                >
                  Enviar
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="outlined"
                  @click="$emit('update:isDrawerOpen', false)"
                >
                  Cancelar
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
