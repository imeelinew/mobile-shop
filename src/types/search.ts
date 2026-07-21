export interface SearchParams {
    prodName: string,
    sort: number,
    orderBy: number,
    shopId: number,
    current?: number | string,
    size?: number | string,
}

export interface SearchProduct {
    prodId: number,
    pic: string,
    prodName: string,
    price: number,
    prodCommNumber: number,
    positiveRating: number,
    praiseNumber: number
}
export interface HotSearch {
    hotSearchId: number,
    title: string,
    content: string,
}