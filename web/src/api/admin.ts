import request from '@/utils/http'
import type { ScenicSpot } from '@/api/guide'

/** 管理后台 API（知识库 / 景点 / FAQ / 分析 / 会话 / 反馈 / 服务质量） */

// ---- 知识库 ----
export interface KnowledgeSummary {
  status: string
  scope: string
  generatedAt: string
  documents: number
  spots: number
  guideSections: number
  chunks: number
}

export interface UploadRecord {
  id: string
  fileName: string
  mimeType: string
  size: number
  fileType: string
  status: string
  chunkCount: number
  createdAt: string
}

export function getKnowledgeSummary() {
  return request.get<KnowledgeSummary>({ url: '/api/knowledge/summary' })
}

export function rebuildKnowledge() {
  return request.post({ url: '/api/knowledge/rebuild' })
}

export function getUploads() {
  return request.get<UploadRecord[]>({ url: '/api/uploads' })
}

export function uploadDocument(data: {
  fileName: string
  mimeType: string
  contentBase64: string
}) {
  return request.post<UploadRecord>({ url: '/api/uploads', data })
}

export interface KnowledgeHit {
  id?: string
  title?: string
  content: string
  score?: number
  scenicSpotName?: string
  documentName?: string
}

export function searchKnowledge(data: { query: string; mode?: 'hybrid' | 'keyword' }) {
  return request.post<{ results: KnowledgeHit[] }>({ url: '/api/knowledge/search', data })
}

// ---- 景点管理 ----
export function getAdminSpots() {
  return request.get<ScenicSpot[]>({ url: '/api/admin/scenic-spots' })
}
export function createAdminSpot(data: Partial<ScenicSpot>) {
  return request.post<ScenicSpot>({ url: '/api/admin/scenic-spots', data })
}
export function updateAdminSpot(id: string, data: Partial<ScenicSpot>) {
  return request.put<ScenicSpot>({ url: `/api/admin/scenic-spots/${id}`, data })
}
export function deleteAdminSpot(id: string) {
  return request.del({ url: `/api/admin/scenic-spots/${id}` })
}

// ---- FAQ 管理 ----
export interface AdminFaq {
  id: string
  question: string
  answer: string
  keywords: string[]
  priority: number
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}
export function getAdminFaqs() {
  return request.get<AdminFaq[]>({ url: '/api/admin/faqs' })
}
export function createAdminFaq(data: Partial<AdminFaq>) {
  return request.post<AdminFaq>({ url: '/api/admin/faqs', data })
}
export function updateAdminFaq(id: string, data: Partial<AdminFaq>) {
  return request.put<AdminFaq>({ url: `/api/admin/faqs/${id}`, data })
}

// ---- 运营分析 ----
export interface DashboardData {
  source: string
  generatedAt: string
  filters: Record<string, unknown>
  metrics: {
    todayServiceCount: number
    weekServiceCount: number
    totalQuestions: number
    averageSatisfaction: number
    averageLatencyMs: number
    behaviorRows: number
  }
  hotQuestions: { label: string; value: number }[]
  spotFocus: { label: string; value: number }[]
  emotionTrend: { label: string; value: number }[]
  routePreference: { label: string; value: number }[]
  consumption: Record<string, number>
  persona: {
    ageBands: { label: string; value: number }[]
    genders: { label: string; value: number }[]
    groupSizes: { label: string; value: number }[]
  }
  stayRelation: unknown
  suggestions: string[]
}

export function getDashboard(params: Record<string, unknown> = {}) {
  return request.get<DashboardData>({ url: '/api/admin/analytics/dashboard', params })
}

export function importAnalytics() {
  return request.post({ url: '/api/admin/analytics/import' })
}

// ---- 演示数据 ----
export interface DemoDataCounts {
  visitorSessions: number
  messages: number
  feedback: number
  touristBehavior: number
  routeSelections: number
  messageAnnotations: number
  total: number
}

export interface DemoDataGenerationResult {
  batchId?: string
  generatedAt?: string
  counts?: Partial<DemoDataCounts>
}

export function generateDemoData() {
  return request.post<DemoDataGenerationResult>({
    url: '/api/admin/demo-data/generate',
    showErrorMessage: false
  })
}

// ---- 会话与反馈 ----
export interface ConversationSummary {
  sessionId: string
  startedAt: string
  updatedAt: string
  messageCount: number
  userQuestionCount: number
  averageRating: number | null
  lowSatisfaction: boolean
  mainFocus: string
  feedbackCount: number
}

export function getConversations(params: { lowSatisfactionOnly?: boolean } = {}) {
  return request.get<ConversationSummary[]>({ url: '/api/admin/conversations', params })
}

export function getConversationDetail(sessionId: string) {
  return request.get<{
    sessionId: string
    messages: any[]
    feedback: any[]
    summary: ConversationSummary
  }>({
    url: `/api/admin/conversations/${sessionId}`
  })
}

export function annotateMessage(messageId: string, data: { label: string; note?: string }) {
  return request.post({ url: `/api/admin/messages/${messageId}/annotation`, data })
}

export interface KnowledgeDraft {
  id: string
  title: string
  question: string
  suggestedAnswer: string
  sourceMessageId: string
  createdAt: string
}
export function createKnowledgeDraft(messageId: string) {
  return request.post<KnowledgeDraft>({ url: `/api/admin/messages/${messageId}/knowledge-draft` })
}

export interface FeedbackCluster {
  label: string
  count: number
  averageRating: number
  samples: { comment?: string; rating?: number; vote?: string }[]
}
export function getFeedbackClusters() {
  return request.get<FeedbackCluster[]>({ url: '/api/admin/feedback/clusters' })
}

export interface ServiceQualityReport {
  generatedAt: string
  conversationCount: number
  lowSatisfactionCount: number
  averageSatisfaction: number
  commonIssues: FeedbackCluster[]
  wrongAnswerCount: number
  optimizationSuggestions: string[]
}
export function getServiceQualityReport() {
  return request.get<ServiceQualityReport>({ url: '/api/admin/service-quality/report' })
}

// ---- 系统用户管理（产品闭环）----
export interface AdminUser {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'operator'
  status: 'active' | 'disabled'
  createdAt?: string
}
export function getAdminUsers() {
  return request.get<AdminUser[]>({ url: '/api/admin/users' })
}
export function createAdminUser2(data: {
  username: string
  password: string
  displayName?: string
  role?: string
}) {
  return request.post<AdminUser>({ url: '/api/admin/users', data })
}
export function updateAdminUser(id: string, data: Partial<AdminUser> & { password?: string }) {
  return request.put<AdminUser>({ url: `/api/admin/users/${id}`, data })
}
export function deleteAdminUser(id: string) {
  return request.del({ url: `/api/admin/users/${id}` })
}
