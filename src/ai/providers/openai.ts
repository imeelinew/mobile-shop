import { apiUrl } from '@/config/api'
import { handleUnauthorized } from '@/utils/request'
import { getToken } from '@/utils/token'

type AIRequestOptions = {
  timeout?: number
  maxTokens?: number
  temperature?: number
  signal?: AbortSignal
}

export const isAvailable = () => true

/**
 * 客户端只访问本站后端代理，第三方模型密钥保留在服务端。
 */
export const requestAI = async (
  promptText: string,
  options: AIRequestOptions = {}
) => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), options.timeout ?? 10_000)
  const abortRequest = () => controller.abort()

  // 外部取消和超时共用同一个控制器，调用方不需要处理两套逻辑
  options.signal?.addEventListener('abort', abortRequest, { once: true })
  if (options.signal?.aborted) controller.abort()

  try {
    const token = getToken()
    const response = await fetch(apiUrl('/ai/chat'), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        promptText,
        maxTokens: options.maxTokens ?? 200,
        temperature: options.temperature ?? 0.7
      })
    })

    if (!response.ok) {
      const message: Record<number, string> = {
        401: '登录已失效，请重新登录',
        403: '当前账号无权使用 AI 服务',
        429: 'AI 请求过于频繁，请稍后重试',
        503: 'AI 服务暂不可用'
      }
      if (response.status === 401) void handleUnauthorized()
      throw new Error(message[response.status] || `AI 请求失败（${response.status}）`)
    }

    const data = await response.json()
    const text = data.text?.trim()
    if (!text) throw new Error('AI 返回内容为空')
    return { text }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (options.signal?.aborted) throw error
      throw new Error('AI 请求超时')
    }
    throw error
  } finally {
    window.clearTimeout(timer)
    options.signal?.removeEventListener('abort', abortRequest)
  }
}
