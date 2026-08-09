<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getCategoryList, getCategoryProducts } from '@/api/category'
import { useRouter, useRoute } from 'vue-router';
import ContentSkeleton from '@/components/ContentSkeleton.vue'
const router = useRouter();
const route = useRoute();

const categoryMap: Record<string, number> = {
    数码好物: 0,
    美妆护肤: 1,
    运动装备: 2,
    新鲜水果: 3
}
const applyHomeCategory = () => {
    //从地址栏读取首页传来的分类名称
    const target = String(route.query.value || '')
    //查看这次跳转是不是来自首页
    const fromHome = sessionStorage.getItem('fromHome')
    //如果不是首页来的，后面代码不执行
    if (!fromHome) return
    //用分类名称去映射表中查找下标
    const index = categoryMap[target]
    if (index !== undefined) {
        active.value = index
    }
    sessionStorage.removeItem('fromHome')
}
const goToDetail = (prodId: number) => {
    router.push({
        path: '/product-detail',
        query: {
            prodId
        }
    })
}
const active = ref(0)          // 左侧当前选中的下标
const categoryList = ref([])   // 左侧分类
const productList = ref([])    // 右侧商品
const loading = ref(true)
const productLoading = ref(false)

const handleGetCategoryList = async () => {
    const res = await getCategoryList()
    categoryList.value = res.data.map((item: any) => ({//遍历数组，并产生一个新数组
        ...item,//把原对象的全部字段复制过来
        text: item.categoryName//额外增加 Vant 需要的 text 字段
    }))
    if (categoryList.value.length) {
        const firstCategory = categoryList.value[active.value]
        await handleGetCategoryProducts(firstCategory.categoryId)
    }
}
const handleGetCategoryProducts = async (categoryId: number) => {
    productLoading.value = true
    try {
        const res = await getCategoryProducts(categoryId)
        productList.value = res.data?.records || []
    } finally {
        productLoading.value = false
    }
}
const handleChangeCategory = async (index: number) => {
    const category = categoryList.value[index]
    if (category) {
        await handleGetCategoryProducts(category.categoryId)
    }
}
onMounted(async () => {
    applyHomeCategory()
    try {
        await handleGetCategoryList()
    } finally {
        loading.value = false
    }
})
</script>
<template>
    <div class="category-page">
        <van-search
            placeholder="请输入搜索关键词"
            shape="round"
            background="#fff"
            readonly
            @click="router.push('/search')"
        />
        <ContentSkeleton v-if="loading" variant="list" :rows="5" />
        <div v-else class="category-content">
            <van-sidebar v-model="active" class="category-sidebar" @change="handleChangeCategory">
                <van-sidebar-item :title="item.text" v-for="item in categoryList" :key="item.categoryId" />
            </van-sidebar>
            <main class="product-panel">
                <ContentSkeleton v-if="productLoading" variant="list" :rows="4" compact />
                <template v-else>
                <img v-if="categoryList[active]?.pic" class="category-banner" :src="categoryList[active].pic" alt="">
                <div class="product-list">
                    <van-card v-for="item in productList" :key="item.prodId" class="product-card"
                        @click="goToDetail(item.prodId)" :title="item.prodName" :desc="item.brief" :price="item.price"
                        :origin-price="item.oriPrice" :thumb="item.pic">
                        <template #tags>
                            <span class="stock-tag">库存 x{{ item.totalStocks }}</span>
                        </template>
                    </van-card>
                </div>
                <van-empty v-if="!productList.length" description="该分类暂无商品" />
                </template>
            </main>
        </div>
    </div>
</template>
<style lang="scss" scoped>
.category-page {
    height: 100vh;
    background: var(--shop-bg);
}

.category-content {
    display: flex;
    height: calc(100vh - 104px);
    overflow: hidden;
}

.category-sidebar {
    flex-shrink: 0;
    width: 180px;

    :deep(.van-sidebar-item) {
        padding: 28px 16px;
        font-size: 26px;
        color: var(--shop-text-secondary);
        background: #f2f3f5;
    }

    :deep(.van-sidebar-item--select) {
        color: var(--shop-text);
        font-weight: 600;
        background: var(--shop-card);

        &::before {
            background: var(--shop-primary);
            width: 6px;
            height: 36px;
            border-radius: 0 4px 4px 0;
        }
    }
}

.product-panel {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    background: var(--shop-card);
}

.category-banner {
    display: block;
    width: calc(100% - 24px);
    height: 140px;
    margin: 16px 12px 8px;
    object-fit: cover;
    border-radius: var(--shop-radius-sm);
}

.product-list {
    padding: 0 8px 24px;
}

.product-card {
    margin: 0;
    background: transparent;

    :deep(.van-card__thumb) {
        width: 160px;
        height: 160px;
        border-radius: var(--shop-radius-sm);
        overflow: hidden;
    }

    :deep(.van-card__title) {
        font-size: 26px;
        font-weight: 600;
        line-height: 1.4;
    }

    :deep(.van-card__desc) {
        margin-top: 8px;
        color: var(--shop-text-secondary);
    }

    :deep(.van-card__price) {
        color: var(--shop-primary);
        font-weight: 700;
    }
}

.stock-tag {
    color: var(--shop-text-secondary);
    font-size: 22px;
}
</style>
