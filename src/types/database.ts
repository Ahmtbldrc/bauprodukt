// Database types based on the SQL schema

// Enhanced Content System Types

// Content item types
export type ContentType = 'rich_text' | 'pdf' | 'structured_data'

// Upload status for PDFs
export type UploadStatus = 'pending' | 'uploaded' | 'failed' | 'skipped'

// Storage type for PDFs
export type StorageType = 'local' | 'supabase' | 'both'

// Extraction quality levels
export type ExtractionQuality = 'high' | 'medium' | 'low'

// Rich text content structure
export interface RichTextContent {
  type: 'rich_text'
  html: string
  text: string
  metadata?: {
    word_count?: number
    has_tables?: boolean
    extraction_quality?: ExtractionQuality
  }
}

// Structured data content
export interface StructuredDataContent {
  type: 'structured_data'
  data: Record<string, unknown>
  schema_version?: string
}

// PDF reference structure
export interface PdfReference {
  type: 'pdf'
  title: string
  filename: string
  original_url: string
  file_size: string
  file_size_bytes?: number
  file_hash?: string
  local_path?: string
  supabase_url?: string
  storage_type: StorageType
  upload_status: UploadStatus
}

// Content item union type
export type ContentItem = RichTextContent | StructuredDataContent | PdfReference

// Tab metadata for extraction tracking
export interface TabMetadata {
  extraction_date: string
  total_items: number
  has_pdfs: boolean
}

// Individual tab content
export interface TabContent {
  content_items: (RichTextContent | StructuredDataContent)[]
  pdf_references: PdfReference[]
  metadata: TabMetadata
}

// Complete features list structure
export interface FeaturesListStructure {
  [tabName: string]: TabContent
  // Common tabs: BESCHREIBUNG, TECHNISCHE_DATEN, ZUBEHÖR, LIEFERKETTE, 
  // WFW_PER_UNIT, LIEFERUNG_VERSAND, GESCHÄFTSKUNDEN_B2B
}

// Product PDF management
export interface ProductPdf {
  id: string
  product_id: string
  filename: string
  original_url: string
  tab_section: string | null
  local_path: string | null
  supabase_url: string | null
  supabase_path: string | null
  storage_type: StorageType
  file_size: number | null // Bytes in database
  file_hash: string | null
  mime_type: string | null
  download_status: string | null
  upload_status: UploadStatus
  upload_date: string | null
  created_at: string
  updated_at: string
}

// Content summary for API responses
export interface ContentSummary {
  total_tabs: number
  total_content_items: number
  total_pdfs: number
  last_extraction_date: string | null
}

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
  // Enhanced content system
  features_list: FeaturesListStructure | null
  created_at: string
  updated_at: string
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

// Variant System Types

export type AttributeType = 'select' | 'text' | 'number'

export interface ProductAttribute {
  id: string
  name: string
  display_name: string
  attribute_type: AttributeType
  is_required: boolean
  sort_order: number
  created_at: string
}

export interface ProductAttributeValue {
  id: string
  attribute_id: string
  value: string
  display_value: string | null
  hex_color: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  title: string | null
  price: number
  compare_at_price: number | null
  stock_quantity: number
  track_inventory: boolean
  continue_selling_when_out_of_stock: boolean
  is_active: boolean
  position: number
  source_platform: string
  source_variant_id: string | null
  source_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface VariantAttributeValue {
  variant_id: string
  attribute_value_id: string
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

// Variant Relations
export interface VariantAttribute {
  name: string
  display_name: string
  attribute_type: AttributeType
  value: string
  display_value: string | null
  hex_color: string | null
  sort_order: number
}

export interface SyntheticVariant {
  id: string
  sku: string
  price: number
  compare_at_price: number | null
  stock_quantity: number
  is_default: boolean
  is_synthetic: boolean
  attributes: VariantAttribute[]
}

export interface ProductVariantDetailed extends ProductVariant {
  product_name: string
  product_slug: string
  product_image_url: string | null
  attributes: VariantAttribute[]
  attributes_text: string | null
  attribute_count: number
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[]
  default_variant?: ProductVariant
  // Enhanced content fields for product detail responses
  content_summary?: ContentSummary
  pdfs?: ProductPdf[]
}

export interface ProductWithDefaultVariant extends Product {
  default_variant_id: string | null
  default_variant_sku: string | null
  variant_price: number | null
  variant_compare_at_price: number | null
  variant_stock: number | null
  variant_track_inventory: boolean | null
  variant_continue_selling: boolean | null
  has_variants: boolean
  effective_variant_id: string
  effective_sku: string
  selected_variant?: ProductVariantDetailed
  available_variants?: ProductVariantDetailed[]
}

export interface ProductAttributeSummary {
  product_id: string
  product_name: string
  attributes: Array<{
    name: string
    display_name: string
    attribute_type: AttributeType
    is_required: boolean
    values: Array<{
      value: string
      display_value: string | null
      hex_color: string | null
      sort_order: number
    }>
  }>
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
  variant_id: string | null
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
export interface CartItemWithVariant extends CartItem {
  product: Pick<Product, 'id' | 'name' | 'slug' | 'image_url' | 'stock'>
  variant?: Pick<ProductVariantDetailed, 'id' | 'sku' | 'title' | 'attributes' | 'stock_quantity'>
  is_available: boolean
  variant_stock: number | null
  variant_sku: string | null
  variant_title: string | null
  variant_attributes: VariantAttribute[]
}

export interface CartWithItems extends Cart {
  items: (CartItem & {
    product: Pick<Product, 'id' | 'name' | 'slug' | 'image_url' | 'stock'>
  })[]
  total_amount: number
  total_items: number
}

export interface CartWithVariants extends Cart {
  items: CartItemWithVariant[]
  total_amount: number
  total_items: number
  unavailable_items: number
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
  variant_id: string | null
  quantity: number | null
  item_price: number | null
  item_total: number | null
  product_name: string | null
  product_slug: string | null
  product_image: string | null
  product_stock: number | null
  variant_sku: string | null
  variant_stock: number | null
  variant_attributes: VariantAttribute[]
  variant_title: string | null
  is_available: boolean
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

// Role Types
export interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  permissions: Record<string, unknown>
  is_active: boolean
  created_at: string
}

// Profile Types
export interface Profile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  phone: string | null
  birth_date: string | null
  avatar_url: string | null
  role_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Profile Relations
export interface ProfileWithRole extends Profile {
  role: Role
}

export interface ProfileDetails extends Profile {
  role: Role
  full_name: string
}

export interface RoleWithProfiles extends Role {
  profiles: Profile[]
  profile_count: number
  active_profile_count: number
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
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
      }
      product_pdfs: {
        Row: ProductPdf
        Insert: Omit<ProductPdf, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProductPdf, 'id' | 'created_at'>>
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
      roles: {
        Row: Role
        Insert: Omit<Role, 'id' | 'created_at'>
        Update: Partial<Omit<Role, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      product_attributes: {
        Row: ProductAttribute
        Insert: Omit<ProductAttribute, 'id' | 'created_at'>
        Update: Partial<Omit<ProductAttribute, 'id' | 'created_at'>>
      }
      product_attribute_values: {
        Row: ProductAttributeValue
        Insert: Omit<ProductAttributeValue, 'id' | 'created_at'>
        Update: Partial<Omit<ProductAttributeValue, 'id' | 'created_at'>>
      }
      product_variants: {
        Row: ProductVariant
        Insert: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProductVariant, 'id' | 'created_at'>>
      }
      variant_attribute_values: {
        Row: VariantAttributeValue
        Insert: VariantAttributeValue
        Update: VariantAttributeValue
      }
    }
    Views: {
      products_with_default_variants: {
        Row: ProductWithDefaultVariant & {
          brand_name: string | null
          brand_slug: string | null
          category_name: string | null
          category_slug: string | null
          category_parent_id: string | null
          category_emoji: string | null
          effective_price: number
          has_active_discount: boolean
          discount_percentage_actual: number
          discount_amount: number
        }
      }
      product_variants_detailed: {
        Row: ProductVariantDetailed
      }
      cart_items_with_variants: {
        Row: CartDetails
      }
      product_attributes_summary: {
        Row: ProductAttributeSummary
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: OrderStatus
      attribute_type: AttributeType
      upload_status: UploadStatus
      storage_type: StorageType
    }
  }
} 