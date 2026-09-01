<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getCartInfo, getCartTotal, deleteCartItem, addCart } from '@/api/cart'
import { getAddressList } from '@/api/order'
import { showSuccessToast, showFailToast } from 'vant'
import 'vant/es/toast/style'
import { useRouter } from 'vue-router'
import ContentSkeleton from '@/components/ContentSkeleton.vue'
import type { CartItem } from '@/types/cart'
const router = useRouter()
const loading = ref(true)
const cartList = ref<any[]>([])
const defaultAddress = ref<any>(null)
const updatingBasketIds = ref(new Set<number>())
//总价
const totalPrice = ref(0)

//选中的商品（用于取basketId传给总价接口）
const selectedBasketIds = computed(() => {
    return cartItems.value.filter((item: any) => item.checked).map((item: any) => item.basketId)
})
//扁平化数组
const cartItems = computed(() => {
    const result = []
    cartList.value.forEach((item: any) => {
        item.shopCartItemDiscounts?.forEach((item: any) => {
            item.shopCartItems?.forEach((item: any) => {
                result.push(item)
            })
        })
    })
    return result
})

//全选状态
const allChecked = computed(() => {
    return cartItems.value.length > 0 &&
        cartItems.value.every((item: any) => item.checked)
})
//切换全选状态
const toggleAllChecked = (checked: boolean) => {
    cartItems.value.forEach((item: any) => {
        item.checked = checked
    })
}

//获取总价
const getTotalPrice = async () => {
    if (selectedBasketIds.value.length === 0) {
        totalPrice.value = 0
        return
    }
    const res = await getCartTotal(selectedBasketIds.value)
    totalPrice.value = res.data.totalMoney
}
//监听选中商品变化
watch(selectedBasketIds, async () => {
    await getTotalPrice()
})
//删除商品
const handleDeleteCartItem = async (basketIds: number[]) => {
    await deleteCartItem(basketIds)
    await loadCart()
}
const loadCart = async () => {
    try {
        const [cartRes, addressRes] = await Promise.all([
            getCartInfo(),
            getAddressList(),
        ])
        cartList.value = cartRes.data || []

        //给扁平化数组加默认false选中状态
        cartItems.value.forEach((item: any) => {
            item.checked = false
        })
        const addressList = addressRes.data || []
        defaultAddress.value = addressList.find((item: any) => Number(item.commonAddr) === 1)
            || addressList[0]
            || null
    } finally {
        loading.value = false
    }
}
//切换商品数量
const changeCartItemCount = async (item: CartItem, count: number) => {
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
//stepper
const onStepperChange = (item: CartItem, newCount: number) => {
    const delta = newCount - item.prodCount
    changeCartItemCount(item, delta)
}
//提交订单
const handleCheckout = () => {
    if (selectedBasketIds.value.length === 0) {
        showFailToast('请选择商品')
        return
    }
    const orderParams = {
        basketIds: selectedBasketIds.value,
        addrId: defaultAddress.value?.addrId ?? 0,
    }
    sessionStorage.setItem('confirmOrder', JSON.stringify(orderParams))
    router.push('/order-confirm')
}
onMounted(() => {
    loadCart()
})
</script>

<template>
    <div class="cart-page">
        <van-nav-bar title="购物车" />

        <van-cell
            v-if="!loading && defaultAddress"
            class="address-cell"
            icon="location-o"
            is-link
            @click="router.push({ path: '/address', query: { from: 'cart' } })"
        >
            <template #title>
                {{ defaultAddress.province }}{{ defaultAddress.city }}{{ defaultAddress.area }}{{ defaultAddress.addr }}
            </template>
        </van-cell>
        <van-cell
            v-else-if="!loading"
            class="address-cell"
            icon="location-o"
            title="请添加收货地址"
            is-link
            @click="router.push({ path: '/address', query: { from: 'cart' } })"
        />

        <ContentSkeleton v-if="loading" variant="list" :rows="4" />

        <template v-else-if="cartList.length">
            <section v-for="shop in cartList" :key="shop.shopId" class="cart-shop">
                <div class="shop-title">
                    <van-checkbox :model-value="allChecked" checked-color="#ee0a24"
                        @update:model-value="toggleAllChecked" />
                    <strong>{{ shop.shopName }}</strong>
                </div>

                <template v-for="(discount, index) in shop.shopCartItemDiscounts" :key="index">
                    <div v-for="item in discount.shopCartItems" :key="item.basketId" class="cart-item">
                        <van-checkbox v-model="item.checked" checked-color="#ee0a24" />
                        <van-swipe-cell>
                            <van-card class="cart-card" :thumb="item.pic" :title="item.prodName" :desc="item.skuName"
                                :price="item.price">
                                <template #num>
                                    <van-stepper :model-value="item.prodCount"
                                        :disabled="updatingBasketIds.has(item.basketId)"
                                        @change="onStepperChange(item, $event)" />
                                </template>
                            </van-card>
                            <template #right>
                                <van-button square text="删除" type="danger" class="delete-button"
                                    @click="handleDeleteCartItem([item.basketId])" />
                            </template>
                        </van-swipe-cell>
                    </div>
                </template>
            </section>
        </template>

        <van-empty v-else description="购物车还是空的" />

        <van-submit-bar class="cart-submit-bar" :price="totalPrice * 100" button-text="提交订单" @submit="handleCheckout">
            <van-checkbox :model-value="allChecked" checked-color="#ee0a24"
                @update:model-value="toggleAllChecked">全选</van-checkbox>
            <div class="clear-button" v-if="allChecked" @click="handleDeleteCartItem(selectedBasketIds)">
                清空
            </div>
        </van-submit-bar>
    </div>
</template>

<style lang="scss" scoped>
.cart-page {
    min-height: 100vh;
    padding-bottom: 100px;
    background: var(--shop-bg);
}

.address-cell {
    margin-bottom: 16px;

    :deep(.van-cell__left-icon) {
        color: var(--shop-primary);
    }
}

.cart-loading {
    padding-top: 160px;
}

.cart-shop {
    margin: 0 20px 16px;
    overflow: hidden;
    border-radius: var(--shop-radius);
    background: var(--shop-card);
}

.shop-title {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 24px 12px;

    strong {
        font-size: 28px;
        font-weight: 700;
    }
}

.cart-item {
    display: flex;
    align-items: center;
    padding: 0 12px 12px 20px;

    .van-swipe-cell {
        flex: 1;
        min-width: 0;
    }
}

.cart-card {
    background: transparent;

    :deep(.van-card__thumb) {
        width: 160px;
        height: 160px;
        border-radius: var(--shop-radius-sm);
        overflow: hidden;
    }

    :deep(.van-card__title) {
        font-weight: 600;
    }

    :deep(.van-card__price) {
        color: var(--shop-primary);
        font-weight: 700;
    }
}

.cart-submit-bar {
    bottom: 100px;

    .clear-button {
        margin-left: 16px;
        color: var(--shop-primary);
        font-size: 24px;
    }
}

.delete-button {
    height: 100%;
}
</style>
