<script setup>
import { $api } from '@/utils/api'
import { PERMISOS } from '@/utils/constants'
import { ref } from 'vue'
import { VAlert, VCheckbox, VTextField } from 'vuetify/components'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:isDialogVisible', 'role-added'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const handleCloseDialog = () => {
  emit('update:isDialogVisible', false);

  role.value = null;
  permissions.value = [];
  warning.value = null;
  error_exists.value = null;
  success.value = null;
}

const LIST_PERMISSION = PERMISOS;

const role = ref(null);

const permissions = ref([]);

const warning = ref(null);

const error_exists = ref(null);

const success = ref(null);

// Función para verificar si el rol ya existe
const checkRoleExists = async (roleName) => {
  try {
    const resp = await $api('/roles', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const roles = resp.content || [];
    return roles.some(existingRole => 
      existingRole.name.toLowerCase() === roleName.toLowerCase()
    );
  } catch (error) {
    console.error("Error al verificar rol existente:", error);
    return false;
  }
};

const addPermission = (permiso) => {
  let INDEX = permissions.value.findIndex((perm) => perm == permiso);
  if (INDEX != -1) {
    permissions.value.splice(INDEX, 1)
  } else {
    permissions.value.push(permiso)
  }
  console.log(permissions.value)
  console.log(role.value)
}

const store = async () => {
  warning.value = null;
  error_exists.value = null;
  success.value = null;

  if (!role.value) {
    warning.value = "Se debe llenar el nombre del rol"
    return;
  }
  if (permissions.value.length == 0) {
    warning.value = "Se debe seleccionar al menos un permiso"
    return;
  }

  // Verificar si el rol ya existe
  const roleExists = await checkRoleExists(role.value);
  if (roleExists) {
    error_exists.value = `El rol "${role.value}" ya existe. Por favor, elija otro nombre.`;
    return;
  }

  let data = {
    name: role.value,
    operationIds: permissions.value,
  }

  try {
    const resp = await $api('/roles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: data,
      onResponseError({ response }) {
        console.log(response._data.backendMessage);
        error_exists.value = response._data.backendMessage || "Error al crear el rol. Por favor, intente nuevamente.";
      }
    });

    console.log(resp);
    success.value = "Rol creado correctamente";
    emit('role-added');

    setTimeout(() => {
      dialogVisibleUpdate(false);
      success.value = null;
      warning.value = null;
      role.value = null;
      permissions.value = [];
    }, 1500);

    
  } catch (error) {
    console.error("Error al guardar el rol:", error);
    error_exists.value = "Hubo un problema al crear el rol. Por favor, intente nuevamente.";
  }
}

</script>

<template>
  <VDialog :model-value="props.isDialogVisible" max-width="750" @update:model-value="dialogVisibleUpdate">
    <VCard class="refer-and-earn-dialog pa-3 pa-sm-11">
      <!-- 👉 dialog close btn -->
      <DialogCloseBtn variant="text" size="default" @click="handleCloseDialog" />

      <VCardText class="pa-5">
        <div class="mb-6">
          <h4 class="text-h4 text-center mb-2">
            Añadir Rol
          </h4>
          <!--
            <p class="text-sm-body-1 text-center">
                Supported payment methods
            </p>
          -->
        </div>

        <VTextField 
          label="Rol" 
          v-model="role" 
          placeholder="Ejemplo: Administrador"
          @input="error_exists = null"
        />

        <VAlert type="warning" class="mt-3" v-if="warning" closable>
          <strong>{{ warning }}</strong>
        </VAlert>

        <VAlert type="error" class="mt-3" v-if="error_exists" closable>
          <strong>{{ error_exists }}</strong>
        </VAlert>

        <VAlert type="success" class="mt-3" v-if="success" closable>
          <strong>{{ success }}</strong>
        </VAlert>

      </VCardText>

      <VCardText class="pa-5">
        <VBtn color="primary mb-4" @click="store" prepend-icon="ri-add-circle-fill">
          Crear
        </VBtn>
        <VTable>
          <thead>
            <tr>
              <th class="text-uppercase">
                Módulo
              </th>
              <th class="text-uppercase">
                Permiso
              </th>

            </tr>
          </thead>

          <tbody>
            <tr v-for="(item, index) in LIST_PERMISSION" :key="index">
              <td>
                {{ item.name }}
              </td>
              <td>
                <ul>
                  <li v-for="(permiso, index2) in item.permisos" :key="index2" style="list-style: none;">
                    <VCheckbox :label="permiso.name" :value="permiso.operationId"
                      @click="addPermission(permiso.operationId)" />
                  </li>
                </ul>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>


    </VCard>
  </VDialog>
</template>

<style lang="scss">
.refer-link-input {
  .v-field--appended {
    padding-inline-end: 0;
  }

  .v-field__append-inner {
    padding-block-start: 0.125rem;
  }
}
</style>
