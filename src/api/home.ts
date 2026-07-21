import { get } from '@/utils/request'

export const getBannerList = () => {
    return get('/indexImgs')
}
export const getNoticeList = () => {
    return get('/shop/notice/topNoticeList')
}
export const getProductGroups = () => {
    return get('/prod/tagProdList')
}