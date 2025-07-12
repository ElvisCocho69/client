export const COOKIE_MAX_AGE_1_YEAR = 365 * 24 * 60 * 60


export const PERMISOS = [
    {
        name: 'Dashboard',
        permisos: [{
            name: 'Graficos',
            permiso: 'SHOW_REPORT_GRAPHICS',
            operationId: 5
        }],
    },
    {
        name: 'Roles y Permisos',
        permisos: [
            {
                name: 'Registrar',
                permiso: 'CREATE_ONE_ROL',
                operationId: 6
            },
            {
                name: 'Listado',
                permiso: 'READ_ALL_ROLES',
                operationId: 7
            },
            {
                name: 'Edición',
                permiso: 'UPDATE_ONE_ROL',
                operationId: 8
            },
            {
                name: 'Eliminar',
                permiso: 'DELETE_ONE_ROL',
                operationId: 9
            }
        ]
    },
    {
        name: 'Usuarios',
        permisos: [
            {
                name: 'Registrar',
                permiso: 'CREATE_ONE_USER',
                operationId: 10
            },
            {
                name: 'Listado',
                permiso: 'READ_ALL_USERS',
                operationId: 11
            },
            {
                name: 'Ver Detalle',
                permiso: 'READ_ONE_USER',
                operationId: 12
            },
            {
                name: 'Edición',
                permiso: 'UPDATE_ONE_USER',
                operationId: 13
            },
            {
                name: 'Desactivar',
                permiso: 'DISABLE_ONE_USER',
                operationId: 14
            },
            {
                name: 'Seguridad',
                permiso: 'CHANGE_PASSWORD',
                operationId: 15
            },
            {
                name: 'Exportar PDF',
                permiso: 'EXPORT_PDF',
                operationId: 16
            },
            {
                name: 'Exportar EXCEL',
                permiso: 'EXPORT_EXCEL',
                operationId: 17
            },
            {
                name: 'Exportar CSV',
                permiso: 'EXPORT_CSV',
                operationId: 18
            },            
        ]
    },
    {
        name: 'Clientes',
        permisos: [
            {
                name: 'Registrar',
                permiso: 'CREATE_ONE_CLIENT',
                operationId: 19
            },
            {
                name: 'Listado',
                permiso: 'READ_ALL_CLIENTS',
                operationId: 20
            },
            {
                name: 'Ver Detalle',
                permiso: 'READ_ONE_CLIENT',
                operationId: 21
            },
            {
                name: 'Editar',
                permiso: 'UPDATE_ONE_CLIENT',
                operationId: 22
            },
            {
                name: 'Desactivar',
                permiso: 'DISABLE_ONE_CLIENT',
                operationId: 23
            },
            {
                name: 'Exportar PDF',
                permiso: 'CLIEN_EXPORT_PDF',
                operationId: 24
            },
            {
                name: 'Exportar EXCEL',
                permiso: 'CLIENT_EXPORT_EXCEL',
                operationId: 25
            }           
        ]
    },
    {
        name: 'Órdenes',
        permisos: [
            {
                name: 'Registrar',
                permiso: 'CREATE_ONE_ORDER',
                operationId: 26
            },
            {
                name: 'Listado',
                permiso: 'READ_ALL_ORDERS',
                operationId: 27
            },
            {
                name: 'Ver Detalle',
                permiso: 'READ_ONE_ORDER',
                operationId: 28
            },
            {
                name: 'Editar',
                permiso: 'UPDATE_ONE_ORDER',
                operationId: 29
            },
            {
                name: 'Cancelar',
                permiso: 'CANCEL_ONE_ORDER',
                operationId: 30
            },
            {
                name: 'Exportar PDF',
                permiso: 'ORDER_EXPORT_PDF',
                operationId: 31
            },
            {
                name: 'Editar Detalle',
                permiso: 'UPDATE_DETAIL',
                operationId: 32
            }        
        ]
    },
    {
        name: 'Multimedia',
        permisos: [
            {
                name: 'Subir Archivo',
                permiso: 'UPLOAD_FILE',
                operationId: 33
            },
            {
                name: 'Ver Archvo',
                permiso: 'GET_FILE',
                operationId: 34
            },
            {
                name: 'Eliminar Archivo',
                permiso: 'DELETE_FILE',
                operationId: 36
            }      
        ]
    },
    {
        name: 'Diseño',
        permisos: [
            {
                name: 'Registrar',
                permiso: 'CREATE_DESIGN',
                operationId: 37
            },
            {
                name: 'Actualizar',
                permiso: 'UPDATE_DESIGN',
                operationId: 38
            },
            {
                name: 'Listado',
                permiso: 'GET_DESIGN',
                operationId: 39
            },
            {
                name: 'Ver Detalle',
                permiso: 'GET_DESIGN_BY_STRUCTURE_ID',
                operationId: 40
            },
            {
                name: 'Eliminar',
                permiso: 'DELETE_DESIGN',
                operationId: 41
            }      
        ]
    },
    {
        name: 'Inventario',
        permisos: [
            {
                name: 'Registrar',
                permiso: 'CREATE_ONE_MATERIAL',
                operationId: 42
            },
            {
                name: 'Actualizar',
                permiso: 'UPDATE_ONE_MATERIAL',
                operationId: 43
            },
            {
                name: 'Listado',
                permiso: 'READ_ALL_MATERIALS',
                operationId: 44
            },
            {
                name: 'Ver Detalle por Código',
                permiso: 'READ_ONE_MATERIAL_BY_CODE',
                operationId: 45
            },
            {
                name: 'Ver Detalle por ID',
                permiso: 'READ_ONE_MATERIAL_BY_ID',
                operationId: 46
            },
            {
                name: 'Ver Movimientos',
                permiso: 'READ_ALL_MATERIAL_MOVEMENTS',
                operationId: 47
            },
            {
                name: 'Ver Movimientos por Material',
                permiso: 'READ_ALL_MOVEMENTS_FROM_ONE_MATERIAL',
                operationId: 48
            },
            {
                name: 'Registrar Movimiento',
                permiso: 'REGISTER_MOVEMENTS',
                operationId: 49
            },
            {
                name: 'Ver Inventario',
                permiso: 'READ_INVENTORY_BY_MATERIAL_CODE',
                operationId: 50
            },
            {
                name: 'Ver Categorías',
                permiso: 'READ_ALL_CATEGORIES',
                operationId: 51
            },
            {
                name: 'Crear Categoría',
                permiso: 'CREATE_ONE_CATEGORY',
                operationId: 52
            },
            {
                name: 'Actualizar Categoría',
                permiso: 'UPDATE_ONE_CATEGORY',
                operationId: 53
            },
            {
                name: 'Ver Categoría',
                permiso: 'READ_ONE_MATERIAL_CATEGORY',
                operationId: 54
            },
            {
                name: 'Desactivar Categoría',
                permiso: 'DISABLE_ONE_CATEGORY',
                operationId: 55
            },
            {
                name: 'Eliminar Categoría',
                permiso: 'DELETE_ONE_CATEGORY',
                operationId: 56
            },
            {
                name: 'Eliminar Material',
                permiso: 'DELETE_ONE_MATERIAL',
                operationId: 57
            }
        ]
    },
    {
        name: 'Proveedores',
        permisos: [
            {
                name: 'Registrar',
                permiso: 'CREATE_ONE_SUPPLIER',
                operationId: 58
            },
            {
                name: 'Actualizar',
                permiso: 'UPDATE_ONE_SUPPLIER',
                operationId: 59
            },
            {
                name: 'Listado',
                permiso: 'READ_ALL_SUPPLIERS',
                operationId: 60
            },
            {
                name: 'Ver Detalle',
                permiso: 'READ_ONE_SUPPLIER',
                operationId: 61
            },
            {
                name: 'Eliminar',
                permiso: 'DISABLE_ONE_SUPPLIER',
                operationId: 62
            }      
        ]
    },
    {
        name: 'Valoraciones',
        permisos: [
            {
                name: 'Registrar',
                permiso: 'CREATE_RATING',
                operationId: 64
            },
            {
                name: 'Listado',
                permiso: 'READ_ALL_RATINGS',
                operationId: 65
            },
            {
                name: 'Ver Detalle',
                permiso: 'READ_ONE_RATING',
                operationId: 66
            },
            {
                name: 'Ver Rating por Órden',
                permiso: 'READ_RATINGS_BY_ORDER',
                operationId: 67
            },
            {
                name: 'Ver Órdenes por Clientes',
                permiso: 'READ_ORDERS_BY_CLIENT',
                operationId: 68
            }     
        ]
    },
    {
        name: 'Hitos',
        permisos: [
            {
                name: 'Registrar',
                permiso: 'CREATE_MILESTONE',
                operationId: 69
            },
            {
                name: 'Actualizar',
                permiso: 'UPDATE_MILESTONE',
                operationId: 70
            },
            {
                name: 'Listado',
                permiso: 'READ_ALL_MILESTONES',
                operationId: 71
            }
        ]
    },
    {
        name: 'Perfil',
        permisos: [
            {
                name: 'Actualizar Contraseña',
                permiso: 'CHANGE_OWN_PASSWORD',
                operationId: 63
            }                  
        ]
    },
]

export function isPermission(permission) {
    try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return false;
        
        const USER = JSON.parse(userStr);
        if (!USER || !USER.role) return false;

        if (USER.role.name === 'Administrador') {
            return true;
        }

        if (!USER.authorities) return false;

        return USER.authorities.includes(permission);
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}
