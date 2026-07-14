import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

/**
 * 获取菜单列表（后端权限模式使用）。
 * 本项目使用前端权限模式（VITE_ACCESS_MODE=frontend），菜单来自前端 asyncRoutes，
 * 因此该接口默认不会被调用，这里保留一个后端模式下的占位实现。
 */
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/menu/list'
  })
}
