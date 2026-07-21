<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const keyword = ref<string>('')

</script>
<template>
    <van-nav-bar title="搜索" left-text="返回" left-arrow @click-left="router.back()" />

    <van-search v-model="keyword" placeholder="请输入商品名称" />
</template>
<style lang="scss" scoped></style>