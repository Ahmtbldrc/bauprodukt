// Product Edit Page Types

export interface Variant {
  id?: string
  sku: string
  title: string
  price: string
  compare_at_price: string
  stock_quantity: string
  track_inventory: boolean
  continue_selling_when_out_of_stock: boolean
  is_active: boolean
  position: number
  attributes: Array<{
    name: string
    display_name: string
    attribute_type: 'select' | 'color' | 'text'
    value: string
    display_value: string
    hex_color?: string | null
    sort_order: number
  }>
}

export interface ProductImage {
  id?: string
  image_url: string
  is_cover: boolean
}

export interface VariantResponse {
  id: string
  sku: string
  title?: string
  price: number
  compare_at_price?: number
  stock_quantity: number
  track_inventory: boolean
  continue_selling_when_out_of_stock: boolean
  is_active: boolean
  position: number
}

export interface ImageResponse {
  id: string
  image_url: string
  order_index: number
  is_cover: boolean
}

export interface FormData {
  name: string
  slug: string
  description: string
  price: string
  discount_price: string
  stock: string
  stock_code: string
  art_nr: string
  hersteller_nr: string
  image_url: string
  brand_id: string
  category_id: string
  technical_specs: Array<{
    id?: string
    title: string
    description: string
    sort_order: number
  }>,
  general_technical_specs: Array<{
    id?: string
    title: string
    description: string
    sort_order: number
  }>
}

export interface Specifications {
  // Flexible structure for technical specifications
  technical_specs: Array<{
    id?: string
    title: string
    description: string
    sort_order: number
  }>,
  general_technical_specs: Array<{
    id?: string
    title: string
    description: string
    sort_order: number
  }>
}

export interface Document {
  id: string
  name: string
  url: string
  file_size: string
  type: string
}

export interface ProductDocument {
  id: string
  product_id: string
  title: string
  file_url: string
  file_type?: string
  file_size?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DocumentImage {
  id: string
  file: File
  previewUrl: string
  name: string
}

export interface ConversionFactors {
  length_units: boolean
  weight_units: boolean
  volume_units: boolean
  temperature_units: boolean
}

export interface ProductConversionFactors {
  id: string
  product_id: string
  length_units: boolean
  weight_units: boolean
  volume_units: boolean
  temperature_units: boolean
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  title: string
  file: File | null
  description: string
  previewUrl: string
}

export interface ProductVideo {
  id: string
  product_id: string
  title: string
  video_url: string
  thumbnail_url?: string
  duration?: number
  file_size?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WaitlistInfo {
  id: string
  product_slug: string
  product_id: string
  reason: string
  requires_manual_review: boolean
}

export type ActiveTab = 'general' | 'variants' | 'images' | 'specifications' | 'documents' | 'conversion' | 'videos'
