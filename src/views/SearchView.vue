<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import 'vant/es/toast/style'
import { getHotSearches, searchProducts } from '@/api/search'
import type { HotSearch, SearchProduct } from '@/types/search'

const router = useRouter()
const keyword = ref<string>('')
const products = ref<SearchProduct[]>([])
const hotSearches = ref<HotSearch[]>([])
const history = ref<string[]>([])
const loading = ref(false)
const hasSearched = ref(false)

const HISTORY_KEY = 'shop-search-history'
const fallbackHotSearches: HotSearch[] = [
    'iPhone', '运动鞋', '兰蔻', '阿迪达斯', '新鲜水果', '蓝牙耳机'
].map((title, index) => ({ hotSearchId: index + 1, title, content: title }))

const loadHistory = () => {
    try {
        history.value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    } catch {
        history.value = []
    }
}

const loadHotSearches = async () => {
    try {
        const res = await getHotSearches()
        hotSearches.value = res.data?.length ? res.data : fallbackHotSearches
    } catch {
        hotSearches.value = fallbackHotSearches
    }
}

const saveHistory = (word: string) => {
    history.value = [word, ...history.value.filter(item => item !== word)].slice(0, 10)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
}

const doSearch = async (word = keyword.value) => {
    const value = word.trim()
    if (!value) return

    keyword.value = value
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
    } catch {
        products.value = []
        showToast('搜索失败，请稍后重试')
    } finally {
        loading.value = false
    }
}

const resetSearch = () => {
    keyword.value = ''
    products.value = []
    hasSearched.value = false
}

const clearHistory = () => {
    history.value = []
    localStorage.removeItem(HISTORY_KEY)
}

const removeHistory = (word: string) => {
    history.value = history.value.filter(item => item !== word)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
}

watch(keyword, value => {
    if (!value.trim()) {
        products.value = []
        hasSearched.value = false
    }
})

onMounted(() => {
    loadHistory()
    loadHotSearches()
})

</script>
<template>
  <div class="search-page">
    <van-nav-bar title="搜索" left-text="返回" left-arrow @click-left="router.back()" />

    <van-search
      v-model="keyword"
      placeholder="请输入搜索关键词"
      show-action
      clearable
      @search="doSearch()"
      @cancel="resetSearch"
    />

    <van-loading v-if="loading" class="loading" vertical>搜索中...</van-loading>

    <template v-else-if="hasSearched">
      <div v-if="products.length" class="product-list">
        <van-card
          v-for="item in products"
          :key="item.prodId"
          :price="item.price"
          :desc="`好评率 ${item.positiveRating || 0}% · ${item.prodCommNumber || 0} 条评价`"
          :title="item.prodName"
          :thumb="item.pic"
        />
      </div>

      <van-empty v-else description="暂无搜索结果">
        <van-button type="danger" round @click="resetSearch">重新搜索</van-button>
      </van-empty>
    </template>

    <div v-else class="suggestions">
      <section v-if="history.length" class="search-section">
        <div class="section-title">
          <span>🕘 搜索历史</span>
          <button class="text-button" @click="clearHistory">清空</button>
        </div>
        <div class="tag-list">
          <van-tag
            v-for="item in history"
            :key="item"
            closeable
            size="large"
            @click="doSearch(item)"
            @close.stop="removeHistory(item)"
          >{{ item }}</van-tag>
        </div>
      </section>

      <section class="search-section">
        <div class="section-title">🔥 热门搜索</div>
        <div class="tag-list">
          <van-tag
            v-for="item in hotSearches"
            :key="item.hotSearchId"
            plain
            round
            type="warning"
            size="large"
            @click="doSearch(item.title)"
          >{{ item.title }}</van-tag>
        </div>
      </section>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.loading {
  padding-top: 160px;
}

.suggestions {
  padding: 18px 24px;
}

.search-section {
  margin-bottom: 28px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 28px;
  font-weight: 600;
}

.text-button {
  border: 0;
  color: #969799;
  background: transparent;
  font-size: 24px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 18px;
}

.product-list :deep(.van-card) {
  margin-top: 0;
  background: #fff;
}

:deep(.van-empty__bottom) {
  margin-top: 32px;
}
</style>
