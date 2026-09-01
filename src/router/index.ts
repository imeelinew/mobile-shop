import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/token'
import Layout from '@/components/Layout.vue'

const AddressView = () => import('@/views/AddressView.vue')
const CartView = () => import('@/views/CartView.vue')
const CategoryView = () => import('@/views/CategoryView.vue')
const HomeView = () => import('@/views/HomeView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const MineView = () => import('@/views/MineView.vue')
const MyOrderView = () => import('@/views/MyOrderView.vue')
const OrderConfirmView = () => import('@/views/OrderConfirmView.vue')
const ProductDetailView = () => import('@/views/ProductDetailView.vue')
const RegisterView = () => import('@/views/RegisterView.vue')
const SearchView = () => import('@/views/SearchView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/product-detail',
      name: 'product-detail',
      component: ProductDetailView,
    },
    {
      path: '/address',
      name: 'address',
      component: AddressView,
    },
    {
      path: '/order-confirm',
      name: 'order-confirm',
      component: OrderConfirmView,
    },
    {
      path: '/my-order',
      name: 'my-order',
      component: MyOrderView,
    },
    {
      path: '/',
      component: Layout,
      redirect: '/home',
      children: [
        {
          path: 'home',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'category',
          name: 'category',
          component: CategoryView,
        },
        {
          path: 'cart',
          name: 'cart',
          component: CartView,
        },
        {
          path: 'mine',
          name: 'mine',
          component: MineView,
        },
      ],
    }
  ]
})

const whiteList = ['/login', '/register']
const staleModulePattern = /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i
const recoveryKey = 'mobile-shop:route-recovery'

router.beforeEach((to) => {
  if (!getToken() && !whiteList.includes(to.path)) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }
})

router.onError((error, to) => {
  if (!staleModulePattern.test(String(error))) return

  const target = to.fullPath || `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (sessionStorage.getItem(recoveryKey) === target) {
    sessionStorage.removeItem(recoveryKey)
    return
  }

  sessionStorage.setItem(recoveryKey, target)
  const reloadUrl = new URL(target, window.location.origin)
  reloadUrl.searchParams.set('_app_reload', Date.now().toString())
  window.location.replace(reloadUrl)
})

router.afterEach(() => {
  sessionStorage.removeItem(recoveryKey)
})

export default router
