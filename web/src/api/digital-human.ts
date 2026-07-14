import request from '@/utils/http'

/** 数字人配置（与后端 digital_human_configs 对应） */
export interface DigitalHumanConfig {
  id: string
  name: string
  avatarId: string
  vcn: string
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
  return request.post<{ ok: boolean; avatarId: string; vcn: string }>({
    url: '/api/digital-human/preload'
  })
}
