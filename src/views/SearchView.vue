<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { searchProducts } from '@/api/search'
import type { SearchProduct } from '@/types/search'

const router = useRouter()
const keyword = ref('')

//搜索功能字段
const products = ref<SearchProduct[]>([])
const loading = ref<boolean>(false)
const hasSearched = ref<boolean>(false)
//搜索历史字段
const history = ref<string[]>([])
const saveHistory = (word: string) => {
  const oldHistory = history.value.filter((item) => item !== word)
  history.value = [word, ...oldHistory]
  console.log('搜索历史', history.value)

}
//搜索功能
const doSearch = async (word = keyword.value) => {
  const value = word.trim()
  if (!value) return

  loading.value = true
  hasSearched.value = true

  try {
    const res = await searchProducts({
      prodName: value,
      shopId: 1,
      sort: 0,
      orderBy: 0,
      current: 1,
      size: 10
    })
    products.value = res.data?.records || []
    saveHistory(value)
    console.log("搜索成功", products.value)
  } catch {
    products.value = []
    console.log("搜索失败")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="search-page">
    <van-nav-bar title="搜索" left-text="返回" left-arrow @click-left="router.back()" />

    <van-search v-model="keyword" placeholder="请输入搜索关键词" show-action clearable @search="doSearch" />
    <van-loading v-if="loading">搜索中...</van-loading>
    <template v-else-if="hasSearched">
      <div v-if="products.length">
        <van-card v-for="item in products" :key="item.prodId" :title="item.prodName" :price="item.price"
          :thumb="item.pic">
        </van-card>
      </div>
      <van-empty v-else description="暂无搜索结果" />
    </template>

  </div>
</template>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background: #f7f8fa;
}
</style>
