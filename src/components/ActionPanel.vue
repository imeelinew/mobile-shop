<script lang="ts" setup>
import { computed, ref } from 'vue';
const props = defineProps({
    skuList: {
        type: Array,
        default: () => []
    }
})
//拆分skuList
// const splitSkuList = computed(() => {
//     return props.skuList.map((item: any) => {
//         return item.properties.split(';').map((item: any) => {
//             return item.split(':')
//         })
//     })
// })

//Agent
const propertyMap = computed(() => {
    const result: any = {}

    props.skuList.forEach((sku: any) => {
        const properties = sku.properties.split(';')

        properties.forEach((property: string) => {
            const [name, value] = property.split(':')

            if (!result[name]) {
                result[name] = new Set()
            }

            result[name].add(value)
        })
    })

    return result
})
//选中状态和点击函数
const selectedProps = ref<Record<string, string>>({})

const selectProperty = (name: string, value: string) => {
    selectedProps.value[name] = value
}
</script>
<template>
    <div v-for="(values, name) in propertyMap" :key="name" class="spec-group">
        <div class="spec-title">{{ name }}</div>
        <div class="spec-options">
            <van-button v-for="value in values" :key="value" size="small" :plain="selectedProps[String(name)] !== value"
                type="danger" @click="selectProperty(String(name), value)">
                {{ value }}
            </van-button>
        </div>
    </div>
</template>
<style lang="scss" scoped></style>
