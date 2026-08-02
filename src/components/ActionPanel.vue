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
    confirmSelection()
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
                <button
                    v-for="value in values"
                    :key="value"
                    type="button"
                    class="spec-option"
                    :class="{ active: selectedProps[String(name)] === value }"
                    @click="selectProperty(String(name), value)"
                >
                    {{ value }}
                </button>
            </div>
        </div>
        <!-- <van-button class="confirm-button" block type="danger" @click="confirmSelection">
            确定
        </van-button> -->
    </div>
</template>
<style lang="scss" scoped>
.action-panel {
    padding: 8px 28px 32px;
}

.spec-group {
    & + .spec-group {
        margin-top: 28px;
    }
}

.spec-title {
    margin-bottom: 18px;
    font-size: 28px;
    font-weight: 600;
    color: var(--shop-text);
}

.spec-options {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.spec-option {
    min-width: 96px;
    padding: 12px 22px;
    border: 1px solid var(--shop-primary);
    border-radius: 8px;
    background: #fff;
    color: var(--shop-primary);
    font-size: 24px;
    line-height: 1.3;

    &.active {
        background: var(--shop-primary);
        color: #fff;
    }
}

.confirm-button {
    margin-top: 48px;
}
</style>
