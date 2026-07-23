<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail } from '@/api/product'
import { getProductSellingPoints } from '@/ai/productSellingPoints'
import { getCollectionStatus, toggleCollection, getProductCommentData } from '@/api/product'
import { showSuccessToast, showFailToast } from 'vant'
import 'vant/es/toast/style'
const router = useRouter()
const route = useRoute()
const product = ref<any>(null)

//product的图片数组，用逗号分隔
const productImages = ref<string[]>([])
const loading = ref(false)
const aiSellingPoints = ref<string[]>([])
const aiSource = ref('fallback')
const isCollected = ref(false)

//AI状态
const aiLoading = ref(true)
//评论数据
const commentData = ref<any>(null)

//加载产品数据
const loadProductDetail = async () => {
  const prodId = Number(route.query.prodId)
  if (!prodId) return
  loading.value = true

  try {
    const res = await getProductDetail(prodId)
    product.value = res.data
    productImages.value = product.value.imgs.split(',')
    console.log(productImages.value, 'product图片集')
    //获取收藏状态
    const collectionStatus = await getCollectionStatus(prodId)
    isCollected.value = collectionStatus.data
    //获取评论数据
    const resComment = await getProductCommentData(prodId)
    commentData.value = resComment.data
  } catch (error) {
    console.error('获取商品详情失败:', error)
  } finally {
    loading.value = false
  }
  if (product.value) {
    const res = await getProductSellingPoints(product.value)
    aiSource.value = res.source
    aiSellingPoints.value = res.result
    aiLoading.value = false
  }
  console.log(product.value, '商品数据')
  console.log(aiSellingPoints.value, 'ai切分后的卖点4条数据')
}

//处理切换收藏状态
const handleToggleCollection = async () => {
  if (!product.value) return
  const res = await toggleCollection(product.value.prodId)
  if (res.success) {
    const res = await getCollectionStatus(product.value.prodId)
    isCollected.value = res.data
    showSuccessToast(isCollected.value ? '收藏成功' : '取消收藏成功')
  } else {
    showFailToast(res.msg || '操作失败')
  }
  console.log(isCollected.value, '收藏状态')
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
      <van-swipe class="my-swipe" :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="image in productImages" :key="image">
          <van-image width="100%" height="100%" fit="contain" :src="image" />
        </van-swipe-item>
      </van-swipe>

      <div class="product-info">
        <div class="info-left">
          <h1 class="product-title">{{ product.prodName }}</h1>
          <p class="product-brief">{{ product.brief }}</p>
        </div>
        <div class="info-right" @click="handleToggleCollection">
          <van-icon name="like" :color="isCollected ? '#ee0a24' : '#969799'" />
          <span>{{ isCollected ? '已收藏' : '收藏' }}</span>
        </div>
      </div>
      <p class="product-price">
        <span>¥</span>
        {{ product.price }}
      </p>

    </div>
    <van-empty v-else description="暂无数据" />
    <div v-if="aiLoading" class="ai-loading">
      🤖 AI 正在分析商品卖点...
    </div>
    <div v-else-if="aiSellingPoints.length" class="ai-selling-points">
      <div class="ai-selling-title">
        <strong>🤖 AI智能卖点</strong>
        <van-tag plain :type="aiSource === 'openai' ? 'primary' : 'success'">
          <!-- {{ aiSource === 'openai' ? 'DeepSeek AI' : '本地' }} -->
          <span v-if="aiSource === 'openai'">DeepSeek AI</span>
          <span v-else-if="aiSellingPoints.length > 3">智能推荐卖点</span>
          <span v-else>本地</span>
        </van-tag>
      </div>
      <div class="ai-selling-point" v-for="point in aiSellingPoints" :key="point">
        <span class="ai-selling-point-text">{{ point }}</span>
      </div>
    </div>
    <van-divider />
    <!-- 下方暂未完成 -->
    <div class="selected-row">
      <span>已选</span>
    </div>

    <van-divider />
    <div v-if="commentData" class="comment-summary">
      <span>好评{{ commentData.positiveRating }}%</span>
      <span style="color: gray;">共{{ commentData.number }}条</span>
    </div>
    <div v-if="commentData" class="comment-tabs">
      <van-tag>全部{{ commentData.number }}</van-tag>
      <van-tag>好评{{ commentData.praiseNumber }}</van-tag>
      <van-tag>中评{{ commentData.secondaryNumber }}</van-tag>
      <van-tag>差评{{ commentData.negativeNumber }}</van-tag>
      <van-tag>有图{{ commentData.picNumber }}</van-tag>
    </div>
    <div v-if="product?.content" class="product-content" v-html="product.content"></div>
  </div>
  <!-- 底部操作栏 -->
  <van-action-bar>
    <van-action-bar-icon icon="cart-o" text="购物车" />
    <van-action-bar-icon icon="shop-o" text="店铺" />
    <van-action-bar-button type="warning" text="加入购物车" />
    <van-action-bar-button type="danger" text="立即购买" />
  </van-action-bar>
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
    margin: 24px 28px;
    padding: 28px;
    border-radius: 14px;
    background: #f4f3ff;

    .ai-selling-title {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 24px;

      strong {
        font-size: 34px;
      }
    }

    .ai-selling-point {
      padding: 20px 24px;
      border-left: 6px solid #1989fa;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.82);
      color: #323233;
      font-size: 24px;
      line-height: 1.5;

      &+.ai-selling-point {
        margin-top: 14px;
      }
    }
  }

  .ai-loading {
    margin: 24px 28px;
    padding: 28px;
    border-radius: 14px;
    background: #f4f3ff;
    font-size: 24px;
    text-align: center;
  }

  .selected-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 28px;
    background: #fff;
    font-size: 24px;
    text-align: center;
  }

  .comment-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 28px;
    background: #fff;
    font-size: 24px;
    text-align: center;
  }

  .comment-tabs {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 28px;
    background: #fff;
    font-size: 24px;
    text-align: center;
  }

  .product-content {
    width: 100%;
    max-width: 100vw;
    overflow: hidden;
    box-sizing: border-box;
    background: #fff;

    :deep(img) {
      display: block;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
    }
  }
}
</style>
