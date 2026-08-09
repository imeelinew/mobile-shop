import axios from 'axios'
import { getToken } from '@/utils/token'

const request = axios.create({
    baseURL: import.meta.env.VITE_APP_URL || '/api',
    timeout: 5000,
})
// 请求拦截器
request.interceptors.request.use(config => {
    const token = getToken()

    if (token) {
        config.headers.Authorization = token
    }

    return config
}, error => {
    return Promise.reject(error)
})

// 响应拦截器
request.interceptors.response.use(response => {
    return response.data
}, error => {
    return Promise.reject(error)
})

export const get = (
    url: string,
    params?: any,
): Promise<any> => {
    return request.get(url, { params })
}
export const post = (
    url: string,
    data?: any,
    config?: any
): Promise<any> => {
    return request.post(url, data, config)
}

export const put = (
    url: string,
    data?: any
): Promise<any> => {
    return request.put(url, data)
}

export const del = (
    url: string,
    data?: any
): Promise<any> => {
    if (data !== undefined) {
        return request.delete(url, { data })
    }
    return request.delete(url)
}
export default request
