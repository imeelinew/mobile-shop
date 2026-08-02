<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBannerList, getNoticeList, getProductGroups } from '@/api/home'
import type { Banner, Notice, Product, ProductGroup } from '@/types/home'

const router = useRouter()
const keyword = ref<string>('')

const goSearch = () => {
    router.push('/search')
}
const goDetail = (prodId: number) => {
    router.push({
        path: '/product-detail',
        query: {
            prodId
        }
    }
    )
}
const goCategory = (title: string) => {
    sessionStorage.setItem('fromHome', '1')
    router.push({
        path: '/category',
        query: {
            value: title
        }
    })
}
const bannerList = ref<Banner[]>([])
const noticeList = ref<Notice[]>([])
const productGroups = ref<ProductGroup[]>([])

const initHome = async () => {
    try {
        const [
            bannerResult,
            noticeResult,
            productGroupsResult
        ] = await Promise.all([
            getBannerList(),
            getNoticeList(),
            getProductGroups()
        ])
        bannerList.value = bannerResult.data
        noticeList.value = noticeResult.data
        productGroups.value = productGroupsResult.data
        console.log(bannerList.value, 'bannerList', noticeList.value, 'noticeList', productGroups.value, 'productGroups')
    } catch (error) {
        console.error(error)
    }
}
onMounted(() => {
    initHome()
})

const navItems = [
    { text: '新品推荐', icon: 'new-o', path: '/category' },
    { text: '限时特惠', icon: 'clock-o', path: '/category' },
    { text: '每日疯抢', icon: 'fire-o', path: '/category' },
    { text: '领优惠券', icon: 'coupon-o', path: '/mine' },
]
</script>
<template>
    <div class="home-page">
        <!-- 搜索 -->
        <van-search v-model="keyword" placeholder="请输入搜索关键词" shape="round" background="#fff" @click="goSearch" />
        <van-swipe class="banner-swipe" :autoplay="3000" lazy-render indicator-color="#ee0a24">
            <van-swipe-item
                v-for="banner in bannerList"
                :key="banner.imgUrl"
                @click="banner.relation ? goDetail(banner.relation) : undefined"
            >
                <img class="banner-image" :src="banner.imgUrl" alt="商城轮播图" />
            </van-swipe-item>
        </van-swipe>
        <van-grid class="nav-grid" :border="false" :column-num="4">
            <van-grid-item
                v-for="item in navItems"
                :key="item.text"
                :icon="item.icon"
                :text="item.text"
                @click="router.push(item.path)"
            />
        </van-grid>
        <!-- 公告 -->
        <van-notice-bar class="home-notice" left-icon="volume-o" color="#ed6a0c" background="#fffbe8">
            <van-swipe class="notice-swipe" horizontal :autoplay="3000" :show-indicators="false">
                <van-swipe-item v-for="notice in noticeList" :key="notice.id">
                    {{ notice.title }}
                </van-swipe-item>
            </van-swipe>
        </van-notice-bar>
        <!-- 商品组 -->
        <section v-for="group in productGroups" :key="group.id" class="product-group">
            <header class="group-header">
                <h2>{{ group.title }}</h2>
                <span class="more-link" @click="goCategory(group.title)">查看更多</span>
            </header>

            <div class="product-grid">
                <article v-for="product in group.productDtoList" :key="product.prodId" class="product-card"
                    @click="goDetail(product.prodId)">
                    <img class="product-image" :src="product.pic" :alt="product.prodName" />

                    <div class="product-name">
                        {{ product.prodName }}
                    </div>

                    <div class="product-price">
                        <span class="price-symbol">¥</span>{{ product.price }}
                    </div>
                </article>
            </div>
        </section>
    </div>
</template>
<style lang="scss" scoped>
.home-page {
    min-height: 100%;
    background: var(--shop-bg);
    padding-bottom: 16px;
}

.banner-swipe {
    margin: 0 20px;
    overflow: hidden;
    border-radius: var(--shop-radius);
}

.banner-image {
    display: block;
    width: 100%;
    height: 320px;
    object-fit: cover;
}

.nav-grid {
    margin: 16px 20px 0;
    border-radius: var(--shop-radius);
    overflow: hidden;
    background: var(--shop-card);

    :deep(.van-grid-item__content) {
        padding: 28px 8px;
        background: transparent;
    }

    :deep(.van-grid-item__icon) {
        font-size: 44px;
        color: var(--shop-primary);
    }

    :deep(.van-grid-item__text) {
        margin-top: 12px;
        color: var(--shop-text);
        font-size: 22px;
    }
}

.home-notice {
    margin: 16px 20px 0;
    border-radius: var(--shop-radius-sm);
    overflow: hidden;
}

.notice-swipe {
    height: 40px;
    width: 100%;
    line-height: 40px;
}

.product-group {
    margin: 20px 20px 0;
    padding: 24px 20px 20px;
    border-radius: var(--shop-radius);
    background: var(--shop-card);
}

.group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h2 {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
        color: var(--shop-text);
    }

    .more-link {
        color: var(--shop-text-secondary);
        font-size: 24px;
    }
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.product-card {
    min-width: 0;
}

.product-image {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: var(--shop-radius-sm);
    background: #f2f3f5;
}

.product-name {
    margin-top: 12px;
    font-size: 24px;
    line-height: 1.4;
    color: var(--shop-text);
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.product-price {
    margin-top: 8px;
    color: var(--shop-primary);
    font-size: 28px;
    font-weight: 700;

    .price-symbol {
        margin-right: 2px;
        font-size: 22px;
        font-weight: 600;
    }
}
</style>
