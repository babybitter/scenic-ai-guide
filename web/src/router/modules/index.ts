import { AppRouteRecord } from '@/types/router'
import { guideRoutes } from './guide'

/**
 * 导出所有模块化路由
 * 游客导览与管理后台模块。管理后台模块在后续阶段逐步加入。
 */
export const routeModules: AppRouteRecord[] = [guideRoutes]
