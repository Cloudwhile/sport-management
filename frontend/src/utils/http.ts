import axios, { AxiosError } from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// 创建 Axios 实例
const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('auth_token')

    // 如果 token 存在，添加到请求头
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 开发环境打印请求日志
    if (import.meta.env.DEV) {
      console.log('[HTTP Request]', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params
      })
    }

    return config
  },
  (error: AxiosError) => {
    console.error('[HTTP Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => {
    // 开发环境打印响应日志
    if (import.meta.env.DEV) {
      console.log('[HTTP Response]', {
        url: response.config.url,
        status: response.status,
        data: response.data
      })
    }

    // 处理后端统一响应格式 { success, data, pagination?, message? }
    const result = response.data

    // 如果有 pagination 字段，将其展平到顶层
    if (result.pagination) {
      return {
        data: result.data,
        ...result.pagination
      }
    }

    // 如果有 data 字段，直接返回 data
    if (result.data !== undefined) {
      return result.data
    }

    // 否则返回原始数据
    return result
  },
  (error: AxiosError<{ message?: string }>) => {
    console.error('[HTTP Response Error]', error)

    // 网络错误（没有 response）
    if (!error.response) {
      console.error('网络连接失败，请检查网络设置')
      return Promise.reject(new Error('网络连接失败，请检查网络设置'))
    }

    const { status, data } = error.response

    // 根据不同的状态码进行处理
    switch (status) {
      case 401:
        // Token 过期或无效，清除 token 并跳转到登录页
        console.warn('认证失败，请重新登录')
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
        break

      case 403:
        // 权限不足
        console.error('权限不足，无法访问该资源')
        return Promise.reject(new Error('权限不足，无法访问该资源'))

      case 500:
        // 服务器错误
        console.error('服务器错误，请稍后重试')
        return Promise.reject(new Error('服务器错误，请稍后重试'))

      default:
        // 其他错误，显示后端返回的错误消息
        const errorMessage = data?.message || `请求失败 (${status})`
        console.error(errorMessage)
        return Promise.reject(new Error(errorMessage))
    }

    return Promise.reject(error)
  }
)

export default http
