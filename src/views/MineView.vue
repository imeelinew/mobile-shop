<script lang="ts" setup></script>
<template>
    <div class="mine-page">
        <div class="profile">
            <van-image round width="100px" height="100px" fit="cover"
                src="https://img.yzcdn.cn/vant/cat.jpeg"></van-image>
            <div class="username">张三</div>
        </div>
        <van-divider />
        <div class="orders">
            <div class="orders-left">
                <span>我的订单</span>
            </div>
            <div class="orders-right">
                <span>查看全部</span>
            </div>
        </div>
        <van-divider />
        <div class="info">
            <van-grid>
                <van-grid-item icon="balance-pay" text="待支付" />
                <van-grid-item icon="logistics" text="待发货" />
                <van-grid-item icon="description" text="待签收" />
                <van-grid-item icon="passed" text="已完成" />
            </van-grid>

        </div>
        <div class="settings"></div>
    </div>
</template>
<style lang="scss" scoped>
.mine-page {
    .profile {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;

        .username {
            font-size: 32px;
            margin-top: 20px;
        }
    }

    .orders {
        display: flex;
        justify-content: space-between;
        flex-direction: row;
        padding: 0px 32px;

        .orders-left {
            font-size: 32px;
            font-weight: bold;
        }

        .orders-right {
            font-size: 28px;
            color: #999;
        }
    }
}
</style>
