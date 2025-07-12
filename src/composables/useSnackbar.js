import { ref } from 'vue'

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000,
  location: 'bottom right',
  variant: 'tonal',
  closable: true
})

export function useSnackbar() {
  const showSnackbar = (options) => {
    snackbar.value = {
      ...snackbar.value,
      ...options,
      show: true
    }
  }

  const hideSnackbar = () => {
    snackbar.value.show = false
  }

  return {
    snackbar,
    showSnackbar,
    hideSnackbar
  }
} 