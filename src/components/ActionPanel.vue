<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
const props = defineProps({
    skuList: {
        type: Array,
        default: () => []
    },
    selectedSku: {
        type: Object,
        default: null
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
        if (!sku.properties) return

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
watch(
    () => props.selectedSku,
    (sku: any) => {
        if (!sku?.properties) return

        selectedProps.value = {}

        sku.properties.split(';').forEach((property: string) => {
            const [name, value] = property.split(':')
            selectedProps.value[name] = value
        })
    },
    {
        immediate: true,
    }
)
const selectProperty = (name: string, value: string) => {
    selectedProps.value[name] = value
}
const emit = defineEmits(['confirm'])

const confirmSelection = () => {
    const properties = Object.entries(selectedProps.value)
        .map(([name, value]) => `${name}:${value}`)
        .join(';')

    const matchedSku = props.skuList.find(
        (sku: any) => sku.properties === properties
    ) || props.selectedSku

    if (matchedSku) {
        emit('confirm', matchedSku)
    }
}
</script>
<template>
    <div class="action-panel">
        <div v-for="(values, name) in propertyMap" :key="name" class="spec-group">
            <div class="spec-title">{{ name }}</div>
            <div class="spec-options">
                <van-button v-for="value in values" :key="value" size="small"
                    :plain="selectedProps[String(name)] !== value" type="danger"
                    @click="selectProperty(String(name), value)">
                    {{ value }}
                </van-button>
            </div>
        </div>
        <!-- <van-button class="confirm-button" block type="danger" @click="confirmSelection">
            确定
        </van-button> -->
    </div>
</template>
<style lang="scss" scoped>
.action-panel {
    padding: 0 28px 24px;
}

.spec-group {
    &+.spec-group {
        margin-top: 24px;
    }
}

.spec-title {
    margin-bottom: 16px;
    font-size: 26px;
}

.spec-options {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.confirm-button {
    margin-top: 48px;
}
</style>
