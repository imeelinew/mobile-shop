import { post } from '@/utils/request'

export const addCart = (data: any) => {
    return post('/p/shopCart/changeItem', data)
}

export const getCartInfo = () => {
    return post('/p/shopCart/info', {})
}
