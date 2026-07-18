import request from '@/utils/http'

/** 游客交互端 API（问答 / 讲解 / 景点 / 路线 / 反馈 / 语音 / 会话） */

export interface ChatSource {
  documentName?: string
  sectionTitle?: string
  scenicSpotName?: string
}

export interface DigitalHumanHint {
  expression: string
  action: string
  state: string
  ttsEmotion?: string
}

export interface ChatLatency {
  totalMs: number
  retrievalMs?: number
  llmMs?: number
  cached?: boolean
}

export interface ChatAnswer {
  answer: string
  mode?: string
  locale?: string
  scenario?: string
  label?: string
  emotion?: string
  sources?: ChatSource[]
  digitalHuman?: DigitalHumanHint
  cached?: boolean
  latency?: ChatLatency
}

export interface ScenicSpot {
  id: string
  scenicArea: string
  name: string
  aliases: string[]
  locationText: string
  parameters: string
  coreFunction: string
  culture: string
  detail: string
  highlights: string
  openInfo: string
  notes: string
}

export interface RouteNode {
  id: string
  name: string
  spotId: string | null
  order: number
  minutes: number
  tags: string[]
  step?: number
}

export interface RouteRecommendation {
  id: string
  name: string
  routeType: string
  durationMinutes: number
  tags: string[]
  suitableFor: string[]
  nodes: RouteNode[]
  reason?: string
  explanation: string
}

export interface RouteRecommendResult {
  preferences: Record<string, unknown>
  recommendation: RouteRecommendation
  alternatives: RouteRecommendation[]
  message: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  intentLabel?: string | null
  emotionLabel?: string | null
  createdAt: string
}

export function createVisitorSession() {
  return request.post<{ id: string; createdAt: string }>({ url: '/api/visitor/session' })
}

export function askQuestion(data: {
  question: string
  sessionId?: string
  mode?: string
  locale?: string
}) {
  return request.post<ChatAnswer>({ url: '/api/chat/ask', data })
}

export function narrateSpot(data: { spotId?: string; spotName?: string }) {
  return request.post<{
    spotId: string
    spotName: string
    narration: string
    citations?: ChatSource[]
  }>({
    url: '/api/chat/narrate',
    data
  })
}

export function fetchScenicSpots() {
  return request.get<ScenicSpot[]>({ url: '/api/scenic-spots' })
}

export function recommendRoute(data: Record<string, unknown>) {
  return request.post<RouteRecommendResult>({ url: '/api/routes/recommend', data })
}

export function saveRoute(data: {
  sessionId?: string
  routeId?: string
  route?: unknown
  preferences?: unknown
}) {
  return request.post({ url: '/api/routes/save', data })
}

export function narrateRouteNode(data: { nodeId?: string; spotId?: string; spotName?: string }) {
  return request.post<{ spotName: string; narration: string }>({
    url: '/api/routes/node/narrate',
    data
  })
}

export function submitFeedback(data: {
  sessionId?: string
  messageId?: string
  rating?: number
  vote?: 'up' | 'down'
  emotion?: string
  comment?: string
}) {
  return request.post({ url: '/api/feedback', data })
}

export function fetchHistory(sessionId: string) {
  return request.get<ChatMessage[]>({ url: '/api/chat/history', params: { sessionId } })
}

export function clearChatHistory(sessionId: string) {
  return request.del<{ sessionId: string; deleted: number }>({
    url: '/api/chat/history',
    params: { sessionId }
  })
}

export interface VoiceAskResult {
  transcript: string
  asr?: unknown
  answer: ChatAnswer
  tts?: { segments?: { audioUrl: string }[] }
  latency?: ChatLatency
}

export function voiceAsk(data: {
  transcript?: string
  audioBase64?: string
  mimeType?: string
  sessionId?: string
  locale?: string
}) {
  return request.post<VoiceAskResult>({ url: '/api/voice/ask', data })
}
