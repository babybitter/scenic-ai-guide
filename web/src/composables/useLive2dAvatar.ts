/**
 * Live2D 数字人封装（讯飞云端数字人的本地兜底方案）。
 *
 * 与 useXfAvatar 暴露一致的接口（start/speak/enableAudio/interrupt/destroy +
 * 响应式状态），因此 DigitalHumanAvatar 可以按后台配置的 engine 无缝切换两种引擎。
 *
 * 与讯飞不同：讯飞是云端出声 + 云端口型；Live2D 在本地画布渲染，声音来自项目
 * 已有的后端 TTS 接口，取到音频后喂给 Live2dManager，由 AnalyserNode 实时分析
 * 振幅驱动口型（见 live2dManager.getCurrentRms）。移植自 awesome-digital-human-live2d。
 */
import { ref } from 'vue'
import { LAppDelegate } from '@/lib/live2d/src/lappdelegate'
import * as LAppDefine from '@/lib/live2d/src/lappdefine'
import { Live2dManager } from '@/lib/live2d/live2dManager'
import { synthesizeSpeech } from '@/api/digital-human'

export type AvatarStatus = 'idle' | 'connecting' | 'ready' | 'speaking' | 'error'

export interface Live2dStartOptions {
  /** Live2D 模型（角色目录名，如 Haru），来自后台数字人配置 */
  modelId?: string
  /** 口型驱动用的 TTS 音色（vcn），来自后台数字人配置 */
  vcn?: string
  /** 渲染容器 */
  wrapper: HTMLElement
}

const CANVAS_ID = 'live2dCanvas'
const BASE = (import.meta.env.VITE_BASE_URL as string) || '/'
const CORE_SCRIPT = `${BASE}live2d/core/live2dcubismcore.min.js`.replace(/\/{2,}/g, '/')

/** 只加载一次 Cubism 核心运行时（挂到 window.Live2DCubismCore 全局） */
let corePromise: Promise<void> | null = null
function loadCubismCore(): Promise<void> {
  if ((window as any).Live2DCubismCore) return Promise.resolve()
  if (corePromise) return corePromise
  corePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CORE_SCRIPT
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Live2D 核心运行时加载失败'))
    document.head.appendChild(script)
  })
  return corePromise
}

export function useLive2dAvatar() {
  const status = ref<AvatarStatus>('idle')
  const errorMessage = ref('')
  // 与讯飞对齐：浏览器自动播放策略会挂起 AudioContext，需用户手势恢复
  const audioReady = ref(false)

  let currentVcn = ''
  let doneTimer: number | null = null
  let initialized = false

  /** Live2D 属于本地资源，无需云端凭证 */
  const hasCredentials = true

  async function start(options: Live2dStartOptions): Promise<boolean> {
    try {
      status.value = 'connecting'
      errorMessage.value = ''
      currentVcn = options.vcn || ''

      await loadCubismCore()

      // 画布必须存在于 DOM 中（LAppDelegate 通过 id 获取），由组件负责渲染
      const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null
      if (!canvas) {
        throw new Error('Live2D 画布未就绪')
      }

      if (LAppDelegate.getInstance().initialize() === false) {
        throw new Error('Live2D 初始化失败（WebGL 不可用？）')
      }
      LAppDelegate.getInstance().run()
      initialized = true

      // 加载模型
      const model = options.modelId || 'Haru'
      const link = `${BASE}live2d/characters/${model}/${model}.model3.json`.replace(/([^:])\/{2,}/g, '$1/')
      Live2dManager.getInstance().changeCharacter({ resource_id: model, name: model, link })

      const ok = await waitReady()
      if (!ok) throw new Error('Live2D 模型加载超时')

      status.value = 'ready'
      // AudioContext 若被挂起，标记为需用户手势解锁
      audioReady.value = true
      return true
    } catch (err) {
      status.value = 'error'
      errorMessage.value = normalizeError(err)
      return false
    }
  }

  function waitReady(timeoutMs = 15000): Promise<boolean> {
    return new Promise((resolve) => {
      const started = Date.now()
      const check = () => {
        if (Live2dManager.getInstance().isReady()) return resolve(true)
        if (Date.now() - started > timeoutMs) return resolve(false)
        window.setTimeout(check, 200)
      }
      check()
    })
  }

  /** 驱动数字人说话：后端 TTS 取音频 -> 入队 -> AnalyserNode 驱动口型 */
  async function speak(text: string, _opts: { emotion?: string } = {}): Promise<boolean> {
    const content = String(text || '').trim()
    if (!content || status.value === 'error' || status.value === 'idle') return false
    try {
      const result = await synthesizeSpeech({ text: content, voice: currentVcn })
      const urls = (result.segments || []).map((s) => s.audioUrl).filter(Boolean)
      if (!urls.length && result.audioUrl) urls.push(result.audioUrl)
      if (!urls.length) return false

      status.value = 'speaking'
      // 恢复可能被挂起的音频上下文（首帧前尽力，失败则等用户手势）
      await Live2dManager.getInstance().resume().catch(() => {})

      // 顺序拉取音频片段入队（按句播报，口型连贯）
      for (const url of urls) {
        const buffer = await fetchAudio(url)
        if (buffer) Live2dManager.getInstance().pushAudioQueue(buffer)
      }
      watchSpeakingEnd()
      return true
    } catch (err) {
      errorMessage.value = normalizeError(err)
      return false
    }
  }

  async function fetchAudio(url: string): Promise<ArrayBuffer | null> {
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      return await res.arrayBuffer()
    } catch {
      return null
    }
  }

  // 队列播完且没有正在播放的音频时，回到 ready 状态
  function watchSpeakingEnd() {
    if (doneTimer) window.clearInterval(doneTimer)
    doneTimer = window.setInterval(() => {
      const mgr = Live2dManager.getInstance()
      if (!mgr.isAudioPlaying() && !mgr.hasQueuedAudio()) {
        if (status.value === 'speaking') status.value = 'ready'
        if (doneTimer) window.clearInterval(doneTimer)
        doneTimer = null
      }
    }, 250)
  }

  /** 用户手势中恢复音频上下文 */
  async function enableAudio(): Promise<void> {
    try {
      await Live2dManager.getInstance().resume()
      audioReady.value = true
    } catch {
      /* 仍被拦截，等待下一次用户手势 */
    }
  }

  /** 打断当前播报 */
  async function interrupt(): Promise<void> {
    Live2dManager.getInstance().stopAudio()
    if (doneTimer) {
      window.clearInterval(doneTimer)
      doneTimer = null
    }
    if (status.value === 'speaking') status.value = 'ready'
  }

  function destroy(): void {
    if (doneTimer) {
      window.clearInterval(doneTimer)
      doneTimer = null
    }
    try {
      Live2dManager.getInstance().stopAudio()
    } catch {
      /* ignore */
    }
    if (initialized) {
      try {
        LAppDelegate.releaseInstance()
      } catch {
        /* ignore */
      }
      initialized = false
    }
    status.value = 'idle'
  }

  // 供组件在 window resize 时调用（画布自适应）
  function onResize(): void {
    if (initialized && LAppDefine.CanvasSize === 'auto') {
      LAppDelegate.getInstance().onResize()
    }
  }

  return { status, errorMessage, audioReady, hasCredentials, start, speak, enableAudio, interrupt, destroy, onResize }
}

function normalizeError(err: unknown): string {
  if (!err) return 'Live2D 数字人异常'
  if (typeof err === 'string') return err
  const anyErr = err as { message?: string }
  return anyErr.message || 'Live2D 数字人异常'
}
