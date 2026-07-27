<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getCartInfo, getCartTotal, deleteCartItem, addCart } from '@/api/cart'
import { getAddressList } from '@/api/order'
import { showSuccessToast, showFailToast } from 'vant'
const loading = ref(true)
const cartList = ref<any[]>([])
const defaultAddress = ref<any>(null)
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
    console.log(selectedBasketIds.value, 'selectedBasketIds选中的商品')
    console.log(totalPrice.value, 'totalPrice总价')
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
        console.log(cartItems.value, 'cartItems扁平后数据')
        const addressList = addressRes.data || []
        defaultAddress.value = addressList.find((item: any) => item.commonAddr === 1)
            || addressList[0]
            || null
    } finally {
        loading.value = false
    }
}
// TODO: 快速连续点击加减号会触发多个并发请求，响应顺序不保证，可能导致 totalPrice 显示错误（竞态问题）。
// 修复思路：给每个 item 加一个 updating 状态，请求进行中禁用该项的 stepper，请求结束后再解除禁用。
//切换商品数量
const changeCartItemCount = async (item: any, count: number) => {
    const res = await addCart({
        basketId: item.basketId,
        prodId: item.prodId,
        skuId: item.skuId,
        shopId: item.shopId,
        count: count,
    })

    const nextCount = item.prodCount + count
    if (nextCount > 0) {
        item.prodCount = nextCount
    } else if (nextCount <= 0) {
        handleDeleteCartItem([item.basketId])
    }
    getTotalPrice()
}
//stepper
const onStepperChange = (item: any, newCount: number) => {
    const delta = newCount - item.prodCount
    changeCartItemCount(item, delta)
}
onMounted(() => {
    loadCart()
})
</script>

<template>
    <div class="cart-page">
        <van-nav-bar title="购物车" />

        <van-cell v-if="defaultAddress" icon="location-o" is-link>
            <template #title>
                {{ defaultAddress.province }}{{ defaultAddress.city }}{{ defaultAddress.area }}{{ defaultAddress.addr }}
            </template>
        </van-cell>

        <van-loading v-if="loading" class="cart-loading" vertical>加载中...</van-loading>

        <template v-else-if="cartList.length">
            <section v-for="shop in cartList" :key="shop.shopId" class="cart-shop">
                <div class="shop-title">
                    <van-checkbox :model-value="true" checked-color="#ee0a24" />
                    <strong>{{ shop.shopName }}</strong>
                </div>

                <template v-for="(discount, index) in shop.shopCartItemDiscounts" :key="index">
                    <div v-for="item in discount.shopCartItems" :key="item.basketId" class="cart-item">
                        <van-checkbox v-model="item.checked" checked-color="#ee0a24" />
                        <van-swipe-cell>
                            <van-card :thumb="item.pic" :title="item.prodName" :desc="item.skuName" :price="item.price">
                                <template #num>
                                    <van-stepper :model-value="item.prodCount"
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

        <van-submit-bar class="cart-submit-bar" :price="totalPrice * 100" button-text="提交订单">
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
    background: #f5f5f5;
}

.cart-loading {
    padding-top: 160px;
}

.cart-shop {
    margin-top: 20px;
    background: #fff;
}

.shop-title {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 28px;
}

.cart-item {
    display: flex;
    align-items: center;
    padding-left: 28px;

    .van-swipe-cell {
        flex: 1;
    }
}

.cart-submit-bar {
    bottom: 100px;

    .clear-button {
        color: #ee0a24;
        font-size: 20px;
        margin-left: 10px;
    }
}

.delete-button {
    height: 100%;
}
</style>
