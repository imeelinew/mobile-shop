<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderCount } from '@/api/order'
import { removeToken } from '@/utils/token'

const router = useRouter()
const orderCount = ref<any>({})

onMounted(async () => {
    const res = await getOrderCount()
    orderCount.value = res.data
})

const logout = () => {
    removeToken()
    router.replace('/login')
}
</script>
<template>
    <div class="mine-page">
        <div class="profile">
            <van-image round width="100px" height="100px" fit="cover"
                src="https://img.yzcdn.cn/vant/cat.jpeg"></van-image>
            <div class="username">张三</div>
        </div>
        <van-divider class="section-divider" />
        <div class="orders">
            <div class="orders-left">
                <span>我的订单</span>
            </div>
            <div class="orders-right">
                <span>查看全部</span>
            </div>
        </div>
        <van-divider class="section-divider" />
        <div class="info">
            <van-grid :border="false">
                <van-grid-item icon="balance-pay" text="待支付" :badge="orderCount.unPay" />
                <van-grid-item icon="logistics" text="待发货" :badge="orderCount.payed" />
                <van-grid-item icon="description" text="待签收" :badge="orderCount.consignment" />
                <van-grid-item icon="passed" text="已完成" :badge="orderCount.success" />
            </van-grid>
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
            <van-cell-group>
                <van-cell title="分销中心" icon="cart-o" is-link />
                <van-cell title="领券中心" icon="coupon-o" is-link />
                <van-cell title="我的优惠券" icon="bookmark-o" is-link />
                <van-cell title="智能客服" icon="service-o" is-link />
                <van-cell title="收货地址" icon="location-o" is-link />
            </van-cell-group>
        </div>

        <div class="logout">
            <van-button type="danger" @click="logout">退出登录</van-button>
        </div>
    </div>
</template>
<style lang="scss" scoped>
.mine-page {
    min-height: 100vh;
    background: #f5f5f5;

    .section-divider {
        margin: 0;
    }

    .profile {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        background: #fff;

        .username {
            font-size: 32px;
            margin-top: 20px;
        }
    }

    .orders {
        display: flex;
        justify-content: space-between;
        flex-direction: row;
        align-items: center;
        padding: 24px 32px;
        background: #fff;

        .orders-left {
            font-size: 32px;
            font-weight: bold;
        }

        .orders-right {
            font-size: 28px;
            color: #999;
        }
    }

    .stats {
        margin-top: 24px;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: center;
        font-size: 28px;

        strong {
            font-size: 32px;
            font-weight: 400;
        }
    }

    .settings {
        margin-top: 24px;
    }

    .logout {
        padding: 32px 0;
        text-align: center;
    }
}
</style>
