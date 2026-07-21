import { get } from '@/utils/request'
import type { SearchParams } from '@/types/search'

export const searchProducts = (params: SearchParams) => {
    return get('/search/searchProdPage', params)
}
export const getHotSearches = () => {
    return get('/search/hotSearch', {
        number: 10,
        sort: 0
    })
}
