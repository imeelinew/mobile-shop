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
const GuideView = () => import('@/views/GuideView.vue')

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
      path: '/guide',
      name: 'guide',
      component: GuideView,
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

const whiteList = ['/login', '/register', '/guide']

router.beforeEach((to) => {
  if (!getToken() && !whiteList.includes(to.path)) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }
})

export default router
