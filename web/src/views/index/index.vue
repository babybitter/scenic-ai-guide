<!-- 布局容器 -->
<template>
  <div class="app-layout" :class="{ 'is-dark': isDark }">
    <aside id="app-sidebar">
      <ArtSidebarMenu />
    </aside>

    <main id="app-main">
      <div id="app-header">
        <ArtHeaderBar />
      </div>
      <div id="app-content">
        <ArtPageContent />
      </div>
    </main>

    <div id="app-global">
      <ArtGlobalComponent />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useSettingStore } from '@/store/modules/setting'

  defineOptions({ name: 'AppLayout' })

  const { isDark } = storeToRefs(useSettingStore())
</script>

<style lang="scss" scoped>
  @use './style';
</style>
