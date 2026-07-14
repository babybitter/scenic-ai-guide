import { AppRouteRecord } from '@/types/router'

/**
 * 游客导览模块（游客交互端）
 * 数字人导览、智能问答、语音交互、路线推荐等游客侧功能。
 */
export const guideRoutes: AppRouteRecord = {
  name: 'Guide',
  path: '/guide',
  component: '/index/index',
  meta: {
    title: '游客导览',
    icon: '&#xe6e1;'
  },
  children: [
    {
      path: 'experience',
      name: 'GuideExperience',
      component: '/guide/experience',
      meta: {
        title: 'AI 数字人导览',
        icon: '&#xe73e;',
        keepAlive: false,
        fixedTab: true
      }
    }
  ]
}
