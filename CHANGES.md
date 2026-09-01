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

改动文件：`src/views/CartView.vue`

改动前：

```ts
const changeCartItemCount = async (item: any, count: number) => {
const onStepperChange = (item: any, newCount: number) => {
```

改动后：

```ts
interface CartItem {
    basketId: number
    prodId: number
    skuId: number
    shopId: number
    prodCount: number
    checked: boolean
}

const changeCartItemCount = async (item: CartItem, count: number) => {
const onStepperChange = (item: CartItem, newCount: number) => {
```

解释：用 `CartItem` 代替数量修改函数的 `any`，字段名或类型写错时 TypeScript 会报错。
