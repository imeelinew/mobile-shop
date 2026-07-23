import { get, post } from '@/utils/request'

export const getProductDetail = (prodId: number) => {
    return get('/prod/prodInfo', {
        prodId
    })
}
export const getCollectionStatus = (prodId: number) => {
    return get('/p/user/collection/isCollection', {
        prodId
    })
}
export const toggleCollection = (prodId: number) => {
    return post('/p/user/collection/addOrCancel', prodId, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}