<script setup lang="ts">
type SkeletonVariant = 'home' | 'list' | 'detail' | 'profile' | 'form' | 'lines'

withDefaults(defineProps<{
    variant?: SkeletonVariant
    rows?: number
    compact?: boolean
}>(), {
    variant: 'list',
    rows: 4,
    compact: false,
})
</script>

<template>
    <div
        class="content-skeleton"
        :class="[`content-skeleton--${variant}`, { 'content-skeleton--compact': compact }]"
        role="status"
        aria-live="polite"
        aria-label="内容加载中"
    >
        <template v-if="variant === 'home'">
            <div class="skeleton-block home-banner" />
            <div class="home-nav">
                <div v-for="index in 4" :key="index" class="home-nav-item">
                    <div class="skeleton-block nav-icon" />
                    <div class="skeleton-block nav-label" />
                </div>
            </div>
            <div v-for="index in 2" :key="index" class="skeleton-card home-group">
                <div class="skeleton-block title-line" />
                <div class="home-products">
                    <div v-for="product in 3" :key="product">
                        <div class="skeleton-block product-image" />
                        <div class="skeleton-block text-line" />
                        <div class="skeleton-block price-line" />
                    </div>
                </div>
            </div>
        </template>

        <template v-else-if="variant === 'detail'">
            <div class="skeleton-block detail-image" />
            <div class="skeleton-card detail-card">
                <div class="skeleton-block title-line title-line--wide" />
                <div class="skeleton-block text-line text-line--short" />
                <div class="skeleton-block price-line" />
            </div>
            <div class="skeleton-card detail-card">
                <div v-for="index in rows" :key="index" class="skeleton-block text-line" />
            </div>
        </template>

        <template v-else-if="variant === 'profile'">
            <div class="skeleton-card profile-card">
                <div class="skeleton-block profile-avatar" />
                <div class="profile-copy">
                    <div class="skeleton-block title-line" />
                    <div class="skeleton-block text-line text-line--short" />
                </div>
            </div>
            <div class="skeleton-card profile-grid">
                <div v-for="index in 4" :key="index" class="profile-grid-item">
                    <div class="skeleton-block nav-icon" />
                    <div class="skeleton-block nav-label" />
                </div>
            </div>
            <div class="skeleton-card line-group">
                <div v-for="index in rows" :key="index" class="skeleton-block text-line" />
            </div>
        </template>

        <template v-else-if="variant === 'form'">
            <div v-for="index in rows" :key="index" class="skeleton-card form-row">
                <div class="skeleton-block form-label" />
                <div class="skeleton-block text-line" />
            </div>
        </template>

        <template v-else-if="variant === 'lines'">
            <div class="skeleton-card line-group">
                <div
                    v-for="index in rows"
                    :key="index"
                    class="skeleton-block text-line"
                    :class="{ 'text-line--short': index === rows }"
                />
            </div>
        </template>

        <template v-else>
            <div v-for="index in rows" :key="index" class="skeleton-card list-row">
                <div class="skeleton-block list-thumb" />
                <div class="list-copy">
                    <div class="skeleton-block title-line title-line--wide" />
                    <div class="skeleton-block text-line" />
                    <div class="skeleton-block price-line" />
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
.content-skeleton {
    padding: 20px;
}

.content-skeleton--compact {
    padding: 12px;
}

.skeleton-block {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    background: #edf0f3;

    &::after {
        position: absolute;
        inset: 0;
        content: '';
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
        animation: skeleton-shimmer 1.35s ease-in-out infinite;
    }
}

.skeleton-card {
    border-radius: var(--shop-radius);
    background: var(--shop-card);
}

.home-banner {
    width: 100%;
    height: 320px;
    border-radius: var(--shop-radius);
}

.home-nav,
.profile-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
}

.home-nav {
    margin-top: 16px;
    padding: 26px 8px;
    border-radius: var(--shop-radius);
    background: var(--shop-card);
}

.home-nav-item,
.profile-grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.nav-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
}

.nav-label {
    width: 72%;
    height: 18px;
    margin-top: 14px;
}

.home-group,
.detail-card,
.line-group {
    margin-top: 20px;
    padding: 24px 20px;
}

.home-products {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 20px;
}

.product-image {
    width: 100%;
    aspect-ratio: 1;
}

.title-line {
    width: 38%;
    height: 24px;
}

.title-line--wide {
    width: 72%;
}

.text-line {
    width: 92%;
    height: 18px;
    margin-top: 14px;
}

.text-line--short {
    width: 54%;
}

.price-line {
    width: 36%;
    height: 22px;
    margin-top: 14px;
}

.detail-image {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 0;
}

.profile-card {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 30px 24px;
}

.profile-avatar {
    flex: 0 0 auto;
    width: 92px;
    height: 92px;
    border-radius: 50%;
}

.profile-copy,
.list-copy {
    flex: 1;
    min-width: 0;
}

.profile-grid {
    margin-top: 20px;
    padding: 30px 10px;
}

.list-row {
    display: flex;
    gap: 20px;
    margin-bottom: 16px;
    padding: 20px;
}

.list-thumb {
    flex: 0 0 auto;
    width: 148px;
    height: 148px;
}

.form-row {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 16px;
    padding: 28px 24px;
}

.form-label {
    flex: 0 0 auto;
    width: 110px;
    height: 20px;
}

.form-row .text-line {
    flex: 1;
    margin-top: 0;
}

@keyframes skeleton-shimmer {
    100% {
        transform: translateX(100%);
    }
}

@media (prefers-reduced-motion: reduce) {
    .skeleton-block::after {
        animation: none;
    }
}
</style>
