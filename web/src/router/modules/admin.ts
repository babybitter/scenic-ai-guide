import { AppRouteRecord } from '@/types/router'

/**
 * 管理后台模块（运营与管理端）
 * 知识库管理、数字人配置、运营分析、会话与反馈。
 */
export const knowledgeRoutes: AppRouteRecord = {
  name: 'Knowledge',
  path: '/admin/knowledge',
  component: '/index/index',
  meta: { title: 'app.navKnowledge', icon: 'ri:book-open-line', roles: ['R_SUPER'] },
  children: [
    {
      path: 'documents',
      name: 'KnowledgeDocuments',
      component: '/admin/knowledge/documents',
      meta: { title: 'app.navDocuments', icon: 'ri:file-text-line', keepAlive: true }
    },
    {
      path: 'spots',
      name: 'KnowledgeSpots',
      component: '/admin/knowledge/spots',
      meta: { title: 'app.navSpots', icon: 'ri:map-pin-line', keepAlive: true }
    },
    {
      path: 'faq',
      name: 'KnowledgeFaq',
      component: '/admin/knowledge/faq',
      meta: { title: 'app.navFaq', icon: 'ri:question-answer-line', keepAlive: true }
    },
    {
      path: 'search-test',
      name: 'KnowledgeSearchTest',
      component: '/admin/knowledge/search-test',
      meta: { title: 'app.navSearchTest', icon: 'ri:search-eye-line', keepAlive: false }
    }
  ]
}

export const digitalHumanRoutes: AppRouteRecord = {
  name: 'DigitalHumanAdmin',
  path: '/admin/digital-human',
  component: '/index/index',
  meta: { title: 'app.navDigitalHuman', icon: 'ri:robot-2-line', roles: ['R_SUPER'] },
  children: [
    {
      path: 'config',
      name: 'DigitalHumanConfig',
      component: '/admin/digital-human/config',
      meta: { title: 'app.navAppearanceVoice', icon: 'ri:voiceprint-line', keepAlive: true }
    }
  ]
}

export const analyticsRoutes: AppRouteRecord = {
  name: 'Analytics',
  path: '/admin/analytics',
  component: '/index/index',
  meta: { title: 'app.navAnalytics', icon: 'ri:bar-chart-box-line', roles: ['R_SUPER'] },
  children: [
    {
      path: 'dashboard',
      name: 'AnalyticsDashboard',
      component: '/admin/analytics/dashboard',
      meta: { title: 'app.navDashboard', icon: 'ri:dashboard-line', keepAlive: false }
    }
  ]
}

export const systemRoutes: AppRouteRecord = {
  name: 'System',
  path: '/admin/system',
  component: '/index/index',
  meta: { title: 'app.navSystem', icon: 'ri:settings-3-line', roles: ['R_SUPER'] },
  children: [
    {
      path: 'users',
      name: 'SystemUsers',
      component: '/admin/system/users',
      meta: { title: 'app.navUsers', icon: 'ri:user-settings-line', keepAlive: true }
    }
  ]
}

export const operationRoutes: AppRouteRecord = {
  name: 'Operation',
  path: '/admin/operation',
  component: '/index/index',
  meta: { title: 'app.navOperation', icon: 'ri:chat-check-line', roles: ['R_SUPER'] },
  children: [
    {
      path: 'conversations',
      name: 'OperationConversations',
      component: '/admin/operation/conversations',
      meta: { title: 'app.navConversations', icon: 'ri:chat-history-line', keepAlive: true }
    },
    {
      path: 'feedback',
      name: 'OperationFeedback',
      component: '/admin/operation/feedback',
      meta: { title: 'app.navFeedback', icon: 'ri:feedback-line', keepAlive: true }
    },
    {
      path: 'service-quality',
      name: 'OperationServiceQuality',
      component: '/admin/operation/service-quality',
      meta: { title: 'app.navServiceQuality', icon: 'ri:file-chart-line', keepAlive: false }
    }
  ]
}
