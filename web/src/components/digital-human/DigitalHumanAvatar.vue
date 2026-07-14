<!--
  数字人展示组件（引擎调度器）。
  读取后台启用的数字人配置，按 engine 选择渲染引擎：
    - xfyun：讯飞云端流式数字人（XfAvatar）
    - live2d：本地 Live2D 画布数字人（Live2dAvatar）——讯飞的本地兜底方案
  两套引擎互为冗余：任一引擎不可用时，管理员在后台切换到另一个即可。
  对外暴露 speak()/enableAudio()/interrupt()，转发给当前引擎，调用方无需感知差异。
-->
<template>
  <div class="dh-host">
    <Transition name="dh-fade" mode="out-in">
      <!-- 未取到配置前显示占位，避免闪烁 -->
      <div v-if="!loaded" key="loading" class="dh-loading">
        <div class="dh-loading-inner">
          <span class="dh-spinner"></span>
          <p>数字人接入中…</p>
        </div>
      </div>

      <Live2dAvatar
        v-else-if="engine === 'live2d'"
        key="live2d"
        ref="childRef"
        :config="config"
        @ready="onReady"
        @error="onError"
      />

      <XfAvatar v-else key="xfyun" ref="childRef" :config="config" @ready="onReady" @error="onError" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import XfAvatar from './XfAvatar.vue'
  import Live2dAvatar from './Live2dAvatar.vue'
  import { fetchActiveDigitalHuman, type DigitalHumanConfig } from '@/api/digital-human'

  defineOptions({ name: 'DigitalHumanAvatar' })

  const emit = defineEmits<{
    (e: 'ready', config: DigitalHumanConfig | null): void
    (e: 'error', message: string): void
    (e: 'speak-end'): void
  }>()

  interface AvatarChild {
    speak: (text: string, emotion?: string) => Promise<boolean>
    enableAudio: () => void | Promise<void>
    interrupt: () => void | Promise<void>
  }

  const config = ref<DigitalHumanConfig | null>(null)
  const loaded = ref(false)
  const childRef = ref<AvatarChild | null>(null)

  const engine = computed(() => config.value?.engine || 'xfyun')

  function onReady() {
    emit('ready', config.value)
  }
  function onError(message: string) {
    emit('error', message)
  }

  // ---- 转发给当前引擎 ----
  async function speak(text: string, emotion?: string): Promise<boolean> {
    return (await childRef.value?.speak(text, emotion)) ?? false
  }
  function enableAudio() {
    return childRef.value?.enableAudio()
  }
  function interrupt() {
    return childRef.value?.interrupt()
  }

  defineExpose({ speak, enableAudio, interrupt, config })

  onMounted(async () => {
    try {
      config.value = await fetchActiveDigitalHuman()
    } catch {
      config.value = null
    } finally {
      loaded.value = true
    }
  })
</script>

<style scoped lang="scss">
  .dh-host {
    width: 100%;
    height: 100%;
  }

  .dh-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: linear-gradient(160deg, #0f3d3e 0%, #135158 55%, #1c6b6b 100%);
    border-radius: 12px;
  }

  .dh-loading-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgb(255 255 255 / 80%);
    font-size: 13px;
  }

  .dh-spinner {
    width: 26px;
    height: 26px;
    margin-bottom: 10px;
    border: 3px solid rgb(255 255 255 / 25%);
    border-top-color: #d4af37;
    border-radius: 50%;
    animation: dh-spin 0.8s linear infinite;
  }

  @keyframes dh-spin {
    to {
      transform: rotate(360deg);
    }
  }

  // 引擎切换时的淡入淡出
  .dh-fade-enter-active,
  .dh-fade-leave-active {
    transition: opacity 0.35s ease;
  }

  .dh-fade-enter-from,
  .dh-fade-leave-to {
    opacity: 0;
  }
</style>
