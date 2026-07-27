import { del, post } from '@/utils/request'

export const addCart = (data: any) => {
    return post('/p/shopCart/changeItem', data)
}

export const getCartInfo = () => {
    return post('/p/shopCart/info', {})
}
export const getCartTotal = (basketIds: number[]) => {
    return post('/p/shopCart/totalPay', basketIds)
}

export const deleteCartItem = (basketIds: number[]) => {
    return del('/p/shopCart/deleteItem', basketIds)
}