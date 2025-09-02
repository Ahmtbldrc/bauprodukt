export interface Brand {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parent_id?: string | null
  emoji?: string
  icon_url?: string | null
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number // For discounted products
  image?: string
  brand: Brand
  category: Category
  inStock: boolean
  featured?: boolean
  bestseller?: boolean
  onSale?: boolean
  discountPercentage?: number
  // Additional fields from database
  art_nr?: string
  hersteller_nr?: string
  stock?: number
  discount_price?: number
  specifications_data?: any
  general_technical_specs?: any
  product_images?: Array<{
    id: string
    image_url: string
    order_index: number
    is_cover: boolean
  }>
} 