<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderCount } from '@/api/order'
import { getCurrentUser, type CurrentUser } from '@/api/userInfo'
import { removeToken } from '@/utils/token'
import ContentSkeleton from '@/components/ContentSkeleton.vue'

const router = useRouter()
const orderCount = ref<any>({})
const loading = ref(true)
const currentUser = ref<CurrentUser | null>(null)

onMounted(async () => {
    try {
        const [userResult, countResult] = await Promise.allSettled([
            getCurrentUser(),
            getOrderCount(),
        ])
        if (userResult.status === 'fulfilled' && userResult.value.success) {
            currentUser.value = userResult.value.data
        }
        if (countResult.status === 'fulfilled') {
            orderCount.value = countResult.value.data || {}
        }
    } finally {
        loading.value = false
    }
})

const logout = () => {
    removeToken()
    router.replace('/login')
}

const openOrders = (active = 0) => {
    router.push({
        path: '/my-order',
        query: { active: String(active) },
    })
}

const openAdminOrders = () => {
    router.push('/admin/orders')
}
</script>
<template>
    <div class="mine-page">
        <ContentSkeleton v-if="loading" variant="profile" />
        <template v-else>
        <div class="profile">
            <div class="avatar" aria-hidden="true">{{ currentUser?.username?.slice(0, 1).toUpperCase() || '我' }}</div>
            <div class="username">{{ currentUser?.username || '当前用户' }}</div>
            <span v-if="currentUser?.role === 'admin'" class="role-badge">管理员</span>
        </div>

        <div class="orders-card">
            <div class="orders" @click="openOrders()">
                <div class="orders-left">
                    <span>我的订单</span>
                </div>
                <div class="orders-right">
                    <span>查看全部</span>
                    <van-icon name="arrow" />
                </div>
            </div>
            <div class="info">
                <van-grid :border="false" :column-num="4">
                    <van-grid-item icon="balance-pay" text="待支付" :badge="orderCount.unPay" @click="openOrders(0)" />
                    <van-grid-item icon="logistics" text="待发货" :badge="orderCount.payed" @click="openOrders(1)" />
                    <van-grid-item icon="description" text="待签收" :badge="orderCount.consignment" @click="openOrders(2)" />
                    <van-grid-item icon="passed" text="已完成" :badge="orderCount.success" @click="openOrders(3)" />
                </van-grid>
            </div>
            <van-cell class="cancelled-orders" title="已取消订单" icon="cross" is-link
                :value="`${orderCount.canceled || 0} 笔`" @click="openOrders(4)" />
        </div>

        <van-grid :column-num="3" :border="false" class="stats">
            <van-grid-item>
                <div class="stat-item">
                    <strong>2</strong>
                    <span>我的收藏</span>
                </div>
            </van-grid-item>
            <van-grid-item>
                <div class="stat-item">
                    <strong>2</strong>
                    <span>我的消息</span>
                </div>
            </van-grid-item>
            <van-grid-item>
                <div class="stat-item">
                    <strong>2</strong>
                    <span>我的足迹</span>
                </div>
            </van-grid-item>
        </van-grid>

        <div class="settings">
            <van-cell-group inset>
                <van-cell title="分销中心" icon="cart-o" is-link />
                <van-cell title="领券中心" icon="coupon-o" is-link />
                <van-cell title="我的优惠券" icon="bookmark-o" is-link />
                <van-cell title="智能客服" icon="service-o" is-link />
                <van-cell title="收货地址" icon="location-o" is-link @click="router.push('/address')" />
                <van-cell v-if="currentUser?.role === 'admin'" title="管理员发货" icon="logistics"
                    is-link @click="openAdminOrders" />
            </van-cell-group>
        </div>

        <div class="logout">
            <van-button round block type="danger" @click="logout">退出登录</van-button>
        </div>
        </template>
    </div>
</template>
<style lang="scss" scoped>
.mine-page {
    min-height: 100vh;
    padding-bottom: 32px;
    background: var(--shop-bg);

    .profile {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 56px 40px 40px;
        background: linear-gradient(180deg, #fff1f0 0%, #ffffff 100%);

        .avatar {
            width: 100px;
            height: 100px;
            display: grid;
            place-items: center;
            border: 6px solid #fff;
            border-radius: 50%;
            background: var(--shop-primary-soft);
            box-shadow: 0 8px 24px rgba(238, 10, 36, 0.12);
            color: var(--shop-primary);
            font-size: 42px;
            font-weight: 700;
        }

        .username {
            margin-top: 20px;
            font-size: 34px;
            font-weight: 700;
        }

        .role-badge {
            margin-top: 10px;
            padding: 5px 14px;
            border-radius: 999px;
            background: var(--shop-primary-soft);
            color: var(--shop-primary);
            font-size: 20px;
        }
    }

    .orders-card {
        margin: 16px 20px 0;
        overflow: hidden;
        border-radius: var(--shop-radius);
        background: var(--shop-card);
    }

    .orders {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 28px 28px 12px;

        .orders-left {
            font-size: 30px;
            font-weight: 700;
        }

        .orders-right {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 24px;
            color: var(--shop-text-secondary);
        }
    }

    .info {
        :deep(.van-grid-item__icon) {
            font-size: 44px;
            color: var(--shop-primary);
        }

        :deep(.van-grid-item__text) {
            font-size: 22px;
        }
    }

    .cancelled-orders {
        border-top: 1px solid var(--shop-border);
        color: var(--shop-text-secondary);

        :deep(.van-cell__left-icon) {
            color: var(--shop-primary);
        }
    }

    .stats {
        margin: 16px 20px 0;
        overflow: hidden;
        border-radius: var(--shop-radius);
        background: var(--shop-card);
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        font-size: 24px;
        color: var(--shop-text-secondary);

        strong {
            font-size: 36px;
            font-weight: 700;
            color: var(--shop-text);
        }
    }

    .settings {
        margin-top: 16px;

        :deep(.van-cell-group--inset) {
            margin: 0 20px;
            border-radius: var(--shop-radius);
            overflow: hidden;
        }

        :deep(.van-cell__left-icon) {
            color: var(--shop-primary);
        }
    }

    .logout {
        padding: 40px 40px 0;
    }
}
</style>
