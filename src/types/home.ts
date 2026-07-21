export interface Banner {
    imgUrl: string,
    relation: number,
    seq: number,
    type: number,
    uploadTime: string,
}
export interface Notice {
    id: number,
    shopId: number,
    title: string,
    content: string,
    publishTime: string,
}
export interface Product {
    prodId: number
    prodName: string
    price: number
    pic: string
    brief?: string | null
}

export interface ProductGroup {
    id: number
    title: string
    seq: string
    style: string
    productDtoList: Product[]
}