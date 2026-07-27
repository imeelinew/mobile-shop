<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { getCartInfo } from '@/api/cart'
import { getAddressList } from '@/api/order'

const loading = ref(true)
const cartList = ref<any[]>([])
const defaultAddress = ref<any>(null)

const totalPrice = computed(() => {
    let total = 0

    cartList.value.forEach((shop) => {
        shop.shopCartItemDiscounts?.forEach((discount: any) => {
            discount.shopCartItems?.forEach((item: any) => {
                total += item.price * item.prodCount
            })
        })
    })

    return total
})

const loadCart = async () => {
    try {
        const [cartRes, addressRes] = await Promise.all([
            getCartInfo(),
            getAddressList(),
        ])
        console.log(cartRes.data,'cartRes.data')
        console.log(addressRes.data,'addressRes.data')
        cartList.value = cartRes.data || []

        const addressList = addressRes.data || []
        defaultAddress.value = addressList.find((item: any) => item.commonAddr === 1)
            || addressList[0]
            || null
    } finally {
        loading.value = false
    }
}

onMounted(loadCart)
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
                        <van-checkbox :model-value="true" checked-color="#ee0a24" />
                        <van-card
                            :thumb="item.pic"
                            :title="item.prodName"
                            :desc="item.skuName"
                            :price="item.price"
                            :num="item.prodCount"
                        />
                    </div>
                </template>
            </section>
        </template>

        <van-empty v-else description="购物车还是空的" />

        <van-submit-bar
            class="cart-submit-bar"
            :price="totalPrice * 100"
            button-text="提交订单"
        >
            <van-checkbox :model-value="true" checked-color="#ee0a24">全选</van-checkbox>
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

    .van-card {
        flex: 1;
    }
}

.cart-submit-bar {
    bottom: 100px;
}
</style>
