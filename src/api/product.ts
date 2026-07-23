import { get } from '@/utils/request'

export const getProductDetail = (prodId: number) => {
    return get('/prod/prodInfo', {
        prodId
    })
}