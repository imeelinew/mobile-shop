import { get, post } from '@/utils/request';
export const addAddress = (data: any) => {
    return post('/p/address/addAddr', data)
}
export const getAreaList = (pid: number) => {
    return get('/p/area/listByPid', { pid })
}