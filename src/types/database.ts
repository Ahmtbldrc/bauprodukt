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
  parent_id: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  image_url: string | null
  brand_id: string | null
  category_id: string | null
  created_at: string
}

export interface Banner {
  id: string
  title: string | null
  image_url: string
  link: string | null
  order_index: number
  is_active: boolean
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  created_at: string
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
}

export interface CategoryWithParent extends Category {
  parent: Category | null
}

export interface CategoryWithChildren extends Category {
  children: Category[]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 