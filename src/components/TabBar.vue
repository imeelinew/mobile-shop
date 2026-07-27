<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(0)

const tabMap = {
    '/home': 0,
    '/category': 1,
    '/cart': 2,
    '/mine': 3,
}
watch(
    () => route.path,
    (path) => {
        active.value = tabMap[path] ?? 0
    },
    {
        immediate: true,
    }
)
</script>
<template>
    <van-tabbar v-model="active" active-color="#ee0a24" inactive-color="#646566" safe-area-inset-bottom>
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
