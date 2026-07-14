/**
 * API 响应类型定义模块
 *
 * 提供统一的 API 响应结构类型定义
 *
 * ## 主要功能
 *
 * - 基础响应结构定义
 * - 泛型支持（适配不同数据类型）
 * - 统一的响应格式约束
 *
 * ## 使用场景
 *
 * - API 请求响应类型约束
 * - 接口数据类型定义
 * - 响应数据解析
 *
 * @module types/common/response
 * @author Art Design Pro Team
 */

/** 基础 API 响应结构（与 Node 后端统一信封一致） */
export interface BaseResponse<T = unknown> {
  /** 是否成功 */
  success: boolean
  /** 数据 */
  data: T
  /** 附加元信息（分页、耗时、提示语等） */
  meta?: Record<string, unknown> & { message?: string }
  /** 失败时的错误信息 */
  error?: {
    code: string
    message: string
    details?: unknown
  }
}
