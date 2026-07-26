import { tryAI } from './searchSuggestions'

const getCategorySellingPoints = (prodName: string) => {
    const points: string[] = []
    if (prodName.includes('手机') || prodName.includes('数码')) {
        points.push(
            '📱 强劲性能，日常使用流畅稳定',
            '🔋 超长续航，告别频繁充电烦恼',
            '📸 高清影像，轻松记录精彩瞬间',
            '✨ 精致设计，颜值与手感兼备',
        )
    }
    else if (prodName.includes('鞋') || prodName.includes('跑')) {
        points.push(
            '👟 轻盈舒适，长时间穿着不累脚',
            '🌬️ 透气设计，保持双脚清爽舒适',
            '🛡️ 稳定支撑，运动过程更加安心',
            '🎨 潮流外观，轻松搭配多种风格',
        )
    }
    return points
}
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
    // console.log(prompt, 'prompt')
    const localSellingPoints = [
        '✅ 正品保障，品质可靠更放心',
        '🚚 现货速发，下单无需长久等待',
        '💎 精选品质，满足日常使用需求',
    ]
    // const response = await tryAI('商品热点', prompt, () =>
    //     localSellingPoints
    // )

    const response = await tryAI('商品热点', prompt, () => {
        const res = getCategorySellingPoints(prodName)
        if (res.length > 0) {
            return res
        } else {
            return localSellingPoints
        }
    })
    if (response.source === 'openai') {

        const splitedPoints = (response.result as string).split('\n')
        // console.log(splitedPoints, '拆分后的卖点4条数据')
        return {
            result: splitedPoints,
            source: 'openai'
        }
    } else {
        return {
            result: response.result as string[],
            source: 'fallback',
        }
    }
}