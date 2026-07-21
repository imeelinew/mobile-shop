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
    <van-tabbar v-model="active" active-color="#1989fa">
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
<style lang="scss" scoped></style>