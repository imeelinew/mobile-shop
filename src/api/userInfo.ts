import request from '@/utils/request'

export const loginApi = (data: any): Promise<any> => {
    return request.post('/login', data)
}

export const registerApi = (data: any): Promise<any> => {
    return request.post('/user/register', data)
}
