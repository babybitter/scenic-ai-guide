import { AppRouteRecord } from '@/types/router'
import { guideRoutes } from './guide'
import {
  knowledgeRoutes,
  digitalHumanRoutes,
  analyticsRoutes,
  operationRoutes,
  systemRoutes
} from './admin'

/**
 * 导出所有模块化路由
 * 游客导览（游客端） + 管理后台（知识库 / 数字人 / 分析 / 会话反馈 / 系统管理）。
 */
export const routeModules: AppRouteRecord[] = [
  guideRoutes,
  knowledgeRoutes,
  digitalHumanRoutes,
  analyticsRoutes,
  operationRoutes,
  systemRoutes
]
