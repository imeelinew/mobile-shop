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
    { text: '新品推荐', icon: 'new-o' },
    { text: '限时特惠', icon: 'clock-o' },
    { text: '每日疯抢', icon: 'fire-o' },
    { text: '领优惠券', icon: 'coupon-o' },
]
</script>
<template>
    <!-- 搜索 -->
    <van-search v-model="keyword" placeholder="请输入搜索关键词" @click="goSearch" />
    <van-swipe :autoplay="3000" lazy-render>
        <van-swipe-item v-for="banner in bannerList" :key="banner.imgUrl">
            <img class="banner-image" :src="banner.imgUrl" alt="商城轮播图" />
        </van-swipe-item>
    </van-swipe>
    <van-grid>
        <van-grid-item v-for="item in navItems" :key="item.text" :icon="item.icon" :text="item.text" />
    </van-grid>
    <!-- 公告 -->
    <van-notice-bar left-icon="volume-o">
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
            <span style="font-size: 16px;" @click="goCategory(group.title)">查看更多</span>
        </header>

        <div class="product-grid">
            <article v-for="product in group.productDtoList" :key="product.prodId" class="product-card"
                @click="goDetail(product.prodId)">
                <img class="product-image" :src="product.pic" :alt="product.prodName" />

                <div class="product-name">
                    {{ product.prodName }}
                </div>

                <div class="product-price">
                    ¥ {{ product.price }}
                </div>
            </article>
        </div>
    </section>
</template>
<style lang="scss" scoped>
.banner-image {
    display: block;
    width: 100%;
    height: 370px;
}

.notice-swipe {
    height: 40px;
    width: 100%;
}

.product-group {
    padding: 20px;
}

.group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h2 {
        margin: 20px 0;
        font-size: 32px;
    }

    span {
        color: #999;
    }
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

.product-image {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
}

.product-name {
    font-size: 28px;
    margin-top: 10px;
    overflow: hidden;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.product-price {
    margin-top: 8px;
    color: #ee0a24;
    font-size: 30px;
}
</style>