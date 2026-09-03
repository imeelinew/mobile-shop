type AIRequestOptions = {
  timeout?: number
  maxTokens?: number
  temperature?: number
  signal?: AbortSignal
}

export const isAvailable = () => true

/**
 * OpenAI 兼容接口调用层。GLM 等兼容服务只需更换环境变量。
 * 正式项目不要在浏览器中保存密钥，应改为请求自己的后端代理。
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
    const apiBaseUrl = import.meta.env.VITE_APP_URL || 'https://api-qg.107.173.35.208.nip.io'
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/ai/chat`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        promptText,
        maxTokens: options.maxTokens ?? 200,
        temperature: options.temperature ?? 0.7
      })
    })

    if (!response.ok) {
      const message: Record<number, string> = {
        401: 'AI 密钥无效',
        402: 'AI 账户余额不足',
        403: 'AI 服务拒绝访问'
      }
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
