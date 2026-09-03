export type GuideProduct = {
  prodId: number
  prodName: string
  brief: string
  price: number
  oriPrice: number
  pic: string
  attributes: Record<string, string | number | boolean>
}

export type GuideRecommendation = {
  product: GuideProduct
  matched: string[]
  unmatched: string[]
  evidence: Array<{ requirement: string; source: string }>
}

export type GuideResult = {
  query: string
  source: 'ai' | 'rules'
  intent: {
    category: string | null
    budgetMax: number | null
    requirements: string[]
    exclusions: string[]
  }
  recommendations: GuideRecommendation[]
  relaxedConstraints: string[]
}
