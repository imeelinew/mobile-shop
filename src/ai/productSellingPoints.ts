import { tryAI } from './searchSuggestions'
export const getProductSellingPoints = async (data: any) => {
    const prodName = data.prodName || ''
    const price = data.price || 0
    const brief = data.brief || ''

    const prompt = `
你是电商卖点文案专家。

商品信息：
商品名称：${prodName}
商品价格：${price}元
商品描述：${brief}

请根据商品信息生成4条能吸引用户购买的商品卖点。

要求：
1. 每条15到20个字
2. 每条开头带一个合适的Emoji
3. 从品质、价格、功能、优势等不同角度分析
4. 卖点之间不能重复
5. 直接输出4行，每行一条
6. 不要编号，不要解释
  `.trim()
    console.log(prompt, 'prompt')
    const localSellingPoints = [
        '✅ 正品保障，品质可靠更放心',
        '🚚 现货速发，下单无需长久等待',
        '💎 精选品质，满足日常使用需求',
        '💰 价格实惠，轻松享受优质商品'
    ]
    const response = await tryAI('商品热点', prompt, () =>
        localSellingPoints
    )
    if (response.source === 'openai') {

        const splitedPoints = (response.result as string).split('\n')
        console.log(splitedPoints, '拆分后的卖点4条数据')
        return {
            result: splitedPoints,
            source: 'openai'
        }
    } else {
        return {
            result: localSellingPoints,
            source: 'fallback'
        }
    }
}