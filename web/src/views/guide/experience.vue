<!-- 游客导览主页面（AI 数字人）。数字人与对话交互在后续阶段完善。 -->
<template>
  <div class="guide-experience">
    <ElCard shadow="never">
      <template #header>
        <span class="title">灵山胜境 AI 数字人导览</span>
      </template>
      <ElEmpty description="数字人导览体验正在接入中" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'GuideExperience' })
</script>

<style scoped>
.guide-experience {
  padding: 16px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}
</style>
