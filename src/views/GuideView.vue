<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showToast } from 'vant'
import 'vant/es/toast/style'
import { getGuideRecommendations } from '@/api/guide'
import type { GuideResult } from '@/types/guide'

const router = useRouter()
const query = ref('')
const loading = ref(false)
const result = ref<GuideResult | null>(null)

const examples = [
  { icon: 'service-o', text: '800 元以内，想买通勤用的降噪耳机，续航要好' },
  { icon: 'fire-o', text: '想买双透气、防滑的跑鞋，预算 600 元' },
  { icon: 'flower-o', text: '敏感肌换季干燥，300 元内怎么选' },
]

const submit = async (text = query.value) => {
  const value = text.trim()
  if (value.length < 2) {
    showToast('告诉我预算、用途或偏好就可以')
    return
  }
  query.value = value
  loading.value = true
  result.value = null
  try {
    const response = await getGuideRecommendations(value)
    if (!response.success) throw new Error(response.msg || '挑选失败')
    result.value = response.data
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '轻购AI暂时开小差了')
  } finally {
    loading.value = false
  }
}

const goDetail = (prodId: number) => router.push({ path: '/product-detail', query: { prodId } })
</script>

<template>
  <div class="guide-page">
    <van-nav-bar title="轻购AI" left-text="返回" left-arrow @click-left="router.back()" />

    <section class="guide-hero">
      <h1>想买什么，问轻购AI</h1>
      <p>把预算和需求告诉我，少做功课，更快买对。</p>

      <div class="compose-card">
        <van-field
          v-model="query"
          class="guide-input"
          type="textarea"
          rows="3"
          maxlength="200"
          autosize
          placeholder="比如：800 元以内，想买通勤用的降噪耳机，续航要好"
          @keydown.enter.exact.prevent="submit()"
        />
        <van-button block type="danger" :loading="loading" loading-text="正在挑选…" @click="submit()">
          帮我挑选
        </van-button>
      </div>
    </section>

    <Transition name="content" mode="out-in">
      <section v-if="loading" key="loading" class="guide-loading">
        <div class="loading-orbit">
          <van-icon name="search" />
        </div>
        <strong>正在为你挑选</strong>
        <span>比较需求与商品，马上就好</span>
        <div class="loading-track"><i /></div>
      </section>

      <div v-else-if="!result" key="examples" class="starter-content">
        <section class="example-panel">
          <h2>可以这样问</h2>
          <button v-for="item in examples" :key="item.text" type="button" @click="submit(item.text)">
            <van-icon class="example-icon" :name="item.icon" />
            <span>{{ item.text }}</span>
            <van-icon name="arrow" />
          </button>
        </section>
      </div>

      <section v-else key="results" class="result-area">
        <van-notice-bar
          v-for="message in result.relaxedConstraints"
          :key="message"
          class="relaxed-tip"
          left-icon="info-o"
          :text="message"
          wrapable
          :scrollable="false"
        />

        <header class="section-title">
          <h2>为你挑好了</h2>
          <span>{{ result.recommendations.length }} 件</span>
        </header>

        <article
          v-for="(item, index) in result.recommendations"
          :key="item.product.prodId"
          class="recommend-card"
          :style="{ animationDelay: `${index * 80}ms` }"
        >
          <div class="product-main" @click="goDetail(item.product.prodId)">
            <div class="product-image-wrap">
              <img :src="item.product.pic" :alt="item.product.prodName">
              <span>{{ index + 1 }}</span>
            </div>
            <div class="product-copy">
              <h3>{{ item.product.prodName }}</h3>
              <strong><small>¥</small>{{ item.product.price }}</strong>
            </div>
          </div>

          <div v-if="item.matched.length" class="match-list">
            <div v-for="matched in item.matched.slice(0, 3)" :key="matched">
              <van-icon name="success" />{{ matched }}
            </div>
          </div>

          <p v-if="item.unmatched.length" class="uncertain">
            <van-icon name="info-o" />{{ item.unmatched.slice(0, 2).join('、') }}暂未找到明确说明
          </p>

          <van-button block type="danger" @click="goDetail(item.product.prodId)">
            查看商品
          </van-button>
        </article>
      </section>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.guide-page {
  min-height: 100vh;
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 100% 18%, rgba(238, 10, 36, 0.09), transparent 32%),
    radial-gradient(circle at 0 88%, rgba(255, 173, 94, 0.1), transparent 30%),
    linear-gradient(180deg, #fff 0%, #fff7f8 38%, var(--shop-bg) 100%);
}

.guide-hero {
  position: relative;
  padding: 38px 28px 12px;

  h1,
  > p,
  .compose-card {
    animation: rise-in 0.5s both;
  }

  h1 {
    margin: 0;
    color: var(--shop-text);
    font-size: 44px;
    line-height: 1.3;
  }

  > p {
    margin: 14px 0 28px;
    color: #6d6e72;
    font-size: 24px;
    line-height: 1.5;
    animation-delay: 80ms;
  }

  .compose-card {
    padding: 18px;
    border: 1px solid rgba(238, 10, 36, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.9);
    animation-delay: 140ms;
  }

  .guide-input {
    margin-bottom: 16px;
    overflow: hidden;
    border-radius: var(--shop-radius);
    background: #f7f8fa;
    color: var(--shop-text);
  }

  :deep(.van-field__control) {
    min-height: 118px;
    font-size: 25px;
    line-height: 1.55;
  }

  :deep(.van-button) {
    height: 84px;
    border: 0;
    border-radius: var(--shop-radius-sm);
    background: var(--shop-primary);
    color: #fff;
    font-size: 27px;
    font-weight: 700;
  }
}

.example-panel,
.guide-loading,
.recommend-card {
  background: var(--shop-card);
  border-radius: var(--shop-radius);
}

.example-panel {
  margin: 20px;
  padding: 24px;
  border: 1px solid var(--shop-border);

  h2 {
    margin: 0 0 10px;
    font-size: 29px;
  }

  button {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 0;
    border: 0;
    border-bottom: 1px solid var(--shop-border);
    background: none;
    color: var(--shop-text);
    text-align: left;
    font-size: 24px;
    line-height: 1.5;

    &:last-child {
      border-bottom: 0;
    }

    .van-icon {
      flex: 0 0 auto;
      color: var(--shop-text-secondary);
    }

    > span {
      min-width: 0;
      flex: 1;
    }

    .example-icon {
      display: grid;
      width: 52px;
      height: 52px;
      place-items: center;
      border-radius: 14px;
      background: var(--shop-primary-soft);
      color: var(--shop-primary);
      font-size: 27px;
    }
  }
}

.starter-content {
  animation: rise-in 0.45s 0.18s both;
}

.guide-loading {
  display: flex;
  margin: 24px 20px;
  padding: 46px 32px 36px;
  align-items: center;
  flex-direction: column;
  box-shadow: 0 8px 26px rgba(50, 50, 51, 0.05);

  strong {
    margin-top: 22px;
    font-size: 29px;
  }

  > span {
    margin-top: 10px;
    color: var(--shop-text-secondary);
    font-size: 23px;
  }
}

.loading-orbit {
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  border: 3px solid var(--shop-primary-soft);
  border-top-color: var(--shop-primary);
  border-radius: 50%;
  color: var(--shop-primary);
  font-size: 34px;
  animation: spin 1.1s linear infinite;

  .van-icon {
    animation: reverse-spin 1.1s linear infinite;
  }
}

.loading-track {
  width: 100%;
  height: 6px;
  margin-top: 30px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--shop-primary-soft);

  i {
    display: block;
    width: 42%;
    height: 100%;
    border-radius: inherit;
    background: var(--shop-primary);
    animation: scan 1.4s ease-in-out infinite;
  }
}

.result-area {
  padding: 20px;
}

.relaxed-tip {
  margin-bottom: 16px;
  border-radius: var(--shop-radius-sm);
}

.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 4px 18px;

  h2 {
    margin: 0;
    font-size: 34px;
  }

  span {
    color: var(--shop-text-secondary);
    font-size: 22px;
  }
}

.recommend-card {
  margin-bottom: 18px;
  padding: 22px;
  border: 1px solid var(--shop-border);
  box-shadow: 0 8px 24px rgba(50, 50, 51, 0.05);
  opacity: 0;
  animation: card-in 0.48s ease forwards;

  :deep(.van-button) {
    height: 70px;
    margin-top: 20px;
    border-radius: var(--shop-radius-sm);
    font-size: 24px;
  }
}

.product-main {
  display: flex;
  gap: 18px;
  cursor: pointer;
}

.product-image-wrap {
  position: relative;
  width: 168px;
  height: 168px;
  flex: 0 0 168px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--shop-radius-sm);
    background: #f2f3f5;
  }

  span {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--shop-primary);
    color: #fff;
    font-size: 20px;
    font-weight: 700;
    line-height: 34px;
    text-align: center;
    box-shadow: 0 4px 10px rgba(238, 10, 36, 0.24);
  }
}

.product-copy {
  display: flex;
  min-width: 0;
  justify-content: space-between;
  flex-direction: column;

  h3 {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    color: var(--shop-text);
    font-size: 26px;
    line-height: 1.42;
  }

  strong {
    color: var(--shop-primary);
    font-size: 32px;
  }

  small {
    margin-right: 2px;
    font-size: 21px;
  }
}

.match-list {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: var(--shop-radius-sm);
  background: var(--shop-primary-soft);

  div {
    display: flex;
    gap: 9px;
    padding: 6px 0;
    color: #5b232a;
    font-size: 22px;
    line-height: 1.45;
  }

  .van-icon {
    margin-top: 4px;
    flex: 0 0 auto;
    color: var(--shop-primary);
  }
}

.uncertain {
  display: flex;
  gap: 8px;
  margin: 14px 2px 0;
  color: var(--shop-text-secondary);
  font-size: 20px;
  line-height: 1.45;
}

.content-enter-active,
.content-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.content-enter-from,
.content-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes rise-in {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(18px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes reverse-spin {
  to { transform: rotate(-360deg); }
}

@keyframes scan {
  0% { transform: translateX(-110%); }
  55%, 100% { transform: translateX(240%); }
}

@media (prefers-reduced-motion: reduce) {
  .guide-hero h1,
  .guide-hero > p,
  .guide-hero .compose-card,
  .guide-hero .guide-input,
  .guide-hero :deep(.van-button),
  .example-panel,
  .recommend-card,
  .loading-orbit,
  .loading-orbit .van-icon,
  .loading-track i {
    animation: none;
    opacity: 1;
  }
}
</style>
