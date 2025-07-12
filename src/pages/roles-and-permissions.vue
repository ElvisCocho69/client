<script>
import { ref, onMounted, computed } from 'vue';
import { $api } from '@/utils/api';
import AddRoleDialog from '@/components/fammeba/role/AddRoleDialog.vue';
import EditRoleDialog from '@/components/fammeba/role/EditRoleDialog.vue';
import DeleteRoleDialog from '@/components/fammeba/role/DeleteRoleDialog.vue';

const headers = [
    { title: 'ID', key: 'id' },
    { title: 'ROL', key: 'name' },
    { title: 'PERMISOS', key: 'permissions' },
    { title: 'OPCIONES', key: 'actions' }
];

export default {
    setup() {
        const data = ref([]);
        const searchQuery = ref('');
        const isAddRoleDialogVisible = ref(false);
        const isEditRoleDialogVisible = ref(false);
        const selectedRole = ref(null);
        const isDeleteDialogVisible = ref(false);
        const roleToDelete = ref(null);
        
        // Estados para las notificaciones
        const notification = ref({
            show: false,
            type: 'error',
            message: '',
            timeout: 5000
        });

        // Función para mostrar notificaciones
        const showNotification = (message, type = 'error') => {
            notification.value = {
                show: true,
                type,
                message,
                timeout: 5000
            };
        };

        // Función para ocultar notificaciones
        const hideNotification = () => {
            notification.value.show = false;
        };

        // Computed property para filtrar los roles según la búsqueda
        const filteredRoles = computed(() => {
            if (!searchQuery.value) return data.value;
            const query = searchQuery.value.toLowerCase();
            return data.value.filter(role => 
                role.name.toLowerCase().includes(query)
            );
        });

        // Función para obtener los roles
        const list = async () => {
            try {
                const resp = await $api('/roles', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                data.value = resp.content || [];
            } catch (error) {
                console.error('Error al obtener roles:', error);
                showNotification('Error al cargar los roles. Por favor, intente nuevamente.');
            }
        };

        const editItem = (item) => {
            selectedRole.value = item;
            isEditRoleDialogVisible.value = true;
        };

        const deleteItem = async (item) => {
            if (confirm('¿Está seguro de eliminar este rol?')) {
                try {
                    await $api(`/roles/${item.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    await list(); // Recargar la lista después de eliminar
                    showNotification('Rol eliminado exitosamente', 'success');
                } catch (error) {
                    console.error('Error al eliminar el rol:', error);
                    showNotification('Error al eliminar el rol. Por favor, intente nuevamente.');
                }
            }
        };

        const handleRoleUpdated = () => {
            list(); // Recargar la lista después de actualizar
            showNotification('Rol actualizado exitosamente', 'success');
        };

        const openDeleteDialog = (role) => {
            roleToDelete.value = role;
            isDeleteDialogVisible.value = true;
        };

        const handleRoleDeleted = () => {
            isDeleteDialogVisible.value = false;
            list();
            showNotification('Rol eliminado exitosamente', 'success');
        };

        // Llamada a la función al montar el componente
        onMounted(() => {
            list();
        });

        return {
            headers,
            data,
            searchQuery,
            filteredRoles,
            isAddRoleDialogVisible,
            isEditRoleDialogVisible,
            selectedRole,
            list,
            editItem,
            deleteItem,
            handleRoleUpdated,
            isDeleteDialogVisible,
            roleToDelete,
            openDeleteDialog,
            handleRoleDeleted,
            notification,
            hideNotification
        };
    }
};
</script>

<template>
    <div>
        <VCard>
            <!-- Notificación de error/éxito -->
            

            <VCardText class="d-flex flex-wrap gap-4">
                <div class="d-flex align-center">
                    <VTextField 
                        v-model="searchQuery"
                        placeholder="Buscar Rol" 
                        style="inline-size: 300px;" 
                        density="compact" 
                        class="me-3"
                        prepend-inner-icon="ri-search-line"
                    >
                    </VTextField>
                </div>
                <VSpacer></VSpacer>
                <div class="d-flex gap-x-4 align-center">
                    <VBtn color="primary" prepend-icon="ri-add-line"
                        @click="isAddRoleDialogVisible = !isAddRoleDialogVisible"
                        v-if="isPermission('CREATE_ONE_ROL')"
                    >
                        Añadir Rol
                    </VBtn>
                </div>
            </VCardText>

            <VDataTable :headers="headers" :items="filteredRoles" :items-per-page="5" class="text-no-wrap mt-5">
                <template #item.id="{ item }">
                    <span class="text-h6">{{ item.id }}</span>
                </template>

                <template #item.name="{ item }">
                    <span>{{ item.name }}</span>
                </template>

                <template #item.permissions="{ item }">
                    <ul>
                        <li v-for="(permiso, index) in item.permissions" :key="index" style="list-style: none; padding: 2px;">
                            ✅ {{ permiso }}
                        </li>
                    </ul>
                </template>

                <template #item.actions="{ item }">
                    <div class="d-flex gap-1">
                        <VTooltip location="top">
                            <template #activator="{ props }">
                                <IconBtn
                                    v-bind="props"
                                    size="small"
                                    @click="editItem(item)"
                                    v-if="isPermission('UPDATE_ONE_ROL')"
                                >
                                    <VIcon icon="ri-pencil-line" />
                                </IconBtn>
                            </template>
                            <span>Editar rol</span>
                        </VTooltip>

                        <VTooltip location="top">
                            <template #activator="{ props }">
                                <IconBtn
                                    v-bind="props"
                                    size="small"
                                    @click="openDeleteDialog(item)"
                                    v-if="isPermission('DELETE_ONE_ROL')"
                                >
                                    <VIcon icon="ri-delete-bin-line" />
                                </IconBtn>
                            </template>
                            <span>Eliminar rol</span>
                        </VTooltip>
                    </div>
                </template>
            </VDataTable>

            <AddRoleDialog v-model:is-dialog-visible="isAddRoleDialogVisible" @role-added="list" />
            <EditRoleDialog 
                v-model:is-dialog-visible="isEditRoleDialogVisible" 
                :role-data="selectedRole"
                @role-updated="handleRoleUpdated"
            />
            <DeleteRoleDialog
                v-model:is-dialog-visible="isDeleteDialogVisible"
                :role="roleToDelete"
                @role-deleted="handleRoleDeleted"
            />
        </VCard>
    </div>
</template>
