# Changes

## 购物车数量请求防重复触发

改动文件：`src/views/CartView.vue`

改动前：

```ts
const changeCartItemCount = async (item: any, count: number) => {
    const res = await addCart({
        basketId: item.basketId,
        prodId: item.prodId,
        skuId: item.skuId,
        shopId: item.shopId,
        count: count,
    })

    if (!res.success) {
        showFailToast(res.msg || '修改数量失败')
        return
    }

    const nextCount = item.prodCount + count
    if (nextCount > 0) {
        item.prodCount = nextCount
    } else if (nextCount <= 0) {
        handleDeleteCartItem([item.basketId])
    }
    getTotalPrice()
}
```

```vue
<van-stepper
    :model-value="item.prodCount"
    @change="onStepperChange(item, $event)"
/>
```

改动后：

```ts
const updatingBasketIds = ref(new Set<number>())

const changeCartItemCount = async (item: any, count: number) => {
    if (updatingBasketIds.value.has(item.basketId)) return

    updatingBasketIds.value.add(item.basketId)
    try {
        const res = await addCart({
            basketId: item.basketId,
            prodId: item.prodId,
            skuId: item.skuId,
            shopId: item.shopId,
            count: count,
        })

        if (!res.success) {
            showFailToast(res.msg || '修改数量失败')
            return
        }

        const nextCount = item.prodCount + count
        if (nextCount > 0) {
            item.prodCount = nextCount
        } else {
            await handleDeleteCartItem([item.basketId])
        }
        await getTotalPrice()
    } finally {
        updatingBasketIds.value.delete(item.basketId)
    }
}
```

```vue
<van-stepper
    :model-value="item.prodCount"
    :disabled="updatingBasketIds.has(item.basketId)"
    @change="onStepperChange(item, $event)"
/>
```

解释：用 `Set` 记录正在更新的购物车项。请求完成前禁用对应步进器，避免同一商品产生并发请求。`finally` 保证请求成功或失败后都能解除禁用。

## 购物车数量修改参数类型

改动文件：`src/types/cart.ts`、`src/views/CartView.vue`

改动前：

```ts
const changeCartItemCount = async (item: any, count: number) => {
const onStepperChange = (item: any, newCount: number) => {
```

改动后：

```ts
// src/types/cart.ts
export interface CartItem {
    basketId: number
    prodId: number
    skuId: number
    shopId: number
    prodCount: number
    checked: boolean
}

// src/views/CartView.vue
import type { CartItem } from '@/types/cart'

const changeCartItemCount = async (item: CartItem, count: number) => {
const onStepperChange = (item: CartItem, newCount: number) => {
```

解释：购物车项类型单独放在 `types` 目录，页面通过 `import type` 引入。字段名或类型写错时 TypeScript 会报错。

## 路由页面懒加载

改动文件：`src/router/index.ts`

改动前：

```ts
import HomeView from '@/views/HomeView.vue'
import CartView from '@/views/CartView.vue'
import MyOrderView from '@/views/MyOrderView.vue'
```

改动后：

```ts
const HomeView = () => import('@/views/HomeView.vue')
const CartView = () => import('@/views/CartView.vue')
const MyOrderView = () => import('@/views/MyOrderView.vue')
```

其他页面使用相同方式修改，`Layout` 保持同步加载。

解释：进入路由时才加载对应页面，Vite 会把各页面拆分为独立文件，减少首次加载的 JavaScript。

## 购物车加载失败提示

改动文件：`src/views/CartView.vue`

改动前：

```ts
try {
    // 加载购物车和地址
} finally {
    loading.value = false
}
```

改动后：

```ts
try {
    // 加载购物车和地址
} catch {
    showFailToast('购物车加载失败')
} finally {
    loading.value = false
}
```

解释：请求失败时明确提示用户，`finally` 继续负责结束加载状态。

## 商品详情并发请求

改动文件：`src/views/ProductDetailView.vue`

改动前：

```ts
const res = await getProductDetail(prodId)
const collectionStatus = await getCollectionStatus(prodId)
const resComment = await getProductCommentData(prodId)
```

改动后：

```ts
const [res, collectionStatus, resComment] = await Promise.all([
  getProductDetail(prodId),
  getCollectionStatus(prodId),
  getProductCommentData(prodId),
])
```

解释：三个请求都只依赖 `prodId`，使用 `Promise.all` 同时发起，页面无需依次等待每个请求。

## 登录后返回原访问页面

改动文件：`src/router/index.ts`、`src/views/LoginView.vue`

改动前：

```ts
return '/login'
await router.push('/home')
```

改动后：

```ts
return {
  path: '/login',
  query: { redirect: to.fullPath },
}

const redirect = route.query.redirect
await router.replace(typeof redirect === 'string' ? redirect : '/home')
```

解释：路由守卫用 `redirect` 保存原地址，登录成功后返回该地址；没有原地址时进入首页。`replace` 会替换登录页记录，返回时不会再回到登录页。
