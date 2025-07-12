<script setup>

import UserInfoEditDialog from '@/components/fammeba/user/UserInfoEditDialog.vue'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const isUserInfoEditDialogVisible = ref(false)
const isDisableDialogVisible = ref(false)
const isEnableDialogVisible = ref(false)
const userToDisable = ref(null)
const userToEnable = ref(null)

const emit = defineEmits(['edit-user', 'user-disabled', 'user-enabled'])

const handleEditClick = () => {
  emit('edit-user')
}

// Función para abrir el diálogo de desactivación
const openDisableDialog = () => {
  userToDisable.value = props.userData
  isDisableDialogVisible.value = true
}

// Función para abrir el diálogo de activación
const openEnableDialog = () => {
  userToEnable.value = props.userData
  isEnableDialogVisible.value = true
}

// Función para manejar la desactivación del usuario
const handleUserDisabled = () => {
  isDisableDialogVisible.value = false
  emit('user-disabled')
}

// Función para manejar la activación del usuario
const handleUserEnabled = () => {
  isEnableDialogVisible.value = false
  emit('user-enabled')
}

// Función para generar el texto del avatar
const avatarText = name => {
  if (!name) return ''
  const nameArray = name.split(' ')
  return nameArray.map(word => word.charAt(0).toUpperCase()).join('')
}

// Función para resolver el color del rol
const resolveUserRoleVariant = role => {
  const roleLowerCase = role.toLowerCase()
  if (roleLowerCase === 'administrador') return { color: 'primary', icon: 'ri-vip-crown-line' }
  if (roleLowerCase === 'recepcionista') return { color: 'error', icon: 'ri-computer-line' }
  if (roleLowerCase === 'operador') return { color: 'info', icon: 'ri-pie-chart-line' }
  return { color: 'primary', icon: 'ri-user-line' }
}

// Función para resolver el estado
const resolveUserStatus = status => {
  if (status === 'ENABLED') return 'Activo'
  if (status === 'DISABLED') return 'Inactivo'
  return status
}

// Función para resolver el color del estado
const resolveUserStatusVariant = status => {
  const statusLowerCase = status.toLowerCase()
  if (statusLowerCase === 'enabled') return '#26A69A'
  if (statusLowerCase === 'disabled') return 'secondary'
  return 'primary'
}
</script>

<template>
  <VRow>
    <!-- SECTION User Details -->
    <VCol cols="12">
      <VCard v-if="props.userData">
        <VCardText class="text-center pt-12 pb-6">
          <!-- 👉 Avatar -->
          <VAvatar
            rounded="lg"
            :size="120"
            :color="resolveUserRoleVariant(props.userData.role).color"
            variant="tonal"
          >
            <span class="text-5xl font-weight-medium">
              {{ avatarText(`${props.userData.name} ${props.userData.lastname}`) }}
            </span>
          </VAvatar>

          <!-- 👉 User fullName -->
          <h5 class="text-h5 mt-4">
            {{ props.userData.name + ' ' + props.userData.lastname }}
          </h5>

          <!-- 👉 Role chip -->
          <VChip
            :color="resolveUserRoleVariant(props.userData.role).color"
            size="small"
            class="text-capitalize mt-4"
          >
            <VIcon
              :icon="resolveUserRoleVariant(props.userData.role).icon"
              size="16"
              class="me-1"
            />
            {{ props.userData.role }}
          </VChip>
        </VCardText>

        <!-- 👉 Details -->
        <VCardText class="pb-6">
          <div class="text-body-2 mb-4 text-disabled">
            DATOS
          </div>

          <div class="d-flex flex-column gap-y-4">
            <div class="d-flex align-center gap-x-2">
              <VIcon
                icon="ri-user-line"
                size="24"
              />
              <div class="font-weight-medium">
                Nombres:
              </div>
              <div class="text-body-1">
                {{ props.userData.name }}
              </div>
            </div>

            <div class="d-flex align-center gap-x-2">
              <VIcon
                icon="ri-user-line"
                size="24"
              />
              <div class="font-weight-medium">
                Apellidos:
              </div>
              <div class="text-body-1">
                {{ props.userData.lastname }}
              </div>
            </div>

            <div class="d-flex align-center gap-x-2">
              <VIcon
                icon="ri-mail-line"
                size="24"
              />
              <div class="font-weight-medium">
                Email:
              </div>
              <div class="text-body-1">
                {{ props.userData.email }}
              </div>
            </div>

            <div class="d-flex align-center gap-x-2">
              <VIcon
                icon="ri-phone-line"
                size="24"
              />
              <div class="font-weight-medium">
                Contacto:
              </div>
              <div class="text-body-1">
                {{ props.userData.contacto }}
              </div>
            </div>
          </div>

          <div class="text-body-2 text-disabled mt-6 mb-4">
            CUENTA
          </div>

          <div class="d-flex flex-column gap-y-4">
            <div class="d-flex align-center gap-x-2">
              <VIcon
                icon="ri-user-settings-line"
                size="24"
              />
              <div class="font-weight-medium">
                Usuario:
              </div>
              <div class="text-body-1">
                {{ props.userData.username }}
              </div>
            </div>

            <div class="d-flex align-center gap-x-2">
              <VIcon
                :icon="resolveUserRoleVariant(props.userData.role).icon"
                size="24"
              />
              <div class="font-weight-medium">
                Rol:
              </div>
              <div class="text-capitalize text-body-1">
                {{ props.userData.role }}
              </div>
            </div>

            <div class="d-flex align-center gap-x-2">
              <VIcon
                icon="ri-checkbox-circle-line"
                size="24"
              />
              <div class="font-weight-medium">
                Estado:
              </div>
              <VChip
                :color="resolveUserStatusVariant(props.userData.status)"
                size="small"
                class="text-capitalize"
              >
                {{ resolveUserStatus(props.userData.status) }}
              </VChip>
            </div>
          </div>
        </VCardText>

        <!-- 👉 Edit and Suspend button -->
        <VCardText class="d-flex justify-center">
          <VBtn
            variant="elevated"
            class="me-4"
            @click="handleEditClick"
            prepend-icon="ri-edit-line"
            v-if="isPermission('UPDATE_ONE_USER')"
          >
            Editar
          </VBtn>
          <VBtn
            v-if="props.userData.status === 'ENABLED' && isPermission('DISABLE_ONE_USER')"
            variant="outlined"
            color="error"
            @click="openDisableDialog"
            prepend-icon="ri-forbid-2-fill"
          >
            Desactivar
          </VBtn>
          <VBtn
            v-else-if="props.userData.status === 'DISABLED' && isPermission('UPDATE_ONE_USER')"
            variant="outlined"
            color="info"
            @click="openEnableDialog"
            prepend-icon="ri-check-fill"
          >
            Activar
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
   
  </VRow>

  <UserInfoEditDialog
    v-model:isDialogVisible="isUserInfoEditDialogVisible"
    :user-data="props.userData"
  />
  <DisableUserDialog
    v-model:is-dialog-visible="isDisableDialogVisible"
    :user-data="userToDisable"
    @user-disabled="handleUserDisabled"
  />
  <EnableUserDialog
    v-model:is-dialog-visible="isEnableDialogVisible"
    :user-data="userToEnable"
    @user-enabled="handleUserEnabled"
  />
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.5rem;
}

.current-plan {
  border: 2px solid rgb(var(--v-theme-primary));
}

.text-capitalize {
  text-transform: capitalize !important;
}
</style>
