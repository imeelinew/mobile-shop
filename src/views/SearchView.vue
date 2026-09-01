<script lang="ts" setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { searchProducts, getHotSearches } from '@/api/search'
import { getSearchSuggestions, type AISource } from '@/ai/searchSuggestions'
import type { SearchProduct } from '@/types/search'
import ContentSkeleton from '@/components/ContentSkeleton.vue'

const router = useRouter()
const keyword = ref('')

//搜索功能字段
const products = ref<SearchProduct[]>([])
const loading = ref<boolean>(false)
const hasSearched = ref<boolean>(false)
const HISTORY_KEY = 'search-history'
const hotSearches = ref<string[]>([])
const hotLoading = ref(true)

const fallbackHotSearches = [
  'iPhone',
  '运动鞋',
  '兰蔻',
  '阿迪达斯',
  '新鲜水果',
  '蓝牙耳机'
]
const SUGGESTION_DEBOUNCE_DELAY = 300
//搜索历史字段
const history = ref<string[]>([])
//AI 搜索联想字段
const aiLoading = ref<boolean>(false)
const aiSource = ref<AISource>('fallback')//决定显示AI联想还是本地联想
const aiSuggestions = ref<string[]>([])//AI联想结果
let suggestionTimer: number | undefined
let suggestionController: AbortController | undefined
let suggestionRequestId = 0

// 同时停止等待中的定时器和已经发出的旧请求
const stopSuggestionRequest = () => {
  window.clearTimeout(suggestionTimer)
  suggestionController?.abort()
  suggestionController = undefined
  suggestionRequestId += 1
}

// 有 AI 建议或思考中时隐藏热搜（课上约定）
const showHotSearches = computed(() => {
  return hotSearches.value.length > 0
    && !aiLoading.value
    && aiSuggestions.value.length === 0
})

const aiLabel = computed(() => {
  if (aiLoading.value) return '思考中'
  return aiSource.value === 'openai' ? 'AI' : '本地'
})

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
  stopSuggestionRequest()
  aiSuggestions.value = []
  aiLoading.value = false

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
  stopSuggestionRequest()
  aiSuggestions.value = []
  aiLoading.value = false
}
//AI联想输入处理 防抖处理
const handleSuggestionInput = (value: string) => {
  stopSuggestionRequest()
  const keyword = value.trim()
  if (!keyword) {
    aiSuggestions.value = []
    aiLoading.value = false
    return
  }
  aiLoading.value = true
  aiSuggestions.value = []
  const requestId = suggestionRequestId

  suggestionTimer = window.setTimeout(async () => {
    const controller = new AbortController()
    suggestionController = controller

    try {
      const { result, source } = await getSearchSuggestions(keyword, controller.signal)

      // 只允许最后一次输入更新页面，避免旧结果覆盖新结果
      if (requestId !== suggestionRequestId) return
      aiSuggestions.value = result
      aiSource.value = source
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        aiSuggestions.value = []
      }
    } finally {
      if (requestId === suggestionRequestId) {
        aiLoading.value = false
        suggestionController = undefined
      }
    }
  }, SUGGESTION_DEBOUNCE_DELAY)
}
const loadHotSearches = async () => {
  try {
    const res = await getHotSearches()

    if (res.data?.length) {
      hotSearches.value = res.data.map((item: any) =>
        typeof item === 'string' ? item : (item.title || item.content)
      ).filter(Boolean)
    } else {
      hotSearches.value = fallbackHotSearches
    }
  } catch {
    hotSearches.value = fallbackHotSearches
  } finally {
    hotLoading.value = false
  }

  console.log('热门搜索', hotSearches.value)
}

const goDetail = (prodId: number) => {
  router.push({
    path: '/product-detail',
    query: { prodId }
  })
}
onMounted(() => {
  loadHistory()
  loadHotSearches()
  console.log('搜索历史', history.value)
})
onBeforeUnmount(() => {
  stopSuggestionRequest()
})
</script>

<template>
  <div class="search-page">
    <van-nav-bar title="搜索" left-text="返回" left-arrow @click-left="router.back()" />

    <van-search v-model="keyword" placeholder="请输入搜索关键词" shape="round" show-action @cancel="resetSearch"
      clearable @search="doSearch" @clear="resetSearch" @update:model-value="handleSuggestionInput" />

    <ContentSkeleton v-if="loading" variant="list" :rows="4" />

    <template v-else-if="hasSearched">
      <van-list
        v-if="products.length"
        class="result-list"
        :finished="true"
        finished-text="没有更多了"
      >
        <van-card
          v-for="item in products"
          :key="item.prodId"
          class="result-card"
          :title="item.prodName"
          :price="item.price"
          :thumb="item.pic"
          @click="goDetail(item.prodId)"
        />
      </van-list>
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

      <section v-if="hotLoading" class="panel">
        <ContentSkeleton variant="lines" :rows="3" compact />
      </section>

      <section v-if="showHotSearches" class="panel">
        <header class="panel-header">
          <div class="panel-title">
            <van-icon name="fire-o" />
            <h3>热门搜索</h3>
          </div>
        </header>
        <div class="tag-list">
          <van-tag
            v-for="item in hotSearches"
            :key="item"
            size="large"
            plain
            type="danger"
            class="suggestion-item"
            @click="doSearch(item)"
          >
            {{ item }}
          </van-tag>
        </div>
      </section>

      <section v-if="keyword.trim()" class="panel ai-section">
        <header class="panel-header">
          <div class="panel-title">
            <van-icon name="smile-o" />
            <h3>AI 搜索建议</h3>
            <van-tag
              :type="aiLoading ? 'warning' : (aiSource === 'openai' ? 'primary' : 'success')"
              class="source-tag"
            >
              {{ aiLabel }}
            </van-tag>
          </div>
        </header>

        <div v-if="aiLoading" class="ai-skeleton">
          <span v-for="n in 5" :key="n" class="skeleton-block" />
        </div>

        <div v-else-if="aiSuggestions.length" class="tag-list">
          <van-tag
            v-for="item in aiSuggestions"
            :key="item"
            size="large"
            plain
            :type="aiSource === 'openai' ? 'primary' : 'success'"
            class="suggestion-item"
            :class="{ 'ai-tag': aiSource === 'openai' }"
            @click="doSearch(item)"
          >
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
  cursor: pointer;

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

.ai-tag {
  color: #7232dd;
  border-color: #7232dd;
}

.ai-skeleton {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.skeleton-block {
  display: inline-block;
  width: 140px;
  height: 52px;
  border-radius: 999px;
  background: linear-gradient(90deg, #f2f3f5 25%, #e8e8e8 37%, #f2f3f5 63%);
  background-size: 400% 100%;
  animation: skeleton-shine 1.4s ease infinite;
}

@keyframes skeleton-shine {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
