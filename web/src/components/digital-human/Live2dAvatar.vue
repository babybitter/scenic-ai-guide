<!--
  Live2D 数字人展示组件（讯飞数字人的本地兜底渲染）。
  在本地 canvas 上渲染 Live2D 模型，语音由后端 TTS 提供并实时驱动口型。
  对外暴露 speak()/enableAudio()/interrupt()，与讯飞组件接口一致，便于按引擎切换。
  加载失败时降级为静态形象 + 文本提示。
-->
<template>
  <div class="l2d-avatar" :class="`l2d-status-${live2d.status.value}`">
    <div class="l2d-stage">
      <!-- Live2D 渲染画布：用 v-show 保持挂载，确保初始化时能取到画布 -->
      <canvas id="live2dCanvas" class="l2d-canvas" v-show="isRendering"></canvas>

      <!-- 降级 / 加载态 -->
      <div v-if="!isRendering" class="l2d-fallback">
        <ElIcon class="l2d-fallback-icon" :size="46"><Avatar /></ElIcon>
        <p class="l2d-fallback-name">{{ config?.name || $t('app.avatarGuideName') }}</p>
        <p class="l2d-fallback-tip">{{ fallbackTip }}</p>
      </div>

      <!-- 状态标签 -->
      <div class="l2d-badge">
        <span class="l2d-dot" :class="`dot-${live2d.status.value}`"></span>
        {{ statusText }}
      </div>

      <!-- 音频解锁提示 -->
      <div
        v-if="isRendering && !live2d.audioReady.value"
        class="l2d-audio-mask"
        @click="enableAudio"
      >
        <ElButton type="primary" round :icon="Microphone">{{
          $t('app.avatarEnableAudio')
        }}</ElButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { Avatar, Microphone } from '@element-plus/icons-vue'
  import { useLive2dAvatar } from '@/composables/useLive2dAvatar'
  import type { DigitalHumanConfig } from '@/api/digital-human'

  defineOptions({ name: 'Live2dAvatar' })

  const { t } = useI18n()

  const props = defineProps<{ config: DigitalHumanConfig | null }>()
  const emit = defineEmits<{
    (e: 'ready', config: DigitalHumanConfig | null): void
    (e: 'error', message: string): void
  }>()

  const wrapperRef = ref<HTMLElement | null>(null)
  const config = computed(() => props.config)
  const live2d = useLive2dAvatar()

  const isRendering = computed(() => ['ready', 'speaking'].includes(live2d.status.value))

  const statusText = computed(() => {
    switch (live2d.status.value) {
      case 'connecting':
        return t('app.avatarLoading')
      case 'ready':
        return t('app.avatarOnline')
      case 'speaking':
        return t('app.avatarSpeaking')
      case 'error':
        return t('app.avatarTextMode')
      default:
        return t('app.avatarIdle')
    }
  })

  const fallbackTip = computed(() => {
    if (live2d.status.value === 'connecting') return t('app.avatarModelLoading')
    if (live2d.status.value === 'error')
      return live2d.errorMessage.value || t('app.guideUnavailable')
    return t('app.avatarPreparing')
  })

  function onWinResize() {
    live2d.onResize()
  }

  async function init() {
    if (
      config.value &&
      (config.value.serviceStatus === 'text_only' || !config.value.assetAvailable)
    ) {
      live2d.status.value = 'error'
      live2d.errorMessage.value = t('app.avatarTextOnly')
      emit('ready', config.value)
      return
    }
    const ok = await live2d.start({
      modelId: config.value?.modelId,
      vcn: config.value?.vcn,
      wrapper: wrapperRef.value as HTMLElement
    })
    if (ok) {
      emit('ready', config.value)
      window.addEventListener('resize', onWinResize)
    } else {
      emit('error', live2d.errorMessage.value)
    }
  }

  async function speak(text: string, emotion?: string): Promise<boolean> {
    return live2d.speak(text, { emotion })
  }
  function enableAudio() {
    return live2d.enableAudio()
  }
  function interrupt() {
    return live2d.interrupt()
  }

  defineExpose({
    speak,
    enableAudio,
    interrupt,
    status: live2d.status,
    audioReady: live2d.audioReady,
    config
  })

  onMounted(init)
  onBeforeUnmount(() => {
    window.removeEventListener('resize', onWinResize)
    live2d.destroy()
  })
</script>

<style scoped lang="scss">
  .l2d-avatar {
    width: 100%;
    height: 100%;
  }

  .l2d-stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: linear-gradient(160deg, #0f3d3e 0%, #135158 55%, #1c6b6b 100%);
    border-radius: 12px;
  }

  .l2d-canvas {
    width: 100%;
    height: 100%;
  }

  .l2d-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgb(255 255 255 / 88%);
    text-align: center;
  }

  .l2d-fallback-icon {
    margin-bottom: 12px;
    color: #d4af37;
  }

  .l2d-fallback-name {
    font-size: 16px;
    font-weight: 600;
  }

  .l2d-fallback-tip {
    margin-top: 6px;
    font-size: 12px;
    color: rgb(255 255 255 / 65%);
  }

  .l2d-audio-mask {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 24px;
    cursor: pointer;
    background: linear-gradient(to top, rgb(0 0 0 / 35%), transparent 40%);
  }

  .l2d-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    padding: 3px 10px;
    font-size: 12px;
    color: #fff;
    background: rgb(0 0 0 / 35%);
    border-radius: 999px;
  }

  .l2d-dot {
    width: 7px;
    height: 7px;
    margin-right: 6px;
    background: #909399;
    border-radius: 50%;

    &.dot-ready,
    &.dot-speaking {
      background: #3dcd9f;
    }

    &.dot-connecting {
      background: #e6a23c;
    }

    &.dot-error {
      background: #f56c6c;
    }
  }
</style>
