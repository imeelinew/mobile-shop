import { get, post, put } from '@/utils/request'

export const ORDER_STATUS = {
    pendingPayment: 1,
    pendingShipment: 2,
    pendingReceipt: 3,
    completed: 5,
    cancelled: 6,
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

export const getOrderCount = () => {
    return get('/p/myOrder/orderCount')
}

export const getAddressList = () => {
    return get('/p/address/list')
}

export const confirmOrder = (data: any) => {
    return post('/p/order/confirm', data)
}

export const submitOrder = (data: any, idempotencyKey: string) => {
    return post('/p/order/submit', data, {
        headers: {
            'Idempotency-Key': idempotencyKey,
        },
    })
}

export const getMyOrderInfo = (params: { status: OrderStatus; current: number; size?: number }) => {
    return get('/p/myOrder/myOrder', params)
}

export const payOrder = (data: { orderNumbers: string; payType: number }) => {
    return post('/p/order/pay', data)
}

export const cancelOrder = (orderNumber: string) => {
    return post('/p/order/cancel', { orderNumbers: orderNumber })
}

export const confirmReceipt = (orderNumber: string) => {
    return put(`/p/myOrder/receipt/${encodeURIComponent(orderNumber)}`)
}

export const shipOrder = (orderNumber: string) => {
    return post(`/admin/orders/${encodeURIComponent(orderNumber)}/ship`)
}
