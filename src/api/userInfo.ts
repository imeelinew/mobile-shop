import request from '@/utils/request'

export type CurrentUser = {
    userId: number
    username: string
    role: 'user' | 'admin'
}

export const loginApi = (data: any): Promise<any> => {
    return request.post('/login', data)
}

export const registerApi = (data: any): Promise<any> => {
    return request.post('/user/register', data)
}

export const getCurrentUser = (): Promise<{ success: boolean; data: CurrentUser; msg?: string }> => {
    return request.get('/me')
}
