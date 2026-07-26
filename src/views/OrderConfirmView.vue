<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { confirmOrder, getAddressList, submitOrder } from '@/api/order'
import { showFailToast, showSuccessToast } from 'vant'
import 'vant/es/toast/style'

const router = useRouter()
const loading = ref(true)
const defaultAddress = ref<any>(null)
const confirmData = ref<any>(null)

const loadOrder = async () => {
    const raw = sessionStorage.getItem('confirmOrder')

    if (!raw) {
        showFailToast('请重新选择商品')
        router.replace('/cart')
        return
    }

    try {
        const orderParams = JSON.parse(raw)
        const [addressRes, orderRes] = await Promise.all([
            getAddressList(),
            confirmOrder(orderParams),
        ])

        const addressList = addressRes.data || []
        defaultAddress.value = addressList.find((item: any) => item.commonAddr === 1)
            || addressList[0]
            || orderRes.data?.userAddr
            || null
        confirmData.value = orderRes.data
    } catch (error) {
        showFailToast('订单信息加载失败')
    } finally {
        loading.value = false
    }
}

const handleSubmitOrder = async () => {
    if (!confirmData.value) return

    try {
        const orderShopParam = confirmData.value.shopCartOrders.map((shop: any) => ({
            shopId: shop.shopId,
            remarks: shop.remarks || '',
        }))
        const res = await submitOrder({ orderShopParam })

        if (res.success) {
            showSuccessToast('订单提交成功')
            sessionStorage.removeItem('confirmOrder')
            router.replace('/mine')
        } else {
            showFailToast(res.msg || '订单提交失败')
        }
    } catch (error) {
        showFailToast('订单提交失败')
    }
}

onMounted(loadOrder)
</script>

<template>
    <div class="order-confirm-page">
        <van-nav-bar title="订单确认页面" left-text="返回" left-arrow @click-left="router.back()" />

        <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>

        <template v-else-if="confirmData">
            <div v-if="defaultAddress" class="address-card">
                <van-icon name="manager" />
                <div>
                    <div>姓名：{{ defaultAddress.receiver }} {{ defaultAddress.mobile }}</div>
                    <div>地址：{{ defaultAddress.province }}{{ defaultAddress.city }}{{ defaultAddress.area }}{{ defaultAddress.addr }}</div>
                </div>
            </div>
            <van-cell v-else title="请先添加收货地址" is-link />

            <section v-for="shop in confirmData.shopCartOrders" :key="shop.shopId" class="shop-order">
                <h3>{{ shop.shopName }}</h3>

                <template v-for="(discount, index) in shop.shopCartItemDiscounts" :key="index">
                    <van-card
                        v-for="item in discount.shopCartItems"
                        :key="item.skuId"
                        :thumb="item.pic"
                        :title="item.prodName"
                        :desc="item.skuName"
                        :price="item.price"
                        :num="item.prodCount"
                    />
                </template>

                <van-field v-model="shop.remarks" label="订单备注" placeholder="请输入备注信息" />
                <van-cell title="优惠券" value="暂无优惠券" is-link />
                <van-cell title="运费" :value="`¥${shop.transfee}`" />
            </section>

            <div class="amount-list">
                <van-cell title="总金额" :value="`¥${confirmData.total}`" />
                <van-cell title="优惠金额" :value="`¥${confirmData.orderReduce}`" />
                <van-cell title="商品总数" :value="confirmData.totalCount" />
                <van-cell title="支付金额" :value="`¥${confirmData.actualTotal}`" />
            </div>

            <van-submit-bar
                :price="confirmData.actualTotal * 100"
                button-text="提交订单"
                @submit="handleSubmitOrder"
            />
        </template>
        <van-empty v-else description="暂无订单信息" />
    </div>
</template>

<style lang="scss" scoped>
.order-confirm-page {
    min-height: 100vh;
    padding-bottom: 100px;
    background: #f5f5f5;
}

.page-loading {
    padding-top: 160px;
}

.address-card {
    display: flex;
    gap: 20px;
    padding: 28px;
    background: #fff;
    font-size: 24px;
    line-height: 1.6;
}

.shop-order,
.amount-list {
    margin-top: 20px;
    background: #fff;
}

.shop-order h3 {
    margin: 0;
    padding: 24px 28px;
    font-size: 28px;
}
</style>
