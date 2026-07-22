import { get } from '@/utils/request'

export const getCategoryList = (parentId: number = 0) => {
    return get('/category/categoryInfo', {
        parentId
    })
}
export const getCategoryProducts = (categoryId: number) => { 
    return get('/prod/pageProd', {
        categoryId,
    })
}