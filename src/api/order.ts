import { get } from '@/utils/request'

export const getOrderCount = () => {
    return get('/p/myOrder/orderCount')
}