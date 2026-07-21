type AIConfig = {
  apiKey: string
  baseURL: string
  model: string
}

type AIRequestOptions = {
  timeout?: number
  maxTokens?: number
  temperature?: number
}

const getConfig = (): AIConfig => ({
  apiKey: import.meta.env.VITE_AI_API_KEY?.trim() || '',
  baseURL: (import.meta.env.VITE_AI_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
  model: import.meta.env.VITE_AI_MODEL || 'deepseek-chat'
})

export const isAvailable = () => Boolean(getConfig().apiKey)

/**
 * OpenAI 兼容接口调用层。DeepSeek、通义等兼容服务只需更换三个环境变量。
 * 正式项目不要在浏览器中保存密钥，应改为请求自己的后端代理。
 */
export const requestAI = async (
  promptText: string,
  options: AIRequestOptions = {}
) => {
  const { apiKey, baseURL, model } = getConfig()
  if (!apiKey) throw new Error('AI 模型未配置')

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), options.timeout ?? 10_000)

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: promptText }],
        max_tokens: options.maxTokens ?? 200,
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
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) throw new Error('AI 返回内容为空')
    return { text }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI 请求超时')
    }
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}
