<!-- 游客导览主页面（AI 数字人）。对话/语音/路线在 P4 阶段完善。 -->
<template>
  <div class="guide-experience">
    <div class="dh-panel">
      <DigitalHumanAvatar ref="avatarRef" @ready="onReady" @error="onError" />
    </div>
    <div class="ctrl-panel">
      <ElInput v-model="text" type="textarea" :rows="3" placeholder="输入讲解内容，测试数字人播报" />
      <ElButton type="primary" :disabled="!text.trim()" @click="onSpeak">让数字人讲解</ElButton>
      <p class="hint">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import DigitalHumanAvatar from '@/components/digital-human/DigitalHumanAvatar.vue'
  import type { DigitalHumanConfig } from '@/api/digital-human'

  defineOptions({ name: 'GuideExperience' })

  const avatarRef = ref<InstanceType<typeof DigitalHumanAvatar> | null>(null)
  const text = ref('')
  const hint = ref('数字人接入中…')

  function onReady(config: DigitalHumanConfig | null) {
    hint.value = config?.welcomeText || '数字人已就绪'
    if (config?.welcomeText) {
      avatarRef.value?.speak(config.welcomeText, 'warm')
    }
  }

  function onError(message: string) {
    hint.value = message || '数字人不可用，已切换为文本模式'
  }

  async function onSpeak() {
    const ok = await avatarRef.value?.speak(text.value.trim(), 'neutral')
    if (!ok) hint.value = '当前为文本模式，数字人无法播报'
  }
</script>

<style scoped lang="scss">
  .guide-experience {
    display: flex;
    gap: 16px;
    height: calc(100vh - 140px);
    padding: 16px;
  }

  .dh-panel {
    flex: 1;
    min-width: 320px;
  }

  .ctrl-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 320px;
  }

  .hint {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
</style>
