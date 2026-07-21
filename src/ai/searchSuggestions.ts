import { isAvailable, requestAI } from './providers/openai'

export type AISource = 'openai' | 'fallback'

export type AIResult<T> = {
  result: T
  source: AISource
  error?: string
}

export const SUGGEST_RULES: Record<string, string[]> = {
  鞋: ['运动鞋', '跑鞋', '板鞋', '帆布鞋', '篮球鞋'],
  手机: ['iPhone 15', '华为Mate 60', '小米14', 'OPPO Find X7', 'vivo X100'],
  水果: ['啤梨', '蓝莓', '车厘子', '猕猴桃', '苹果'],
  护肤: ['兰蔻小黑瓶', '雅诗兰黛', 'SK-II神仙水', '资生堂', '科颜氏'],
  数码: ['蓝牙耳机', '智能手表', '平板电脑', '充电宝', '数据线'],
  运动: ['阿迪达斯', '耐克跑鞋', '瑜伽垫', '运动T恤', '健身器材']
}

const getFallbackSuggestions = (keyword: string) => {
  const matched = Object.entries(SUGGEST_RULES).find(([rule]) =>
    keyword.includes(rule) || rule.includes(keyword)
  )
  return matched?.[1] || [
    `${keyword}热卖`,
    `${keyword}新品`,
    `${keyword}推荐`,
    `${keyword}优惠`,
    `${keyword}排行榜`
  ].map(item => item.slice(0, 10))
}

export const tryAI = async <T>(
  name: string,
  promptText: string,
  fallback: () => T
): Promise<AIResult<T | string>> => {
  if (!isAvailable()) {
    console.info(`AI ${name} 未配置，使用本地规则`)
    return { result: fallback(), source: 'fallback', error: 'AI 模型未配置' }
  }

  try {
    const { text } = await requestAI(promptText)
    console.info(`AI ${name} 生成成功`)
    return { result: text, source: 'openai' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 请求异常'
    console.warn(`AI ${name} 请求异常，使用本地规则：${message}`)
    return { result: fallback(), source: 'fallback', error: message }
  }
}

const parseSuggestions = (text: string) => text
  .split(/\r?\n|[,，]/)
  .map(item => item.replace(/^\s*(?:[-*•]|\d+[.、)])\s*/, '').trim())
  .filter(Boolean)
  .map(item => item.slice(0, 10))
  .slice(0, 5)

export const getSearchSuggestions = async (keyword: string): Promise<AIResult<string[]>> => {
  const word = keyword.trim()
  const response = await tryAI(
    '搜索联想',
    `你是电商搜索助手。用户正在搜索“${word}”，请返回5条相关的商品搜索建议。每条不超过10个字，每行一条，不要编号，不要解释。`,
    () => getFallbackSuggestions(word)
  )

  if (response.source === 'fallback') {
    return { ...response, result: response.result as string[] }
  }

  const suggestions = parseSuggestions(response.result as string)
  if (suggestions.length !== 5) {
    return {
      result: getFallbackSuggestions(word),
      source: 'fallback',
      error: 'AI 返回格式不正确'
    }
  }
  return { result: suggestions, source: 'openai' }
}
