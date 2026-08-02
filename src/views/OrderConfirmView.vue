<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { confirmOrder, getAddressList, payOrder, submitOrder } from '@/api/order'
import { showConfirmDialog, showFailToast, showSuccessToast, showToast } from 'vant'
import 'vant/es/dialog/style'
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
        const addressRes = await getAddressList()
        const addressList = addressRes.data || []
        defaultAddress.value = addressList.find((item: any) => Number(item.commonAddr) === 1)
            || addressList[0]
            || null

        // 换地址后用最新默认地址重新确认订单
        if (defaultAddress.value?.addrId) {
            orderParams.addrId = defaultAddress.value.addrId
            sessionStorage.setItem('confirmOrder', JSON.stringify(orderParams))
        }

        const orderRes = await confirmOrder(orderParams)
        if (!defaultAddress.value) {
            defaultAddress.value = orderRes.data?.userAddr || null
        }
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
        const orderShopParams = confirmData.value.shopCartOrders.map((shop: any) => ({
            shopId: shop.shopId,
            remarks: shop.remarks || '',
        }))
        const res = await submitOrder({ orderShopParams })

        if (res.success) {
            const orderNumbers = res.data?.orderNumbers || res.data?.orderNumber

            if (!orderNumbers) {
                showFailToast('订单提交成功，但未获取到支付流水号')
                return
            }

            sessionStorage.removeItem('confirmOrder')

            try {
                await showConfirmDialog({
                    title: '确认支付',
                    message: '确认支付该订单吗？',
                })
            } catch (error) {
                showToast('当前订单已到待支付，请及时处理')
                router.replace('/mine')
                return
            }

            let payRes
            try {
                payRes = await payOrder({
                    orderNumbers: String(orderNumbers),
                    payType: 1,
                })
            } catch (error) {
                showFailToast('支付失败，请稍后重试')
                return
            }

            if (!payRes.success) {
                showFailToast(payRes.msg || '支付失败，请稍后重试')
                return
            }

            showSuccessToast('当前订单支付成功')
            router.replace('/mine')
        } else {
            showFailToast(res.msg || '订单提交失败')
        }
    } catch (error) {
        showFailToast('订单提交失败')
    }
}

onMounted(() => {
    loadOrder()
})
</script>

<template>
    <div class="order-confirm-page">
        <van-nav-bar title="订单确认页面" left-text="返回" left-arrow @click-left="router.back()" />

        <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>

        <template v-else-if="confirmData">
            <div v-if="defaultAddress" class="address-card" @click="router.push('/address')">
                <van-icon name="manager" class="address-icon" />
                <div class="address-info">
                    <div class="address-name">姓名：{{ defaultAddress.receiver }} {{ defaultAddress.mobile }}</div>
                    <div class="address-detail">地址：{{ defaultAddress.province }}{{ defaultAddress.city }}{{ defaultAddress.area }}{{ defaultAddress.addr }}</div>
                </div>
                <van-icon name="arrow" class="address-arrow" />
            </div>
            <van-cell v-else class="address-empty" title="请先添加收货地址" is-link @click="router.push('/address')" />

            <section v-for="shop in confirmData.shopCartOrders" :key="shop.shopId" class="shop-order">
                <h3>{{ shop.shopName }}</h3>

                <template v-for="(discount, index) in shop.shopCartItemDiscounts" :key="index">
                    <van-card
                        v-for="item in discount.shopCartItems"
                        :key="item.skuId"
                        class="order-card"
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
                <van-cell title="支付金额" class="pay-cell" :value="`¥${confirmData.actualTotal}`" />
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
    padding-bottom: 120px;
    background: var(--shop-bg);
}

.page-loading {
    padding-top: 160px;
}

.address-card {
    display: flex;
    align-items: center;
    gap: 20px;
    margin: 16px 20px 0;
    padding: 28px 24px;
    border-radius: var(--shop-radius) var(--shop-radius) 0 0;
    background: var(--shop-card);
    font-size: 24px;
    line-height: 1.6;
    position: relative;
    cursor: pointer;

    &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 4px;
        background: repeating-linear-gradient(
            90deg,
            #1989fa 0 12px,
            transparent 12px 18px,
            #ff976a 18px 30px,
            transparent 30px 36px
        );
    }
}

.address-icon {
    flex-shrink: 0;
    font-size: 40px;
    color: var(--shop-primary);
}

.address-info {
    flex: 1;
    min-width: 0;
}

.address-name {
    font-weight: 600;
    font-size: 26px;
}

.address-detail {
    margin-top: 8px;
    color: var(--shop-text-secondary);
}

.address-arrow {
    color: var(--shop-text-secondary);
}

.address-empty {
    margin: 16px 20px 0;
    border-radius: var(--shop-radius);
    overflow: hidden;
}

.shop-order,
.amount-list {
    margin: 16px 20px 0;
    overflow: hidden;
    border-radius: var(--shop-radius);
    background: var(--shop-card);
}

.shop-order h3 {
    margin: 0;
    padding: 24px 28px 12px;
    font-size: 30px;
    font-weight: 700;
}

.order-card {
    background: transparent;

    :deep(.van-card__thumb) {
        border-radius: var(--shop-radius-sm);
        overflow: hidden;
    }

    :deep(.van-card__price) {
        color: var(--shop-text);
        font-weight: 700;
    }
}

.amount-list {
    :deep(.van-cell) {
        padding: 22px 28px;
        color: var(--shop-text-secondary);
    }

    .pay-cell {
        :deep(.van-cell__value) {
            color: var(--shop-primary);
            font-weight: 700;
        }
    }
}
</style>
