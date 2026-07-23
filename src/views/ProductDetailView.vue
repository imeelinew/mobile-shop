<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail } from '@/api/product'
import { getProductSellingPoints } from '@/ai/productSellingPoints'

const router = useRouter()
const route = useRoute()
const product = ref<any>(null)
const loading = ref(false)
const aiSellingPoints = ref<string[]>([])
const aiSource = ref('fallback')

const loadProductDetail = async () => {
  const prodId = Number(route.query.prodId)
  if (!prodId) return
  loading.value = true

  try {
    const res = await getProductDetail(prodId)
    product.value = res.data
    console.log(product.value, 'product')
  } catch (error) {
    console.error('获取商品详情失败:', error)
  } finally {
    loading.value = false
  }
  if (product.value) {
    const res = await getProductSellingPoints(product.value)
    aiSource.value = res.source
    aiSellingPoints.value = res.result
  }
  console.log(aiSellingPoints.value, 'ai切分后的卖点4条数据')
}
const goBack = () => {
  router.back()
}
onMounted(() => {
  loadProductDetail()
})
</script>
<template>
  <van-nav-bar title="商品详情" left-text="返回" left-arrow @click-left="goBack" fixed placeholder />

  <div class="product-detail-page">
    <div v-if="loading" class="loading-box">
      <van-loading vertical>加载中...</van-loading>
    </div>

    <div v-else-if="product" class="detail-content">
      <div class="product-image">
        <van-image width="100%" height="100%" fit="contain" :src="product.pic" />

      </div>

      <div class="product-info">
        <div class="info-left">
          <h1 class="product-title">{{ product.prodName }}</h1>
          <p class="product-brief">{{ product.brief }}</p>
        </div>
        <div class="info-right">
          <van-icon name="like" color="#ee0a24" />
          <span>收藏</span>
        </div>
      </div>
      <p class="product-price">
        <span>¥</span>
        {{ product.price }}
      </p>

    </div>
    <van-empty v-else description="暂无数据" />

    <div class="ai-selling-points">
      <strong style="font-size: 18px;">🤖AI推荐卖点</strong>
      <van-tag type="primary">{{ aiSource === 'openai' ? 'DeepSeek AI' : 'AI推荐' }}</van-tag>
      <div class="ai-selling-point" v-for="point in aiSellingPoints" :key="point">
        <span class="ai-selling-point-text">{{ point }}</span>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.product-detail-page {
  min-height: 100vh;
  background: #f5f5f5;

  .detail-content {
    background: #fff;
  }

  .product-image {
    height: 680px;
    padding: 32px;
    box-sizing: border-box;
    border-bottom: 1px solid #e5e5e5;
  }

  .product-info {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 30px;
    padding: 38px 32px 0;

    .info-left {
      flex: 1;
      min-width: 0;

      .product-title {
        margin: 0;
        font-size: 30px;
        font-weight: 500;
      }

      .product-brief {
        margin: 48px 0 0;
        color: #666;
        font-size: 20px;
      }
    }

    .info-right {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      gap: 8px;
      font-size: 28px;

      .van-icon {
        font-size: 36px;
      }
    }
  }

  .product-price {
    margin: 70px 0 0;
    padding: 0 32px 70px;
    color: #ee0a24;
    font-size: 48px;

    span {
      font-size: 32px;
    }
  }

  .ai-selling-points {
    padding: 32px;
    font-size: 28px;
  }
}
</style>
