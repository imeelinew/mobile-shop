import { get } from '@/utils/request'

export const goProductDetail = (prodId: number) => {
    return get('/prod/prodInfo', {
        prodId
    })
}