const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_AI_MODEL = 'deepseek-chat'

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  }
})

export async function onRequestPost({ request, env }) {
  const requestOrigin = request.headers.get('Origin')
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return json({ error: '不允许跨站调用' }, 403)
  }

  if (!env.AI_API_KEY) {
    return json({ error: 'AI 模型未配置' }, 503)
  }

  let payload
  try {
    payload = await request.json()
  } catch {
    return json({ error: '请求格式错误' }, 400)
  }

  const promptText = typeof payload.promptText === 'string' ? payload.promptText.trim() : ''
  if (!promptText || promptText.length > 1200) {
    return json({ error: '提示词长度不符合要求' }, 400)
  }

  const maxTokens = Math.min(Math.max(Number(payload.maxTokens) || 200, 1), 300)
  const temperature = Math.min(Math.max(Number(payload.temperature) || 0.7, 0), 1)
  const baseUrl = (env.AI_BASE_URL || DEFAULT_AI_BASE_URL).replace(/\/$/, '')
  const model = env.AI_MODEL || DEFAULT_AI_MODEL

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.AI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: promptText }],
      max_tokens: maxTokens,
      temperature
    })
  })

  if (!response.ok) {
    const messages = {
      401: 'AI 密钥无效',
      402: 'AI 账户余额不足',
      403: 'AI 服务拒绝访问'
    }
    return json({ error: messages[response.status] || `AI 请求失败（${response.status}）` }, response.status)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) {
    return json({ error: 'AI 返回内容为空' }, 502)
  }

  return json({ text })
}

export function onRequest() {
  return json({ error: 'Method Not Allowed' }, 405)
}
