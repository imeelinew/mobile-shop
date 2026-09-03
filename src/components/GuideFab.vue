<script lang="ts" setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="guide-fab-wrap">
    <span class="guide-fab-pulse" aria-hidden="true" />
    <van-button
      class="guide-fab"
      round
      type="danger"
      aria-label="打开轻购AI"
      @click="router.push('/guide')"
    >
      <span class="guide-fab-content">
        <van-icon name="chat-o" />
        <span>轻购AI</span>
      </span>
    </van-button>
  </div>
</template>

<style lang="scss" scoped>
.guide-fab-wrap {
  position: fixed;
  z-index: 20;
  right: 24px;
  bottom: calc(116px + env(safe-area-inset-bottom));
  width: 108px;
  height: 108px;
  animation: float 3s ease-in-out infinite;
}

.guide-fab-pulse {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: var(--shop-primary-soft);
  animation: pulse 2.4s ease-out infinite;
}

.guide-fab {
  width: 108px;
  height: 108px;
  padding: 0;
  border: 6px solid rgba(255, 255, 255, 0.92);
  border-radius: 50%;
  background: linear-gradient(145deg, #ff334b, var(--shop-primary));
  box-shadow: 0 12px 30px rgba(238, 10, 36, 0.28);
}

.guide-fab-content {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 3px;

  .van-icon {
    font-size: 34px;
  }

  span {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.1;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes pulse {
  0% { opacity: 0.65; transform: scale(0.88); }
  75%, 100% { opacity: 0; transform: scale(1.35); }
}

@media (prefers-reduced-motion: reduce) {
  .guide-fab-wrap,
  .guide-fab-pulse {
    animation: none;
  }
}
</style>
