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
} 