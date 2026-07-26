import { get, post } from '@/utils/request'

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
