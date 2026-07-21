import request from '@/utils/request'

export const loginApi = (data) => {
    return request.post('/login', data)
}

export const registerApi = (data) => {
    return request.post('/user/register', data)
}