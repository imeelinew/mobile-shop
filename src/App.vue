<script lang="ts" setup>
import { RouterView } from 'vue-router'
</script>
<template>
  <RouterView />
</template>
<style lang="scss">
:root {
  --shop-primary: #ee0a24;
  --shop-primary-soft: rgba(238, 10, 36, 0.08);
  --shop-text: #323233;
  --shop-text-secondary: #969799;
  --shop-border: #ebedf0;
  --shop-bg: #f7f8fa;
  --shop-card: #ffffff;
  --shop-radius: 16px;
  --shop-radius-sm: 12px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-size: 16PX;
  color: var(--shop-text);
  background: var(--shop-bg);
  -webkit-font-smoothing: antialiased;
}

img {
  vertical-align: middle;
}

.van-nav-bar {
  .van-nav-bar__title {
    font-weight: 600;
  }

  .van-nav-bar__text,
  .van-icon-arrow-left {
    color: var(--shop-primary) !important;
  }
}

.van-submit-bar__button--danger,
.van-button--danger {
  background: var(--shop-primary);
  border-color: var(--shop-primary);
}

.van-checkbox__icon--checked .van-icon {
  background-color: var(--shop-primary) !important;
  border-color: var(--shop-primary) !important;
}
</style>
