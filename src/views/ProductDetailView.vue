<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail } from '@/api/product'
import { getProductSellingPoints } from '@/ai/productSellingPoints'
import { getCollectionStatus, toggleCollection, getProductCommentData } from '@/api/product'
import { addCart } from '@/api/cart'
import { showSuccessToast, showFailToast } from 'vant'
import ActionPanel from '@/components/ActionPanel.vue'
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
//动作面板
const isShowActionPanel = ref(false)
//购买面板
const isShowBuyPanel = ref(false)
const quantity = ref(1)
//产品规格列表
const skuList = ref<any[]>([])
const selectedSku = ref<any>(null)
//加载产品数据
const loadProductDetail = async () => {
  const prodId = Number(route.query.prodId)
  if (!prodId) return
  loading.value = true

  try {
    const res = await getProductDetail(prodId)
    product.value = res.data
    productImages.value = product.value.imgs.split(',')

    //产品规格
    skuList.value = product.value.skuList || []
    //默认选中第一个规格
    selectedSku.value = skuList.value[0]
    //获取收藏状态
    const collectionStatus = await getCollectionStatus(prodId)
    isCollected.value = collectionStatus.data
    //获取评论数据
    const resComment = await getProductCommentData(prodId)
    commentData.value = resComment.data
  } catch (error) {
    Promise.reject(error)
  } finally {
    loading.value = false
  }
  if (product.value) {
    const res = await getProductSellingPoints(product.value)
    aiSource.value = res.source
    aiSellingPoints.value = res.result
    aiLoading.value = false
  }
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
//处理展开动作面板
const handleShowActionPanel = () => {
  isShowActionPanel.value = !isShowActionPanel.value
  console.log(isShowActionPanel.value, '展开动作面板')
}
const handleShowBuyPanel = () => {
  isShowBuyPanel.value = true
}
const handleSkuConfirm = (sku: any) => {
  selectedSku.value = sku
  isShowActionPanel.value = false
}
//处理加入购物车
const handleAddCart = async () => {
  if (!product.value || !selectedSku.value) return

  try {
    const res = await addCart({
      basketId: 0,
      prodId: product.value.prodId,
      skuId: selectedSku.value.skuId,
      shopId: product.value.shopId,
      count: quantity.value,
    })

    if (res.success) {
      showSuccessToast('添加购物车成功')
      isShowBuyPanel.value = false
    } else {
      showFailToast(res.msg || '添加购物车失败')
    }
  } catch (error) {
    showFailToast('添加购物车失败')
  }
}
//
//处理立即购买
const handleBuyNow = () => {
  if (!product.value || !selectedSku.value) return

  const orderParams = {
    basketIds: [],
    orderItem: {
      prodId: product.value.prodId,
      skuId: selectedSku.value.skuId,
      prodCount: quantity.value,
      shopId: product.value.shopId,
    },
    addrId: 0,
    userChangeCoupon: 0,
    couponIds: [],
  }
//为什么用 sessionStorage？因为数据量大，放 URL query 里太长了。
  sessionStorage.setItem('confirmOrder', JSON.stringify(orderParams))
  router.push('/order-confirm')
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
      AI 正在分析商品卖点...
    </div>
    <div v-else-if="aiSellingPoints.length" class="ai-selling-points">
      <div class="ai-selling-title">
        <strong>AI智能卖点</strong>
        <van-tag plain :type="aiSource === 'openai' ? 'primary' : 'success'">
          <span v-if="aiSource === 'openai'">DeepSeek AI</span>
          <span v-else-if="aiSellingPoints.length > 3">智能推荐卖点</span>
          <span v-else>本地</span>
        </van-tag>
      </div>
      <div class="ai-selling-point" v-for="point in aiSellingPoints" :key="point">
        <span class="ai-selling-point-text">{{ point }}</span>
      </div>
    </div>

    <div class="selected-row" @click="handleShowActionPanel">
      <span class="row-label">已选</span>
      <span class="row-value">{{ selectedSku?.skuName }}</span>
      <van-icon name="arrow" />
    </div>

    <van-action-sheet v-model:show="isShowActionPanel" title="选择产品列表" round>
      <ActionPanel :sku-list="skuList" :selected-sku="selectedSku" @confirm="handleSkuConfirm" />
    </van-action-sheet>

    <div v-if="commentData" class="comment-block">
      <div class="comment-summary">
        <span class="rating">好评{{ commentData.positiveRating }}%</span>
        <span class="count">共{{ commentData.number }}条</span>
      </div>
      <div class="comment-tabs">
        <van-tag plain type="danger">全部{{ commentData.number }}</van-tag>
        <van-tag plain>好评{{ commentData.praiseNumber }}</van-tag>
        <van-tag plain>中评{{ commentData.secondaryNumber }}</van-tag>
        <van-tag plain>差评{{ commentData.negativeNumber }}</van-tag>
        <van-tag plain>有图{{ commentData.picNumber }}</van-tag>
      </div>
    </div>

    <div v-if="product?.content" class="product-content" v-html="product.content"></div>
  </div>

  <van-action-sheet v-model:show="isShowBuyPanel" title="确认商品" round class="buy-sheet">
    <van-card
      class="buy-card"
      :thumb="selectedSku?.pic"
      :title="selectedSku?.skuName"
      :desc="product?.brief"
      :price="selectedSku?.price"
      :num="quantity"
    />
    <div class="quantity-row">
      <span>购买数量</span>
      <van-stepper v-model="quantity" min="1" />
    </div>
    <ActionPanel :sku-list="skuList" :selected-sku="selectedSku" @confirm="handleSkuConfirm" />
    <div class="buy-actions">
      <van-button block type="default" class="cart-btn" @click="handleAddCart">加入购物车</van-button>
      <van-button block type="danger" @click="handleBuyNow">立即购买</van-button>
    </div>
  </van-action-sheet>

  <!-- 底部操作栏 -->
  <van-action-bar safe-area-inset-bottom>
    <van-action-bar-icon icon="cart-o" text="购物车" @click="router.push('/cart')" />
    <van-action-bar-icon icon="shop-o" text="店铺" />
    <van-action-bar-button type="warning" text="加入购物车" @click="handleShowBuyPanel" />
    <van-action-bar-button type="danger" text="立即购买" @click="handleShowBuyPanel" />
  </van-action-bar>
</template>
<style lang="scss" scoped>
.product-detail-page {
  min-height: 100vh;
  padding-bottom: 120px;
  background: var(--shop-bg);

  .loading-box {
    padding-top: 200px;
  }

  .detail-content {
    background: var(--shop-card);
  }

  .my-swipe {
    background: #fff;

    :deep(.van-swipe-item) {
      height: 680px;
    }
  }

  .product-info {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding: 32px 28px 0;

    .info-left {
      flex: 1;
      min-width: 0;

      .product-title {
        margin: 0;
        font-size: 32px;
        font-weight: 600;
        line-height: 1.4;
      }

      .product-brief {
        margin: 16px 0 0;
        color: var(--shop-text-secondary);
        font-size: 24px;
        line-height: 1.5;
      }
    }

    .info-right {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      gap: 8px;
      padding-top: 4px;
      color: var(--shop-text-secondary);
      font-size: 24px;

      .van-icon {
        font-size: 36px;
      }
    }
  }

  .product-price {
    margin: 28px 0 0;
    padding: 0 28px 32px;
    color: var(--shop-primary);
    font-size: 48px;
    font-weight: 700;

    span {
      margin-right: 4px;
      font-size: 28px;
      font-weight: 600;
    }
  }

  .ai-selling-points,
  .ai-loading {
    margin: 16px 20px;
    padding: 28px;
    border-radius: var(--shop-radius);
    background: var(--shop-primary-soft);
  }

  .ai-loading {
    color: var(--shop-text-secondary);
    font-size: 24px;
    text-align: center;
  }

  .ai-selling-title {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    strong {
      font-size: 30px;
    }
  }

  .ai-selling-point {
    padding: 18px 22px;
    border-left: 6px solid var(--shop-primary);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    color: var(--shop-text);
    font-size: 24px;
    line-height: 1.5;

    & + .ai-selling-point {
      margin-top: 12px;
    }
  }

  .selected-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 16px;
    padding: 28px;
    background: var(--shop-card);
    font-size: 26px;

    .row-label {
      color: var(--shop-text-secondary);
      flex-shrink: 0;
    }

    .row-value {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: right;
    }

    .van-icon {
      color: var(--shop-text-secondary);
    }
  }

  .comment-block {
    margin-top: 16px;
    background: var(--shop-card);
  }

  .comment-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px;
    font-size: 26px;

    .rating {
      font-weight: 600;
    }

    .count {
      color: var(--shop-text-secondary);
    }
  }

  .comment-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 0 28px 28px;
  }

  .product-content {
    width: 100%;
    max-width: 100vw;
    margin-top: 16px;
    overflow: hidden;
    box-sizing: border-box;
    background: var(--shop-card);

    :deep(img) {
      display: block;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
    }
  }
}

.buy-card {
  margin: 8px 20px 0;

  :deep(.van-card__price) {
    color: var(--shop-primary);
    font-weight: 700;
  }
}

.quantity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  font-size: 26px;
}

.buy-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px 28px 36px;

  .cart-btn {
    background: #4a4a4a;
    border-color: #4a4a4a;
    color: #fff;
  }
}
</style>
