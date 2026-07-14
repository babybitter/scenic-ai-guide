import request from '@/utils/http'

/** 数字人配置（与后端 digital_human_configs 对应） */
export type DigitalHumanEngine = 'xfyun' | 'live2d'

export interface DigitalHumanConfig {
  id: string
  name: string
  /** 渲染引擎：xfyun=讯飞云端流，live2d=本地 Live2D 画布（互为兜底） */
  engine: DigitalHumanEngine
  avatarId: string
  vcn: string
  /** Live2D 模型（角色目录名），仅 engine=live2d 时使用 */
  modelId: string
  welcomeText: string
  speechRate: number
  emotionStyle: string
  serviceStatus: 'online' | 'maintenance' | 'text_only'
  enabled: boolean
  assetAvailable: boolean
  fallback?: { type: string; reason: string }
  updatedAt?: string
}

/** 获取当前启用的数字人配置（游客端使用） */
export function fetchActiveDigitalHuman() {
  return request.get<DigitalHumanConfig>({ url: '/api/digital-human/config' })
}

/** 获取全部数字人配置（管理端使用） */
export function fetchDigitalHumanConfigs() {
  return request.get<DigitalHumanConfig[]>({ url: '/api/digital-human/configs' })
}

/** 新增/更新数字人配置（管理端使用，需登录） */
export function saveDigitalHumanConfig(data: Partial<DigitalHumanConfig>) {
  return request.post<DigitalHumanConfig>({ url: '/api/digital-human/config', data })
}

/** 预热当前数字人资源 */
export function preloadDigitalHuman() {
  return request.post<{ ok: boolean; engine: DigitalHumanEngine; avatarId: string; modelId: string; vcn: string }>({
    url: '/api/digital-human/preload'
  })
}

/** 后端 TTS 合成结果（Live2D 数字人用它拿音频驱动口型） */
export interface TtsResult {
  segments: { audioUrl: string; mimeType?: string; text?: string }[]
  audioUrl: string | null
}

/**
 * 调用后端 TTS 合成语音。Live2D 引擎本地渲染没有云端音频，
 * 需要拿到音频片段再喂给 Live2D 做实时口型同步。
 */
export function synthesizeSpeech(data: { text: string; voice?: string; speed?: number }) {
  return request.post<TtsResult>({ url: '/api/voice/tts', data })
}
