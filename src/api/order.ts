import { get, post, put } from '@/utils/request'

export const getOrderCount = () => {
    return get('/p/myOrder/orderCount')
}

export const getAddressList = () => {
    return get('/p/address/list')
}

export const confirmOrder = (data: any) => {
    return post('/p/order/confirm', data)
}

export const submitOrder = (data: any) => {
    return post('/p/order/submit', data)
}

export const getMyOrderInfo = (params: { status: number; current: number; size?: number }) => {
    return get('/p/myOrder/myOrder', params)
}

export const payOrder = (data: { orderNumbers: string; payType: number }) => {
    return post('/p/order/pay', data)
}

export const confirmReceipt = (orderNumber: string) => {
    return put(`/p/myOrder/receipt/${encodeURIComponent(orderNumber)}`)
}
