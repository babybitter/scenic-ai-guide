import request from '@/utils/http'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  // 后端登录接口字段为 username / password
  return request.post<Api.Auth.LoginResponse>({
    url: '/api/auth/login',
    data: {
      username: params.userName,
      password: params.password
    }
  })
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>({
    url: '/api/auth/me'
  })
}
