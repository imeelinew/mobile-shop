<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { shipOrder } from '@/api/order'
import { getCurrentUser } from '@/api/userInfo'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import 'vant/es/dialog/style'
import 'vant/es/toast/style'
import ContentSkeleton from '@/components/ContentSkeleton.vue'

const router = useRouter()
const checkingRole = ref(true)
const submitting = ref(false)
const orderNumber = ref('')

onMounted(async () => {
    try {
        const res = await getCurrentUser()
        if (!res.success || res.data?.role !== 'admin') {
            showFailToast('当前账号无管理员权限')
            await router.replace('/mine')
        }
    } catch {
        showFailToast('管理员身份校验失败')
        await router.replace('/mine')
    } finally {
        checkingRole.value = false
    }
})

const handleShip = async () => {
    if (submitting.value) return

    const normalized = orderNumber.value.trim()
    if (normalized.length < 8) {
        showFailToast('请输入有效订单号')
        return
    }

    try {
        await showConfirmDialog({
            title: '确认发货',
            message: `确认将订单 ${normalized} 标记为已发货吗？`,
        })
    } catch {
        return
    }

    submitting.value = true
    try {
        const res = await shipOrder(normalized)
        if (!res.success) {
            showFailToast(res.msg || '发货失败')
            return
        }
        showSuccessToast('发货成功')
        orderNumber.value = ''
    } catch {
        showFailToast('发货失败，请确认订单处于待发货状态')
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="admin-orders-page">
        <van-nav-bar title="管理员发货" left-text="返回" left-arrow @click-left="router.back()" />

        <ContentSkeleton v-if="checkingRole" variant="form" :rows="3" />

        <template v-else>
            <section class="admin-card">
                <div class="admin-heading">
                    <span class="admin-icon">
                        <van-icon name="logistics" aria-hidden="true" />
                    </span>
                    <div>
                        <h1>订单发货演示</h1>
                        <p>仅管理员可操作，权限由服务端实时校验。</p>
                    </div>
                </div>

                <van-field
                    v-model="orderNumber"
                    name="orderNumber"
                    label="订单号"
                    placeholder="输入待发货订单号"
                    clearable
                    autocomplete="off"
                    @keyup.enter="handleShip"
                />

                <van-button
                    class="ship-button"
                    block
                    type="danger"
                    native-type="button"
                    :loading="submitting"
                    :disabled="submitting"
                    @click="handleShip"
                >
                    确认发货
                </van-button>
            </section>

            <van-notice-bar class="admin-note" left-icon="info-o" wrapable
                text="发货只允许状态为待发货（2）的订单；订单进入待收货（3）后，用户才能确认收货。" />
        </template>
    </div>
</template>

<style lang="scss" scoped>
.admin-orders-page {
    min-height: 100vh;
    background: var(--shop-bg);
}

.admin-card {
    margin: 20px;
    overflow: hidden;
    border-radius: var(--shop-radius);
    background: var(--shop-card);
    box-shadow: 0 8px 24px rgba(50, 50, 51, 0.05);
}

.admin-heading {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    padding: 28px;
    border-bottom: 1px solid var(--shop-border);

    h1 {
        margin: 0;
        color: var(--shop-text);
        font-size: 30px;
        font-weight: 700;
    }

    p {
        margin: 10px 0 0;
        color: var(--shop-text-secondary);
        font-size: 22px;
        line-height: 1.5;
    }
}

.admin-icon {
    width: 64px;
    height: 64px;
    display: grid;
    flex: 0 0 64px;
    place-items: center;
    border-radius: 50%;
    background: var(--shop-primary-soft);
    color: var(--shop-primary);
    font-size: 34px;
}

.ship-button {
    width: calc(100% - 48px);
    margin: 28px 24px;
}

.admin-note {
    margin: 0 20px;
    border-radius: var(--shop-radius-sm);
}
</style>
