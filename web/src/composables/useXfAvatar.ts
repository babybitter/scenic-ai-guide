/**
 * 讯飞交互式虚拟人（数字人）SDK 封装
 *
 * 负责实例化 AvatarPlatform、设置账号与全局参数、启动 WebRTC 流、
 * 通过 writeText 驱动数字人说话（云端完成 TTS + 口型 + 表情），
 * 并对外暴露响应式状态与方法。账号凭证来自环境变量，形象与音色由后台配置下发。
 */
import { ref, shallowRef } from 'vue'
// SDK 以预编译 ESM 形式提供，附带 index.d.ts 类型声明
import AvatarPlatform, { SDKEvents } from '@/vm-sdk/avatar-sdk-web_3.1.1.1011/index.js'

export type AvatarStatus = 'idle' | 'connecting' | 'ready' | 'speaking' | 'error'

export interface AvatarStartOptions {
  /** 形象资源 id（来自后台数字人配置） */
  avatarId?: string
  /** 音色 vcn（来自后台数字人配置） */
  vcn?: string
  /** 数字人渲染容器 */
  wrapper: HTMLElement
}

/** 情感风格 -> 讯飞超拟人音色情感系数（仅超拟人音色支持） */
const EMOTION_CODE: Record<string, number> = {
  neutral: 10, // 亲切温柔（导游默认）
  warm: 10,
  gentle: 10,
  happy: 14, // 积极正向
  sorry: 10,
  serious: 13
}

function emotionCode(emotion?: string): number {
  return (emotion && EMOTION_CODE[emotion]) || 10
}

export function useXfAvatar() {
  const status = ref<AvatarStatus>('idle')
  const errorMessage = ref('')
  const platform = shallowRef<InstanceType<typeof AvatarPlatform> | null>(null)

  const env = import.meta.env
  const apiInfo = {
    appId: env.VITE_XF_AVATAR_APPID,
    apiKey: env.VITE_XF_AVATAR_APIKEY,
    apiSecret: env.VITE_XF_AVATAR_APISECRET,
    serverUrl: env.VITE_XF_AVATAR_SERVERURL || 'wss://avatar.cn-huadong-1.xf-yun.com/v1/interact'
  } as Record<string, string>

  const hasCredentials = Boolean(apiInfo.appId && apiInfo.apiKey && apiInfo.apiSecret)

  function buildGlobalParams(avatarId: string, vcn: string) {
    const params: Record<string, unknown> = {
      stream: { protocol: 'xrtc', fps: 25, bitrate: 1000000, alpha: 0 },
      avatar: {
        avatar_id: avatarId || env.VITE_XF_AVATAR_ID || 'cnr5dg8n2000000003',
        width: 1080,
        height: 960,
        mask_region: '[0,0,1080,1080]',
        scale: 1,
        move_h: 0,
        move_v: 0,
        audio_format: 1
      },
      tts: {
        vcn: vcn || env.VITE_XF_AVATAR_VCN || 'x5_lingxiaoyue_flow',
        speed: 50,
        pitch: 50,
        volume: 100,
        emotion: 10
      },
      avatar_dispatch: { interactive_mode: 1 },
      subtitle: { subtitle: 0 }
    }
    // 可选背景（交互平台素材管理中的 res_key）
    if (env.VITE_XF_AVATAR_RESKEY) {
      params.enable = true
      params.background = { type: 'res_key', data: env.VITE_XF_AVATAR_RESKEY }
    }
    return params
  }

  async function start(options: AvatarStartOptions): Promise<boolean> {
    if (!hasCredentials) {
      status.value = 'error'
      errorMessage.value = '未配置数字人账号凭证，已切换为纯文本模式。'
      return false
    }
    try {
      status.value = 'connecting'
      errorMessage.value = ''
      const ap = new AvatarPlatform()
      platform.value = ap

      const info: Record<string, string> = { ...apiInfo }
      if (env.VITE_XF_AVATAR_SCENEID) info.sceneId = env.VITE_XF_AVATAR_SCENEID
      ap.setApiInfo(info as never)
      ap.setGlobalParams(buildGlobalParams(options.avatarId || '', options.vcn || '') as never)

      ap.on(SDKEvents.frame_stop, () => {
        if (status.value === 'speaking') status.value = 'ready'
      })
      ap.on(SDKEvents.error, (err: unknown) => {
        status.value = 'error'
        errorMessage.value = normalizeError(err)
      })
      ap.on(SDKEvents.disconnected, () => {
        if (status.value !== 'error') status.value = 'idle'
      })

      await ap.start({ wrapper: options.wrapper as HTMLDivElement })
      status.value = 'ready'
      return true
    } catch (err) {
      status.value = 'error'
      errorMessage.value = normalizeError(err)
      return false
    }
  }

  /** 驱动数字人说话；返回是否成功下发 */
  async function speak(text: string, opts: { emotion?: string } = {}): Promise<boolean> {
    const ap = platform.value
    const content = String(text || '').trim()
    if (!ap || !content || status.value === 'error' || status.value === 'idle') {
      return false
    }
    try {
      status.value = 'speaking'
      await ap.writeText(content, {
        nlp: false,
        tts: { emotion: emotionCode(opts.emotion), volume: 100 }
      } as never)
      return true
    } catch (err) {
      errorMessage.value = normalizeError(err)
      return false
    }
  }

  /** 打断当前播报 */
  async function interrupt(): Promise<void> {
    try {
      await platform.value?.interrupt?.()
    } catch {
      // 忽略打断异常
    }
    if (status.value === 'speaking') status.value = 'ready'
  }

  function destroy(): void {
    try {
      platform.value?.destroy?.()
    } catch {
      // 忽略销毁异常
    }
    platform.value = null
    status.value = 'idle'
  }

  return { status, errorMessage, hasCredentials, start, speak, interrupt, destroy }
}

function normalizeError(err: unknown): string {
  if (!err) return '数字人服务异常'
  if (typeof err === 'string') return err
  const anyErr = err as { message?: string; code?: string | number }
  return anyErr.message || (anyErr.code ? `数字人错误(${anyErr.code})` : '数字人服务异常')
}
