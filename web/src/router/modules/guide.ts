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
    title: 'app.navGuide',
    icon: 'ri:guide-line'
  },
  children: [
    {
      path: 'experience',
      name: 'GuideExperience',
      component: '/guide/experience',
      meta: {
        title: 'app.navGuideExperience',
        icon: 'ri:robot-2-line',
        keepAlive: false,
        fixedTab: true
      }
    }
  ]
}
