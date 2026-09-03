<script lang="ts" setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="guide-fab-wrap">
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
  bottom: calc(140px + env(safe-area-inset-bottom));
  width: 96px;
  height: 96px;
}

.guide-fab {
  width: 96px;
  height: 96px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  background: var(--shop-primary);
}

.guide-fab-content {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 3px;

  .van-icon {
    font-size: 30px;
  }

  span {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.1;
  }
}
</style>
