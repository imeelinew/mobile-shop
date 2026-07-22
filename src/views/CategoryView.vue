<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getCategoryList, getCategoryProducts } from '@/api/category'

const active = ref(0)          // 左侧当前选中的下标
const categoryList = ref([])   // 左侧分类
const productList = ref([])    // 右侧商品

const handleGetCategoryList = async () => {
    const res = await getCategoryList()
    categoryList.value = res.data.map((item: any) => ({//遍历数组，并产生一个新数组
        ...item,//把原对象的全部字段复制过来
        text: item.categoryName//额外增加 Vant 需要的 text 字段
    }))
}
onMounted(async () => {
    await handleGetCategoryList()
    console.log(categoryList.value, 'categoryList')
})
</script>
<template>
    <van-sidebar v-model="active">
        <van-sidebar-item :title="item.text" v-for="item in categoryList" :key="item.id" />
    </van-sidebar>

</template>
<style lang="scss" scoped></style>