<!--
  讯飞交互式虚拟人展示组件（云端流式数字人）。
  启动讯飞 WebRTC 流并对外暴露 speak()；凭证缺失 / 连接失败 / 纯文本模式时降级为静态形象。
  由 DigitalHumanAvatar 按后台配置的 engine 选择渲染；与 Live2dAvatar 接口一致。
-->
<template>
  <div class="dh-avatar" :class="`dh-status-${avatar.status.value}`">
    <div class="dh-stage">
      <!-- 讯飞虚拟人渲染容器 -->
      <div ref="wrapperRef" class="dh-wrapper" v-show="isStreaming"></div>

      <!-- 降级 / 加载态 -->
      <div v-if="!isStreaming" class="dh-fallback">
        <ElIcon class="dh-fallback-icon" :size="46"><Avatar /></ElIcon>
        <p class="dh-fallback-name">{{ config?.name || '灵山 AI 导游' }}</p>
        <p class="dh-fallback-tip">{{ fallbackTip }}</p>
      </div>

      <!-- 状态标签 -->
      <div class="dh-badge">
        <span class="dh-dot" :class="`dot-${avatar.status.value}`"></span>
        {{ statusText }}
      </div>

      <!-- 音频解锁提示：浏览器拦截自动播放时，点击开启声音 -->
      <div v-if="isStreaming && !avatar.audioReady.value" class="dh-audio-mask" @click="enableAudio">
        <ElButton type="primary" round :icon="Microphone">点击开启数字人声音</ElButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { Avatar, Microphone } from '@element-plus/icons-vue'
  import { useXfAvatar } from '@/composables/useXfAvatar'
  import type { DigitalHumanConfig } from '@/api/digital-human'

  defineOptions({ name: 'XfAvatar' })

  const props = defineProps<{ config: DigitalHumanConfig | null }>()
  const emit = defineEmits<{
    (e: 'ready', config: DigitalHumanConfig | null): void
    (e: 'error', message: string): void
  }>()

  const wrapperRef = ref<HTMLElement | null>(null)
  const config = computed(() => props.config)
  const avatar = useXfAvatar()

  const isStreaming = computed(() => ['ready', 'speaking'].includes(avatar.status.value))

  const statusText = computed(() => {
    switch (avatar.status.value) {
      case 'connecting':
        return '连接中'
      case 'ready':
        return '在线'
      case 'speaking':
        return '讲解中'
      case 'error':
        return '文本模式'
      default:
        return '待机'
    }
  })

  const fallbackTip = computed(() => {
    if (avatar.status.value === 'connecting') return '数字人正在接入…'
    if (avatar.status.value === 'error')
      return avatar.errorMessage.value || '数字人不可用，已切换为文本模式'
    if (config.value && config.value.serviceStatus === 'text_only') return '当前为纯文本讲解模式'
    return '数字人准备中…'
  })

  async function init() {
    // 纯文本模式或无可用形象：不启动流，直接降级
    if (config.value && (config.value.serviceStatus === 'text_only' || !config.value.assetAvailable)) {
      avatar.status.value = 'error'
      avatar.errorMessage.value = '当前为纯文本讲解模式'
      emit('ready', config.value)
      return
    }

    if (!wrapperRef.value) return
    const ok = await avatar.start({
      avatarId: config.value?.avatarId,
      vcn: config.value?.vcn,
      wrapper: wrapperRef.value
    })
    if (ok) {
      emit('ready', config.value)
    } else {
      emit('error', avatar.errorMessage.value)
    }
  }

  /** 供父组件调用：驱动数字人说话 */
  async function speak(text: string, emotion?: string): Promise<boolean> {
    return avatar.speak(text, { emotion })
  }

  /** 在用户手势中解锁音频 */
  function enableAudio() {
    return avatar.enableAudio()
  }

  function interrupt() {
    return avatar.interrupt()
  }

  defineExpose({ speak, enableAudio, interrupt, status: avatar.status, audioReady: avatar.audioReady, config })

  onMounted(init)
  onBeforeUnmount(() => avatar.destroy())
</script>

<style scoped lang="scss">
  .dh-avatar {
    width: 100%;
    height: 100%;
  }

  .dh-stage {
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

  .dh-wrapper {
    width: 100%;
    height: 100%;

    :deep(video),
    :deep(canvas) {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover;
    }
  }

  .dh-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgb(255 255 255 / 88%);
    text-align: center;
  }

  .dh-fallback-icon {
    margin-bottom: 12px;
    color: #d4af37;
  }

  .dh-fallback-name {
    font-size: 16px;
    font-weight: 600;
  }

  .dh-fallback-tip {
    margin-top: 6px;
    font-size: 12px;
    color: rgb(255 255 255 / 65%);
  }

  .dh-audio-mask {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 24px;
    cursor: pointer;
    background: linear-gradient(to top, rgb(0 0 0 / 35%), transparent 40%);
  }

  .dh-badge {
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

  .dh-dot {
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
