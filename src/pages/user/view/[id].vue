<script setup>
import { $api } from '@/utils/api'
import UserBioPanel from '@/views/user/UserBioPanel.vue'
import UserTabSecurity from '@/views/user/UserTabSecurity.vue'
import UserInfoEditDialog from '@/components/fammeba/user/UserInfoEditDialog.vue'

const route = useRoute('apps-user-view-id')
const userTab = ref(null)
const userData = ref(null)
const error = ref(null)
const isEditDialogVisible = ref(false)

// Obtener los datos del usuario desde el store o props
const fetchUserData = async () => {
  try {
    const user = await $api(`/users/${route.params.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
    })
    
    if (user) {
      userData.value = user
    } else {
      error.value = 'Usuario no encontrado'
    }
  } catch (err) {
    error.value = 'Error al cargar los datos del usuario'
    console.error('Error:', err)
  }
}

// Cargar datos al montar el componente
onMounted(() => {
  fetchUserData()
})

const handleUserUpdate = () => {
  fetchUserData() // Recargar los datos del usuario después de la actualización
}

const handleUserDisabled = () => {
  fetchUserData() // Recargar los datos del usuario después de la desactivación
}

const handleUserEnabled = () => {
  fetchUserData() // Recargar los datos del usuario después de la activación
}

const tabs = [  
  {
    icon: 'ri-lock-2-line',
    title: 'Seguridad',
  }  
]
</script>

<template>
  <VRow v-if="userData">
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <UserBioPanel 
        :user-data="userData"
        @edit-user="isEditDialogVisible = true"
        @user-disabled="handleUserDisabled"
        @user-enabled="handleUserEnabled"
      />
    </VCol>

    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VTabs
        v-model="userTab"
        class="v-tabs-pill"
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.icon"
        >
          <VIcon
            start
            :icon="tab.icon"
          />
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs>

      <VWindow
        v-model="userTab"
        class="mt-6 disable-tab-transition"
        :touch="false"
      >              
        <VWindowItem>
          <UserTabSecurity
            :user-id="route.params.id"
          />
        </VWindowItem>       
      </VWindow>
    </VCol>
  </VRow>
  <div v-else-if="error">
    <VAlert
      type="error"
      variant="tonal"
    >
      {{ error }}
    </VAlert>
  </div>
  <div v-else>
    <VProgressCircular
      indeterminate
      color="primary"
    />
  </div>

  <!-- Edit User Dialog -->
  <UserInfoEditDialog
    v-model:is-dialog-visible="isEditDialogVisible"
    :user-data="userData"
    @user-updated="handleUserUpdate"
  />
</template>
