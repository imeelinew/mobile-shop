import { post } from '@/utils/request'
import type { GuideResult } from '@/types/guide'

export const getGuideRecommendations = (query: string): Promise<{
  success: boolean
  msg?: string
  data: GuideResult
}> => post('/guide/recommend', { query })
