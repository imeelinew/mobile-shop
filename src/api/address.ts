import { get, post, put, del } from '@/utils/request'

export const addAddress = (data: any) => {
    return post('/p/address/addAddr', data)
}

export const updateAddress = (data: any) => {
    return put('/p/address/updateAddr', data)
}

export const deleteAddress = (addrId: number) => {
    return del(`/p/address/deleteAddr/${addrId}`)
}

export const setDefaultAddress = (addrId: number) => {
    return put(`/p/address/defaultAddr/${addrId}`, {})
}

export const getAreaList = (pid: number) => {
    return get('/p/area/listByPid', { pid })
}
