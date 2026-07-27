<script lang="ts" setup>
import TabBar from './TabBar.vue'
import { RouterView } from 'vue-router'
</script>
<template>
    <main class="layout-content">
        <RouterView />

    </main>
    <TabBar />
</template>
<style lang="scss" scoped>
.layout-content {
    min-height: 100vh;
    padding-bottom: 100px;
    background: var(--shop-bg);
}
</style>