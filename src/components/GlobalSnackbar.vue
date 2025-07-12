<script setup>
import { useSnackbar } from '@/composables/useSnackbar'

const { snackbar, hideSnackbar } = useSnackbar()
</script>

<template>
  <VSnackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    :location="snackbar.location"
    :variant="snackbar.variant"
    :closable="snackbar.closable"
    @update:model-value="hideSnackbar"
    class="custom-snackbar"
  >
    <span class="snackbar-text">{{ snackbar.text }}</span>
  </VSnackbar>
</template>

<style scoped>
.custom-snackbar {
  max-width: 320px;
  min-width: 200px;
  border-radius: 12px;
  padding: 12px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  word-break: break-word;
  display: flex;
  align-items: center;
  justify-content: center;
}
.snackbar-text {
  width: 100%;
  text-align: center;
  font-weight: 500;
  font-size: 1rem;
}
</style> 