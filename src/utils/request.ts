import axios from 'axios'
import { getToken, removeToken } from '@/utils/token'

const UNAUTHORIZED_CODE = 'A00004'
let redirectingToLogin = false

const handleUnauthorized = async () => {
    removeToken()

    if (redirectingToLogin || ['/login', '/register'].includes(window.location.pathname)) {
        return
    }

    redirectingToLogin = true
    const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`

    try {
        const { default: router } = await import('@/router')
        await router.replace({
            path: '/login',
            query: { redirect },
        })
    } finally {
        redirectingToLogin = false
    }
}

const request = axios.create({
    baseURL: import.meta.env.VITE_APP_URL || 'https://api-qg.107.173.35.208.nip.io',
    timeout: 5000,
})
// 请求拦截器
request.interceptors.request.use(config => {
    const token = getToken()

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
}, error => {
    return Promise.reject(error)
})

// 响应拦截器
request.interceptors.response.use(response => {
    if (response.data?.code === UNAUTHORIZED_CODE) {
        void handleUnauthorized()
        return Promise.reject(new Error(response.data.msg || '登录已失效'))
    }

    return response.data
}, error => {
    if (error.response?.status === 401) {
        void handleUnauthorized()
    }

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
