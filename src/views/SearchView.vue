<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { searchProducts, getHotSearches } from '@/api/search'
import { getSearchSuggestions, type AISource } from '@/ai/searchSuggestions'
import type { SearchProduct } from '@/types/search'

const router = useRouter()
const keyword = ref('')

//搜索功能字段
const products = ref<SearchProduct[]>([])
const loading = ref<boolean>(false)
const hasSearched = ref<boolean>(false)
const HISTORY_KEY = 'search-history'
const hotSearches = ref<string[]>([])

const fallbackHotSearches = [
  'iPhone',
  '运动鞋',
  '兰蔻',
  '阿迪达斯',
  '新鲜水果',
  '蓝牙耳机'
]
//搜索历史字段
const history = ref<string[]>([])
//AI 搜索联想字段
const aiLoading = ref<boolean>(false)
const aiSource = ref<AISource>('fallback')//决定显示AI联想还是本地联想
const aiSuggestions = ref<string[]>([])//AI联想结果
let aiTimer: number | undefined//AI联想定时器

const saveHistory = (word: string) => {
  const oldHistory = history.value.filter((item) => item !== word)
  history.value = [word, ...oldHistory].slice(0, 10)
  console.log('搜索历史', history.value)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
}
const loadHistory = () => {
  const savedHistory = localStorage.getItem(HISTORY_KEY)
  if (savedHistory) {
    history.value = JSON.parse(savedHistory)
  }
}
const removeHistory = (word: string) => {
  history.value = history.value.filter((item) => item !== word)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
}
const clearHistory = () => {
  history.value = []
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
}
//搜索功能
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
    console.log("搜索成功", products.value)
  } catch {
    products.value = []
    console.log("搜索失败")
  } finally {
    loading.value = false
  }
}
const resetSearch = () => {
  keyword.value = ''
  products.value = []
  hasSearched.value = false
  loading.value = false
  window.clearTimeout(aiTimer)
  aiSuggestions.value = []
  aiLoading.value = false
}
//AI联想输入处理 防抖处理
const handleAIInput = (value: string) => {
  window.clearTimeout(aiTimer)
  const word = value.trim()
  if (!word) {
    aiSuggestions.value = []
    aiLoading.value = false
    return
  }
  aiLoading.value = true
  aiSuggestions.value = []
  aiTimer = window.setTimeout(async () => {
    const { result, source } = await getSearchSuggestions(word)
    aiSuggestions.value = result
    aiSource.value = source
    aiLoading.value = false
    console.log('AI联想', aiSuggestions.value, aiSource.value)
  }, 300)
}
const loadHotSearches = async () => {
  try {
    const res = await getHotSearches()

    if (res.data?.length) {
      hotSearches.value = res.data
    } else {
      hotSearches.value = fallbackHotSearches
    }
  } catch {
    hotSearches.value = fallbackHotSearches
  }

  console.log('热门搜索', hotSearches.value)
}
onMounted(() => {
  loadHistory()
  loadHotSearches()
  console.log('搜索历史', history.value)
})
onBeforeUnmount(() => {
  window.clearTimeout(aiTimer)
})
</script>

<template>
  <div class="search-page">
    <van-nav-bar title="搜索" left-text="返回" left-arrow @click-left="router.back()" />

    <van-search v-model="keyword" placeholder="请输入搜索关键词" shape="round" show-action @cancel="resetSearch"
      clearable @search="doSearch" @clear="resetSearch" @update:model-value="handleAIInput" />

    <van-loading v-if="loading" class="search-loading" vertical>搜索中...</van-loading>

    <template v-else-if="hasSearched">
      <div v-if="products.length" class="result-list">
        <van-card v-for="item in products" :key="item.prodId" class="result-card" :title="item.prodName"
          :price="item.price" :thumb="item.pic" />
      </div>
      <van-empty v-else description="暂无搜索结果" />
    </template>

    <div v-else class="search-panels">
      <section class="panel">
        <header class="panel-header">
          <div class="panel-title">
            <van-icon name="clock-o" />
            <h3>搜索历史</h3>
          </div>
          <button v-if="history.length" class="clear-btn" type="button" @click="clearHistory">
            <van-icon name="delete-o" />
            清空
          </button>
        </header>

        <div v-if="history.length" class="tag-list">
          <van-tag v-for="item in history" :key="item" size="large" class="history-item" closeable
            @click="doSearch(item)" @close.stop="removeHistory(item)">
            {{ item }}
          </van-tag>
        </div>
        <van-empty v-else image-size="80" description="暂无搜索历史" />
      </section>

      <section v-if="keyword.trim()" class="panel ai-section">
        <header class="panel-header">
          <div class="panel-title">
            <van-icon name="smile-o" />
            <h3>AI 搜索建议</h3>
            <van-tag :type="aiSource === 'openai' ? 'primary' : 'success'" class="source-tag">
              {{ aiSource === 'openai' ? 'AI' : '本地' }}
            </van-tag>
          </div>
        </header>

        <van-loading v-if="aiLoading" size="20px">
          思考中...
        </van-loading>

        <div v-else-if="aiSuggestions.length" class="tag-list">
          <van-tag v-for="item in aiSuggestions" :key="item" size="large" plain type="success" class="suggestion-item"
            @click="doSearch(item)">
            {{ item }}
          </van-tag>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background: var(--shop-bg);
}

.search-loading {
  padding-top: 120px;
}

.result-list {
  padding: 12px 16px 24px;
}

.result-card {
  margin-bottom: 16px;
  border-radius: var(--shop-radius-sm);
  overflow: hidden;
  background: var(--shop-card);

  :deep(.van-card__price) {
    color: var(--shop-primary);
    font-weight: 700;
  }
}

.search-panels {
  padding: 8px 20px 32px;
}

.panel {
  margin-top: 16px;
  padding: 24px;
  border-radius: var(--shop-radius);
  background: var(--shop-card);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;

  h3 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }

  .van-icon {
    font-size: 28px;
    color: var(--shop-text-secondary);
  }
}

.source-tag {
  margin-left: 4px;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--shop-text-secondary);
  font-size: 24px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.history-item {
  padding: 10px 16px;
  border-radius: 999px;
  background: #f2f3f5;
  color: var(--shop-text);
  border: 1px solid var(--shop-border);
}

.suggestion-item {
  padding: 10px 18px;
  border-radius: 999px;
}
</style>
