// Database types based on the SQL schema

export interface Brand {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  emoji: string | null
  parent_id: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  discount_price: number | null
  stock: number
  stock_code: string | null
  image_url: string | null
  brand_id: string | null
  category_id: string | null
  created_at: string
}

export interface Banner {
  id: string
  title: string | null
  image_url: string | null
  link: string | null
  order_index: number
  is_active: boolean
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  order_index: number
  is_cover: boolean
  created_at: string
}

// Bulk upload için helper types
export interface ProductImageUpload {
  file: File
  order_index: number
  is_cover: boolean
}

export interface BulkImageUploadRequest {
  product_id: string
  images: ProductImageUpload[]
}

// Relations for more complex queries
export interface ProductWithBrand extends Product {
  brand: Brand | null
}

export interface ProductWithCategory extends Product {
  category: Category | null
}

export interface ProductWithRelations extends Product {
  brand: Brand | null
  category: Category | null
  product_images: ProductImage[]
  effective_price?: number
  has_active_discount?: boolean
  discount_percentage_actual?: number
  discount_amount?: number
  featured?: boolean
}

export interface CategoryWithParent extends Category {
  parent: Category | null
}

export interface CategoryWithChildren extends Category {
  children: Category[]
}

// Cart Types
export interface Cart {
  id: string
  session_id: string
  created_at: string
  updated_at: string
  expires_at: string
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  price: number
  created_at: string
  updated_at: string
}

// Order Types
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_province: string
  shipping_district: string
  shipping_postal_code: string
  shipping_address: string
  billing_province: string | null
  billing_district: string | null
  billing_postal_code: string | null
  billing_address: string | null
  status: OrderStatus
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_slug: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

// Cart and Order Relations
export interface CartWithItems extends Cart {
  items: (CartItem & {
    product: Pick<Product, 'id' | 'name' | 'slug' | 'image_url' | 'stock'>
  })[]
  total_amount: number
  total_items: number
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
}

export interface CartDetails {
  cart_id: string
  session_id: string
  cart_created_at: string
  cart_updated_at: string
  expires_at: string
  item_id: string | null
  product_id: string | null
  quantity: number | null
  item_price: number | null
  item_total: number | null
  product_name: string | null
  product_slug: string | null
  product_image: string | null
  product_stock: number | null
}

export interface OrderDetails extends Order {
  item_id: string | null
  product_id: string | null
  product_name: string | null
  product_slug: string | null
  quantity: number | null
  unit_price: number | null
  item_total: number | null
}

export interface OrderSummary {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  status: OrderStatus
  total_amount: number
  created_at: string
  updated_at: string
  item_count: number
  products_summary: string | null
}

// Database interface for Supabase typing
export interface Database {
  public: {
    Tables: {
      brands: {
        Row: Brand
        Insert: Omit<Brand, 'id' | 'created_at'>
        Update: Partial<Omit<Brand, 'id' | 'created_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
      }
      banners: {
        Row: Banner
        Insert: Omit<Banner, 'id' | 'created_at'>
        Update: Partial<Omit<Banner, 'id' | 'created_at'>>
      }
      product_images: {
        Row: ProductImage
        Insert: Omit<ProductImage, 'id' | 'created_at'>
        Update: Partial<Omit<ProductImage, 'id' | 'created_at'>>
      }
      carts: {
        Row: Cart
        Insert: Omit<Cart, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Cart, 'id' | 'created_at'>>
      }
      cart_items: {
        Row: CartItem
        Insert: Omit<CartItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CartItem, 'id' | 'created_at'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Order, 'id' | 'created_at'>>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id' | 'created_at'>
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: OrderStatus
    }
  }
} 