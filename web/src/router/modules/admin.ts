import { AppRouteRecord } from '@/types/router'

/**
 * 管理后台模块（运营与管理端）
 * 知识库管理、数字人配置、运营分析、会话与反馈。
 */
export const knowledgeRoutes: AppRouteRecord = {
  name: 'Knowledge',
  path: '/admin/knowledge',
  component: '/index/index',
  meta: { title: '知识库管理', icon: '&#xe6b2;', roles: ['R_SUPER'] },
  children: [
    {
      path: 'documents',
      name: 'KnowledgeDocuments',
      component: '/admin/knowledge/documents',
      meta: { title: '知识文档', keepAlive: true }
    },
    {
      path: 'spots',
      name: 'KnowledgeSpots',
      component: '/admin/knowledge/spots',
      meta: { title: '景点管理', keepAlive: true }
    },
    {
      path: 'faq',
      name: 'KnowledgeFaq',
      component: '/admin/knowledge/faq',
      meta: { title: '常见问答', keepAlive: true }
    },
    {
      path: 'search-test',
      name: 'KnowledgeSearchTest',
      component: '/admin/knowledge/search-test',
      meta: { title: '检索测试', keepAlive: false }
    }
  ]
}

export const digitalHumanRoutes: AppRouteRecord = {
  name: 'DigitalHumanAdmin',
  path: '/admin/digital-human',
  component: '/index/index',
  meta: { title: '数字人配置', icon: '&#xe73e;', roles: ['R_SUPER'] },
  children: [
    {
      path: 'config',
      name: 'DigitalHumanConfig',
      component: '/admin/digital-human/config',
      meta: { title: '形象与音色', keepAlive: true }
    }
  ]
}

export const analyticsRoutes: AppRouteRecord = {
  name: 'Analytics',
  path: '/admin/analytics',
  component: '/index/index',
  meta: { title: '运营分析', icon: '&#xe721;', roles: ['R_SUPER'] },
  children: [
    {
      path: 'dashboard',
      name: 'AnalyticsDashboard',
      component: '/admin/analytics/dashboard',
      meta: { title: '数据大屏', keepAlive: false }
    }
  ]
}

export const operationRoutes: AppRouteRecord = {
  name: 'Operation',
  path: '/admin/operation',
  component: '/index/index',
  meta: { title: '会话与反馈', icon: '&#xe70c;', roles: ['R_SUPER'] },
  children: [
    {
      path: 'conversations',
      name: 'OperationConversations',
      component: '/admin/operation/conversations',
      meta: { title: '会话记录', keepAlive: true }
    },
    {
      path: 'feedback',
      name: 'OperationFeedback',
      component: '/admin/operation/feedback',
      meta: { title: '反馈分析', keepAlive: true }
    },
    {
      path: 'service-quality',
      name: 'OperationServiceQuality',
      component: '/admin/operation/service-quality',
      meta: { title: '服务质量报告', keepAlive: false }
    }
  ]
}
