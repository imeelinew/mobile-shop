<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { confirmReceipt, getMyOrderInfo, payOrder } from '@/api/order'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import 'vant/es/dialog/style'
import 'vant/es/toast/style'

type OrderTabState = {
    current: number
    load: boolean
    finished: boolean
    list: any[]
}

type OrderTab = {
    title: string
    status: number
    state: OrderTabState
}

const route = useRoute()
const router = useRouter()

const createState = (): OrderTabState => ({
    current: 0,
    load: false,
    finished: false,
    list: [],
})

const tabs = ref<OrderTab[]>([
    { title: '待付款', status: 1, state: createState() },
    { title: '待发货', status: 2, state: createState() },
    { title: '待收货', status: 3, state: createState() },
    { title: '已完成', status: 5, state: createState() },
])

const routeActive = Number(route.query.active)
const active = ref(Number.isInteger(routeActive) && routeActive >= 0 && routeActive < tabs.value.length
    ? routeActive
    : 0)

const resetTab = (tab: OrderTab) => {
    tab.state.current = 0
    tab.state.load = false
    tab.state.finished = false
    tab.state.list = []
}

const loadData = async (tab: OrderTab) => {
    if (tab.state.load || tab.state.finished) return

    tab.state.load = true
    const current = tab.state.current + 1
    tab.state.current = current

    try {
        const res = await getMyOrderInfo({
            status: tab.status,
            current,
            size: 10,
        })
        const data = Array.isArray(res.data) ? { records: res.data } : (res.data || {})
        const records = Array.isArray(data.records) ? data.records : []
        const pages = Number(data.pages)
        const responseCurrent = Number(data.current) || current

        tab.state.list = current === 1 ? records : [...tab.state.list, ...records]
        tab.state.finished = records.length === 0
            || (pages > 0 && responseCurrent >= pages)
            || (pages === 0 && records.length < 10)
    } catch (error) {
        tab.state.current = current - 1
        showFailToast('订单列表加载失败')
    } finally {
        tab.state.load = false
    }
}

const handleTabChange = (event?: { name?: number | string } | number) => {
    const index = typeof event === 'number'
        ? event
        : event?.name !== undefined
            ? Number(event.name)
            : active.value
    const tab = tabs.value[index]

    if (!tab) return Promise.resolve()

    resetTab(tab)
    return loadData(tab)
}

const refreshTab = async (index = active.value) => {
    await handleTabChange(index)
}

const getOrderNumber = (order: any) => order.orderNumbers || order.orderNumber

const handlePay = async (order: any) => {
    const orderNumbers = getOrderNumber(order)

    if (!orderNumbers) {
        showFailToast('订单号不存在')
        return
    }

    try {
        await showConfirmDialog({
            title: '确认付款',
            message: '确认支付该订单吗？',
        })
    } catch (error) {
        return
    }

    try {
        const res = await payOrder({
            orderNumbers: String(orderNumbers),
            payType: 1,
        })

        if (!res.success) {
            showFailToast(res.msg || '支付失败，请稍后重试')
            return
        }

        showSuccessToast('当前订单支付成功')
        await refreshTab()
    } catch (error) {
        showFailToast('支付失败，请稍后重试')
    }
}

const handleReceipt = async (order: any) => {
    const orderNumber = getOrderNumber(order)

    if (!orderNumber) {
        showFailToast('订单号不存在')
        return
    }

    try {
        await showConfirmDialog({
            title: '确认收货',
            message: '确认已经收到商品吗？',
        })
    } catch (error) {
        return
    }

    try {
        const res = await confirmReceipt(String(orderNumber))

        if (!res.success) {
            showFailToast(res.msg || '确认收货失败')
            return
        }

        showSuccessToast('确认收货成功')
        await refreshTab()
    } catch (error) {
        showFailToast('确认收货失败')
    }
}

const formatMoney = (value: unknown) => {
    const amount = Number(value)
    return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

const getItemCount = (order: any) => {
    if (order.productNums !== undefined) return order.productNums
    return getOrderItems(order).reduce((total, item) => total + Number(item.prodCount || 0), 0)
}

const getOrderItems = (order: any) => Array.isArray(order.orderItemDtos) ? order.orderItemDtos : []

onMounted(() => {
    loadData(tabs.value[active.value])
})
</script>

<template>
    <div class="my-order-page">
        <van-nav-bar title="订单列表" left-text="返回" left-arrow @click-left="router.back()" />

        <van-tabs v-model:active="active" sticky @click-tab="handleTabChange">
            <van-tab v-for="(tab, index) in tabs" :key="tab.status" :name="index" :title="tab.title">
                <van-empty v-if="tab.state.finished && !tab.state.list.length" description="暂无订单" />

                <van-list
                    v-else
                    v-model:loading="tab.state.load"
                    :finished="tab.state.finished"
                    finished-text="没有更多了"
                    @load="loadData(tab)"
                >
                    <article v-for="order in tab.state.list" :key="order.orderNumber" class="order-card">
                        <div class="shop-line">
                            <span>{{ order.shopName || '商城小店' }}</span>
                            <span class="order-status">{{ tab.title }}</span>
                        </div>

                        <div
                            v-for="(item, itemIndex) in getOrderItems(order)"
                            :key="`${order.orderNumber}-${item.skuId || itemIndex}`"
                            class="order-item"
                        >
                            <van-image class="item-image" fit="cover" :src="item.pic" />
                            <div class="item-info">
                                <div class="item-title">{{ item.prodName }}</div>
                                <div class="item-desc">{{ item.skuName || item.properties }}</div>
                                <div class="item-bottom">
                                    <strong>¥{{ formatMoney(item.price) }}</strong>
                                    <span>x{{ item.prodCount }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="order-line">
                            <span>订单号</span>
                            <span>{{ order.orderNumber }}</span>
                        </div>
                        <div class="order-line total-line">
                            <span>共{{ getItemCount(order) }}件商品</span>
                            <span>合计 ¥{{ formatMoney(order.actualTotal) }}</span>
                        </div>

                        <div v-if="tab.status === 1 || tab.status === 3" class="order-actions">
                            <van-button v-if="tab.status === 1" size="small" type="danger" @click.stop="handlePay(order)">
                                确认付款
                            </van-button>
                            <van-button v-else size="small" type="danger" @click.stop="handleReceipt(order)">
                                确认收货
                            </van-button>
                        </div>
                    </article>
                </van-list>
            </van-tab>
        </van-tabs>
    </div>
</template>

<style lang="scss" scoped>
.my-order-page {
    min-height: 100vh;
    background: var(--shop-bg);
}

.order-card {
    margin: 16px 20px 0;
    overflow: hidden;
    border-radius: var(--shop-radius);
    background: var(--shop-card);
}

.shop-line,
.order-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    color: var(--shop-text-secondary);
    font-size: 24px;
}

.shop-line {
    color: var(--shop-text);
    font-weight: 600;
}

.order-status {
    color: var(--shop-primary);
    font-weight: 400;
}

.order-item {
    display: flex;
    gap: 20px;
    margin: 0 12px;
    padding: 16px 12px;
    background: #f7f8fa;
}

.item-image {
    flex: 0 0 150px;
    width: 150px;
    height: 150px;
    overflow: hidden;
    border-radius: var(--shop-radius-sm);
    background: #fff;
}

.item-info {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
}

.item-title {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    color: var(--shop-text);
    font-size: 24px;
    line-height: 1.4;
}

.item-desc {
    overflow: hidden;
    margin-top: 6px;
    color: var(--shop-text-secondary);
    font-size: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    color: var(--shop-text-secondary);
    font-size: 22px;

    strong {
        color: var(--shop-text);
        font-size: 28px;
    }
}

.total-line {
    border-top: 1px solid var(--shop-border);
    color: var(--shop-text);
}

.order-actions {
    display: flex;
    justify-content: flex-end;
    padding: 0 24px 20px;
}

.order-actions :deep(.van-button) {
    min-width: 150px;
}

.my-order-page :deep(.van-tabs__wrap) {
    box-shadow: 0 1px 0 var(--shop-border);
}

.my-order-page :deep(.van-tab) {
    font-size: 26px;
}

.my-order-page :deep(.van-empty) {
    padding-top: 160px;
}
</style>
