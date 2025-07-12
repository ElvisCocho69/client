import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupGuards } from './guards'

function recursiveLayouts(route) {
  if (route.children) {
    for (let i = 0; i < route.children.length; i++)
      route.children[i] = recursiveLayouts(route.children[i])
    
    return route
  }
  
  return setupLayouts([route])[0]
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash)
      return { el: to.hash, behavior: 'smooth', top: 60 }
    
    return { top: 0 }
  },
  extendRoutes: pages => [
    ...[{
      path: '/',
      name: 'index',
      redirect: to => {
        const userData = localStorage.getItem('user');
        if (userData) {
          return { name: 'dashboard' };
        }
        return {name: 'login', query: to.query}
      }
    }],
    ...[...pages,...[
      {
        path: '/orders/preview',
        name: 'order-preview',
        component: () => import('@/views/order/OrderPreview.vue'),
        meta: {
          layout: 'default',
          requiresAuth: true,
          title: 'Vista Previa de Pedido',
          requiresPermission: 'READ_ALL_ORDERS'
        },
      },
      {
        path: '/orders/detail/:id',
        name: 'order-detail',
        component: () => import('@/views/order/OrderDetail.vue'),
        meta: {
          layout: 'default',
          requiresAuth: true,
          title: 'Detalle de Pedido',
          requiresPermission: 'READ_ALL_ORDERS'
        },
      },
      {
        path: '/orders/edit/:id',
        name: 'order-edit',
        component: () => import('@/views/order/OrderEdit.vue'),
        meta: {
          layout: 'default',
          requiresAuth: true,
          title: 'Editar Pedido',
          requiresPermission: 'UPDATE_ONE_ORDER'
        },
      },
      {
        path: '/milestones/:structureId',
        name: 'milestones',
        component: () => import('@/views/order/Milestones.vue'),
        meta: {
          layout: 'default',
          requiresAuth: true,
          requiresPermission: 'READ_ALL_MILESTONES'
        }
      }
    ]].map(route => recursiveLayouts(route)),
  ],
})

setupGuards(router);
export { router }
export default function (app) {
  app.use(router)
}
