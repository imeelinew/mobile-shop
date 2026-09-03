<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showToast } from 'vant'
import 'vant/es/toast/style'
import { getGuideRecommendations } from '@/api/guide'
import type { GuideRecommendation, GuideResult } from '@/types/guide'

const router = useRouter()
const query = ref('')
const loading = ref(false)
const result = ref<GuideResult | null>(null)
const comparedIds = ref<number[]>([])
const showCompare = ref(false)

const examples = [
  '预算2500元，想买适合拍短视频而且便携的设备',
  '800元以内，想要透气、防滑、支撑好的徒步装备',
  '敏感肌换季干燥，预算300元以内怎么选',
]

const intentTags = computed(() => {
  if (!result.value) return []
  const intent = result.value.intent
  return [
    ...(intent.category ? [intent.category] : []),
    ...(intent.budgetMax ? [`预算 ≤ ¥${intent.budgetMax}`] : []),
    ...intent.requirements,
  ]
})

const comparedProducts = computed(() => result.value?.recommendations
  .filter((item) => comparedIds.value.includes(item.product.prodId)) ?? [])

const compareKeys = computed(() => Array.from(new Set(
  comparedProducts.value.flatMap((item) => Object.keys(item.product.attributes || {})),
)).slice(0, 8))

const submit = async (text = query.value) => {
  const value = text.trim()
  if (value.length < 2) {
    showToast('请描述一下预算和使用需求')
    return
  }
  query.value = value
  loading.value = true
  result.value = null
  comparedIds.value = []
  try {
    const response = await getGuideRecommendations(value)
    if (!response.success) throw new Error(response.msg || '推荐失败')
    result.value = response.data
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '智能导购暂时不可用')
  } finally {
    loading.value = false
  }
}

const toggleCompare = (item: GuideRecommendation) => {
  const id = item.product.prodId
  if (comparedIds.value.includes(id)) {
    comparedIds.value = comparedIds.value.filter((value) => value !== id)
    return
  }
  if (comparedIds.value.length >= 3) {
    showToast('最多同时对比 3 件商品')
    return
  }
  comparedIds.value = [...comparedIds.value, id]
}

const goDetail = (prodId: number) => router.push({ path: '/product-detail', query: { prodId } })
</script>

<template>
  <div class="guide-page">
    <van-nav-bar title="AI 智能导购" left-text="返回" left-arrow @click-left="router.back()" />

    <section class="guide-hero">
      <div class="hero-badge"><van-icon name="smile-comment-o" /> 场景化选购</div>
      <h1>不用研究参数，<br>说出你真正需要什么</h1>
      <p>AI 理解需求，程序基于真实商品数据筛选并说明推荐依据。</p>

      <van-field
        v-model="query"
        class="guide-input"
        type="textarea"
        rows="3"
        maxlength="200"
        autosize
        show-word-limit
        placeholder="例如：预算 2500 元，想买适合旅行拍视频、轻便防抖的设备"
      />
      <van-button block round type="danger" :loading="loading" loading-text="正在理解需求…" @click="submit()">
        帮我挑选
      </van-button>
    </section>

    <section v-if="!result && !loading" class="example-panel">
      <h2>试试这样问</h2>
      <button v-for="item in examples" :key="item" type="button" @click="submit(item)">
        <span>{{ item }}</span><van-icon name="arrow" />
      </button>
    </section>

    <div v-if="loading" class="guide-loading">
      <div class="thinking-line"><span />正在拆解预算、场景和偏好</div>
      <div class="thinking-line"><span />正在匹配真实商品信息</div>
      <div class="thinking-line"><span />正在整理推荐依据</div>
    </div>

    <template v-if="result">
      <section class="intent-panel">
        <header>
          <h2>我理解你的需求是</h2>
          <van-tag :type="result.source === 'ai' ? 'primary' : 'success'">
            {{ result.source === 'ai' ? 'AI 解析' : '规则降级' }}
          </van-tag>
        </header>
        <div class="intent-tags">
          <van-tag v-for="tag in intentTags" :key="tag" plain type="primary" size="large">{{ tag }}</van-tag>
        </div>
        <p v-for="message in result.relaxedConstraints" :key="message" class="relaxed-tip">
          <van-icon name="info-o" />{{ message }}
        </p>
      </section>

      <section class="recommend-section">
        <div class="section-title">
          <div><small>基于真实商品字段</small><h2>为你推荐</h2></div>
          <span>{{ result.recommendations.length }} 个结果</span>
        </div>

        <article v-for="(item, index) in result.recommendations" :key="item.product.prodId" class="recommend-card">
          <div class="rank">{{ index + 1 }}</div>
          <div class="product-main" @click="goDetail(item.product.prodId)">
            <img :src="item.product.pic" :alt="item.product.prodName">
            <div class="product-copy">
              <h3>{{ item.product.prodName }}</h3>
              <p>{{ item.product.brief }}</p>
              <strong>¥{{ item.product.price }}</strong>
            </div>
          </div>

          <div class="match-list">
            <div v-for="matched in item.matched" :key="matched" class="match-item">
              <van-icon name="passed" />{{ matched }}
            </div>
            <div v-for="unmatched in item.unmatched" :key="unmatched" class="unmatch-item">
              <van-icon name="warning-o" />未找到“{{ unmatched }}”的明确依据
            </div>
          </div>

          <details v-if="item.evidence.length" class="evidence">
            <summary>查看推荐依据</summary>
            <p v-for="line in item.evidence" :key="line.requirement">
              <strong>{{ line.requirement }}</strong>{{ line.source }}
            </p>
          </details>

          <div class="card-actions">
            <van-button size="small" plain type="primary" @click="toggleCompare(item)">
              {{ comparedIds.includes(item.product.prodId) ? '取消对比' : '加入对比' }}
            </van-button>
            <van-button size="small" type="danger" @click="goDetail(item.product.prodId)">查看商品</van-button>
          </div>
        </article>
      </section>
    </template>

    <div v-if="comparedIds.length >= 2" class="compare-bar">
      <span>已选择 {{ comparedIds.length }} 件商品</span>
      <van-button size="small" round type="primary" @click="showCompare = true">开始对比</van-button>
    </div>

    <van-action-sheet v-model:show="showCompare" title="商品差异对比" class="compare-sheet">
      <div class="compare-table">
        <div class="compare-row compare-products">
          <strong>商品</strong>
          <span v-for="item in comparedProducts" :key="item.product.prodId">{{ item.product.prodName }}</span>
        </div>
        <div class="compare-row">
          <strong>价格</strong>
          <span v-for="item in comparedProducts" :key="item.product.prodId">¥{{ item.product.price }}</span>
        </div>
        <div v-for="key in compareKeys" :key="key" class="compare-row">
          <strong>{{ key }}</strong>
          <span v-for="item in comparedProducts" :key="item.product.prodId">
            {{ item.product.attributes?.[key] ?? '暂无数据' }}
          </span>
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<style lang="scss" scoped>
.guide-page { min-height: 100vh; padding-bottom: 120px; background: #f5f6fa; }
.guide-hero { padding: 44px 28px 32px; color: #fff; background: radial-gradient(circle at 90% 4%, rgba(255,255,255,.25), transparent 28%), linear-gradient(145deg, #5728a8, #7b4ce0 55%, #526dff); }
.hero-badge { display: inline-flex; gap: 8px; align-items: center; padding: 8px 16px; border: 1px solid rgba(255,255,255,.28); border-radius: 999px; background: rgba(255,255,255,.12); font-size: 22px; }
.guide-hero h1 { margin: 26px 0 14px; font-size: 44px; line-height: 1.3; }
.guide-hero > p { margin: 0 0 26px; color: rgba(255,255,255,.82); font-size: 24px; line-height: 1.6; }
.guide-input { margin-bottom: 20px; overflow: hidden; border-radius: 20px; color: #222; }
.example-panel, .intent-panel { margin: 20px; padding: 24px; border-radius: 20px; background: #fff; }
.example-panel h2, .intent-panel h2 { margin: 0; font-size: 29px; }
.example-panel button { display: flex; width: 100%; justify-content: space-between; gap: 16px; padding: 22px 0; border: 0; border-bottom: 1px solid #eee; background: none; color: #444; text-align: left; font-size: 24px; line-height: 1.5; }
.guide-loading { margin: 24px 20px; padding: 28px; border-radius: 20px; background: #fff; }
.thinking-line { display: flex; gap: 14px; align-items: center; padding: 14px 0; color: #666; font-size: 24px; }
.thinking-line span { width: 16px; height: 16px; border-radius: 50%; background: #7652d8; animation: pulse 1.2s ease infinite alternate; }
.thinking-line:nth-child(2) span { animation-delay: .2s; }.thinking-line:nth-child(3) span { animation-delay: .4s; }
.intent-panel header, .section-title, .card-actions { display: flex; align-items: center; justify-content: space-between; }
.intent-tags { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
.relaxed-tip { display: flex; gap: 8px; margin: 18px 0 0; color: #d97706; font-size: 22px; }
.recommend-section { padding: 4px 20px 24px; }
.section-title { margin: 22px 4px 16px; }.section-title small { color: #7b4ce0; font-size: 20px; }.section-title h2 { margin: 4px 0 0; font-size: 34px; }.section-title > span { color: #999; font-size: 22px; }
.recommend-card { position: relative; margin-bottom: 18px; padding: 22px; overflow: hidden; border: 1px solid #ececf4; border-radius: 22px; background: #fff; box-shadow: 0 10px 28px rgba(46,38,80,.06); }
.rank { position: absolute; z-index: 1; top: 12px; left: 12px; width: 38px; height: 38px; border-radius: 12px; background: #6f4bd8; color: #fff; font-weight: 700; line-height: 38px; text-align: center; }
.product-main { display: flex; gap: 18px; cursor: pointer; }.product-main img { width: 170px; height: 170px; flex: 0 0 170px; object-fit: cover; border-radius: 16px; }.product-copy { min-width: 0; }.product-copy h3 { margin: 0; font-size: 27px; line-height: 1.35; }.product-copy p { display: -webkit-box; margin: 10px 0; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; color: #777; font-size: 21px; line-height: 1.5; }.product-copy strong { color: #ee0a24; font-size: 31px; }
.match-list { margin-top: 18px; padding: 16px; border-radius: 14px; background: #f7f8fc; }.match-item, .unmatch-item { display: flex; gap: 8px; padding: 6px 0; font-size: 22px; }.match-item { color: #14805e; }.unmatch-item { color: #b7791f; }
.evidence { margin-top: 14px; font-size: 21px; }.evidence summary { color: #6f4bd8; cursor: pointer; }.evidence p { display: grid; grid-template-columns: 110px 1fr; gap: 10px; margin: 12px 0; color: #777; line-height: 1.5; }.evidence strong { color: #444; }
.card-actions { margin-top: 20px; justify-content: flex-end; gap: 12px; }
.compare-bar { position: fixed; z-index: 10; right: 20px; bottom: 24px; left: 20px; display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-radius: 18px; background: #252333; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.22); font-size: 23px; }
.compare-sheet { max-height: 78vh; }.compare-table { padding: 8px 20px 40px; overflow-x: auto; }.compare-row { display: grid; grid-template-columns: 110px repeat(3, minmax(170px, 1fr)); min-width: 650px; border-bottom: 1px solid #eee; }.compare-row > * { padding: 18px 12px; font-size: 21px; line-height: 1.4; }.compare-row strong { color: #666; }.compare-products span { font-weight: 600; color: #222; }
@keyframes pulse { to { opacity: .25; transform: scale(.75); } }
</style>
