<template>
    <van-tabbar route active-color="#ee0a24" inactive-color="#646566" safe-area-inset-bottom>
        <van-tabbar-item to="/home" icon="home-o">
            首页
        </van-tabbar-item>

        <van-tabbar-item to="/category" icon="apps-o">
            分类
        </van-tabbar-item>

        <van-tabbar-item to="/cart" icon="cart-o">
            购物车
        </van-tabbar-item>

        <van-tabbar-item to="/mine" icon="user-o">
            我的
        </van-tabbar-item>
    </van-tabbar>
</template>
<style lang="scss" scoped>
:deep(.van-tabbar) {
    border-top: 1px solid var(--shop-border);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04);
}

:deep(.van-tabbar-item__text) {
    font-size: 20px;
}
</style>
