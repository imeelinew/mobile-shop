<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getCategoryList, getCategoryProducts } from '@/api/category'
import { useRouter, useRoute } from 'vue-router';
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
    const res = await getCategoryProducts(categoryId)
    productList.value = res.data?.records || []
    console.log(productList.value, 'productList')
}
const handleChangeCategory = async (index: number) => {
    const category = categoryList.value[index]
    if (category) {
        await handleGetCategoryProducts(category.categoryId)
    }
}
onMounted(async () => {
    applyHomeCategory()
    await handleGetCategoryList()
    console.log(categoryList.value, 'categoryList')
})
</script>
<template>
    <div class="category-page">
        <van-search placeholder="请输入搜索关键词"></van-search>
        <div class="category-content"> <van-sidebar v-model="active" @change="handleChangeCategory">
                <van-sidebar-item :title="item.text" v-for="item in categoryList" :key="item.categoryId" />
            </van-sidebar>
            <main class="product-panel">
                <img v-if="categoryList[active]?.pic" class="category-banner" :src="categoryList[active].pic" alt="">
                <van-card v-for="item in productList" :key="item.prodId" @click="goToDetail(item.prodId)"
                    :title="item.prodName" :desc="item.brief" :price="item.price" :origin-price="item.oriPrice"
                    :thumb="item.pic">
                    <template #tags>
                        <span>库存 x{{ item.totalStocks }}</span>
                    </template>
                </van-card>
                <van-empty v-if="!productList.length" description="该分类暂无商品" />
            </main>
        </div>
    </div>

</template>
<style lang="scss" scoped>
.category-page {
    height: 100vh;
    background: #f7f8fa;
}

.category-content {
    display: flex;
    height: calc(100vh - 104px);
    overflow: hidden;
}

.product-panel {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
}

.category-banner {
    display: block;
    width: 100%;
    height: 120px;
    object-fit: cover;
}
</style>