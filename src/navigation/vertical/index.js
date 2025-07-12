import { isPermission } from '@/utils/constants'

export default [
  {
    title: 'Dashboard',
    to: { name: 'dashboard' },
    icon: { icon: 'ri-bar-chart-2-line' },
    meta: {
      requiresPermission: 'SHOW_REPORT_GRAPHICS'
    }
  },
  { heading: 'Accesos' },
  {
    title: 'Roles y Permisos',
    to: { name: 'roles-and-permissions' },
    icon: { icon: 'ri-lock-password-line' },
    meta: {
      requiresPermission: 'READ_ALL_ROLES'
    }
  },
  {
    title: 'Usuarios',
    to: { name: 'users' },
    icon: { icon: 'ri-group-line' },
    meta: {
      requiresPermission: 'READ_ALL_USERS'
    }
  },
  { heading: 'Gestion' },
  {
    title: 'Clientes',
    to: { name: 'customers' },
    icon: { icon: 'ri-user-shared-fill' },
    meta: {
      requiresPermission: 'READ_ALL_CLIENTS'
    }    
  }, 
  {
    title: 'Materiales',
    icon: { icon: 'ri-box-3-line' },
    meta: {
      requiresPermission: 'READ_ALL_MATERIALS'
    },
    children: [
      {
        title: 'Categorías',
        to: { name: 'materials-categories' },
        meta: {
          requiresPermission: 'READ_ALL_CATEGORIES'
        }
      },
      {
        title: 'Proveedores',
        to: { name: 'materials-suppliers' },
        meta: {
          requiresPermission: 'READ_ALL_SUPPLIERS'
        }
      },
      {
        title: 'Listado',
        to: { name: 'materials-list' },
        meta: {
          requiresPermission: 'READ_ALL_MATERIALS'
        }
      },
      {
        title: 'Movimientos',
        to: { name: 'materials-movements' },
        meta: {
          requiresPermission: 'READ_ALL_MATERIAL_MOVEMENTS'
        }
      }
    ]
  },
  {
    title: 'Pedidos',
    to: { name: 'orders' },
    icon: { icon: 'ri-shopping-cart-fill' },
    meta: {
      requiresPermission: 'READ_ALL_ORDERS'
    } 
  },
  { heading: 'Valoraciones' },
  {
    title: 'Calificaciones',
    to: { name: 'feedback-all' },
    icon: { icon: 'ri-star-fill' },
    meta: {
      requiresPermission: 'READ_ALL_RATINGS'
    } 
  },
  {
    title: 'Satisfacción',
    to: { name: 'feedback-list' },
    icon: { icon: 'ri-star-fill' },
    meta: {
      requiresPermission: 'READ_ORDERS_BY_CLIENT'
    } 
  },
]
