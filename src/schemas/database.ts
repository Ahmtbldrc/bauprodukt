import { z } from 'zod'

// Brand schemas
export const brandSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Marka adı gerekli'),
  slug: z.string().min(1, 'Slug gerekli'),
  created_at: z.string()
})

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Marka adı gerekli').max(255, 'Marka adı çok uzun'),
  slug: z.string().min(1, 'Slug gerekli').max(255, 'Slug çok uzun').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir').optional()
})

export const updateBrandSchema = createBrandSchema.partial()

// Category schemas
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Kategori adı gerekli'),
  slug: z.string().min(1, 'Slug gerekli'),
  emoji: z.string().max(10, 'Emoji çok uzun').nullable().optional(),
  parent_id: z.string().uuid().nullable(),
  created_at: z.string()
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı gerekli').max(255, 'Kategori adı çok uzun'),
  slug: z.string().min(1, 'Slug gerekli').max(255, 'Slug çok uzun').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  emoji: z.string().max(10, 'Emoji çok uzun').nullable().optional(),
  parent_id: z.string().uuid().nullable().optional()
})

export const updateCategorySchema = createCategorySchema.partial()

// Product schemas
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Ürün adı gerekli'),
  slug: z.string().min(1, 'Slug gerekli'),
  description: z.string().nullable(),
  price: z.number().min(0, 'Fiyat negatif olamaz'),
  discount_price: z.number().min(0, 'İndirimli fiyat negatif olamaz').nullable(),
  stock: z.number().int().min(0, 'Stok negatif olamaz'),
  stock_code: z.string().nullable(),
  art_nr: z.string().nullable(),
  hersteller_nr: z.string().nullable(),
  image_url: z.string().url().nullable(),
  brand_id: z.string().uuid().nullable(),
  category_id: z.string().uuid().nullable(),
  created_at: z.string()
})

const baseProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı gerekli').max(255, 'Ürün adı çok uzun'),
  slug: z.string().min(1, 'Slug gerekli').max(255, 'Slug çok uzun').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().max(2000, 'Açıklama çok uzun').optional(),
  price: z.number().min(0, 'Fiyat negatif olamaz'),
  discount_price: z.number().min(0, 'İndirimli fiyat negatif olamaz').optional(),
  stock: z.number().int().min(0, 'Stok negatif olamaz'),
  stock_code: z.string().max(100, 'Stok kodu çok uzun').optional(),
  art_nr: z.string().max(100, 'Art-Nr çok uzun').optional(),
  hersteller_nr: z.string().max(100, 'Hersteller-Nr çok uzun').optional(),
  image_url: z.string().url('Geçerli bir URL giriniz').optional(),
  brand_id: z.string().uuid('Geçerli bir marka seçiniz').optional(),
  category_id: z.string().uuid('Geçerli bir kategori seçiniz').optional(),
  allow_manual_stock_edit: z.boolean().optional(),
  specifications_data: z.record(z.unknown()).optional(),
  general_technical_specs: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string(),
    sort_order: z.number()
  })).optional()
})

export const createProductSchema = baseProductSchema.refine((data) => {
  // İndirimli fiyat varsa, normal fiyattan küçük ve sıfırdan büyük olmalı
  if (data.discount_price) {
    if (data.discount_price <= 0) {
      return false
    }
    if (data.discount_price >= data.price) {
      return false
    }
  }
  return true
}, {
  message: "İndirimli fiyat sıfırdan büyük ve normal fiyattan küçük olmalı",
  path: ["discount_price"]
})

export const updateProductSchema = baseProductSchema.partial().refine((data) => {
  // İndirimli fiyat varsa, geçerli olmalı
  if (data.discount_price !== undefined) {
    // Eğer discount_price null değilse kontrol et
    if (data.discount_price !== null) {
      if (data.discount_price <= 0) {
        return false
      }
      // Eğer price da güncelleniyor veya mevcutsa kontrol et
      if (data.price && data.discount_price >= data.price) {
        return false
      }
    }
  }
  return true
}, {
  message: "İndirimli fiyat sıfırdan büyük ve normal fiyattan küçük olmalı",
  path: ["discount_price"]
})

// Banner schemas
export const bannerSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  image_url: z.string().url().nullable(),
  link: z.string().url().nullable(),
  order_index: z.number().int().min(0),
  is_active: z.boolean(),
  created_at: z.string()
})

export const createBannerSchema = z.object({
  title: z.string().max(255, 'Başlık çok uzun').optional(),
  image_url: z.string().url('Geçerli bir resim URL\'i gerekli').optional(),
  link: z.string().url('Geçerli bir URL giriniz').optional(),
  order_index: z.number().int().min(0, 'Sıra numarası negatif olamaz').default(0),
  is_active: z.boolean().default(true)
})

export const updateBannerSchema = createBannerSchema.partial()

// Product Image schemas
export const productImageSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  image_url: z.string().url(),
  created_at: z.string()
})

export const createProductImageSchema = z.object({
  product_id: z.string().uuid('Geçerli bir ürün seçiniz'),
  image_url: z.string().url('Geçerli bir resim URL\'i gerekli')
})

export const updateProductImageSchema = createProductImageSchema.partial()

// Cart schemas
export const cartItemSchema = z.object({
  product_id: z.string().uuid('Geçerli bir ürün seçiniz'),
  variant_id: z.string().uuid('Geçerli bir variant seçiniz').nullable().optional(),
  quantity: z.number().int().min(1, 'Miktar en az 1 olmalı').max(999, 'Miktar çok fazla')
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Miktar en az 1 olmalı').max(999, 'Miktar çok fazla')
})

// Order schemas
export const orderStatusSchema = z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])

export const createOrderSchema = z.object({
  customer_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalı').max(255, 'Ad soyad çok uzun'),
  customer_email: z.string().email('Geçerli bir email adresi giriniz').max(255, 'Email çok uzun'),
  customer_phone: z.string().min(10, 'Telefon numarası geçersiz').max(50, 'Telefon numarası çok uzun'),
  
  shipping_province: z.string().min(1, 'İl seçimi zorunlu').max(255, 'İl adı çok uzun'),
  shipping_district: z.string().min(1, 'İlçe seçimi zorunlu').max(255, 'İlçe adı çok uzun'), 
  shipping_postal_code: z.string().min(1, 'Posta kodu zorunlu').max(20, 'Posta kodu çok uzun'),
  shipping_address: z.string().min(10, 'Açık adres en az 10 karakter olmalı').max(2000, 'Adres çok uzun'),
  
  billing_province: z.string().max(255, 'İl adı çok uzun').optional(),
  billing_district: z.string().max(255, 'İlçe adı çok uzun').optional(),
  billing_postal_code: z.string().max(20, 'Posta kodu çok uzun').optional(),
  billing_address: z.string().max(2000, 'Adres çok uzun').optional(),
  
  notes: z.string().max(1000, 'Not çok uzun').optional(),
  session_id: z.string().min(1, 'Session ID gerekli')
})

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema
})

export const updateOrderSchema = z.object({
  customer_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalı').max(255, 'Ad soyad çok uzun').optional(),
  customer_email: z.string().email('Geçerli bir email adresi giriniz').max(255, 'Email çok uzun').optional(),
  customer_phone: z.string().min(10, 'Telefon numarası geçersiz').max(50, 'Telefon numarası çok uzun').optional(),
  
  shipping_province: z.string().min(1, 'İl seçimi zorunlu').max(255, 'İl adı çok uzun').optional(),
  shipping_district: z.string().min(1, 'İlçe seçimi zorunlu').max(255, 'İlçe adı çok uzun').optional(), 
  shipping_postal_code: z.string().min(1, 'Posta kodu zorunlu').max(20, 'Posta kodu çok uzun').optional(),
  shipping_address: z.string().min(10, 'Açık adres en az 10 karakter olmalı').max(2000, 'Adres çok uzun').optional(),
  
  billing_province: z.string().max(255, 'İl adı çok uzun').optional(),
  billing_district: z.string().max(255, 'İlçe adı çok uzun').optional(),
  billing_postal_code: z.string().max(20, 'Posta kodu çok uzun').optional(),
  billing_address: z.string().max(2000, 'Adres çok uzun').optional(),
  
  notes: z.string().max(1000, 'Not çok uzun').optional(),
  status: orderStatusSchema.optional(),
  tracking_url: z.string().url('Geçerli bir takip URL\'i giriniz').optional()
})

// Role schemas
export const roleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Rol adı gerekli'),
  slug: z.string().min(1, 'Slug gerekli'),
  description: z.string().nullable(),
  permissions: z.record(z.any()),
  is_active: z.boolean(),
  created_at: z.string()
})

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Rol adı gerekli').max(255, 'Rol adı çok uzun'),
  slug: z.string().min(1, 'Slug gerekli').max(255, 'Slug çok uzun').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().max(2000, 'Açıklama çok uzun').optional(),
  permissions: z.record(z.any()).default({}),
  is_active: z.boolean().default(true)
})

export const updateRoleSchema = createRoleSchema.partial()

// Profile schemas
export const profileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  first_name: z.string().min(1, 'Ad gerekli'),
  last_name: z.string().min(1, 'Soyad gerekli'),
  phone: z.string().nullable(),
  birth_date: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  role_id: z.string().uuid(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
})

export const createProfileSchema = z.object({
  user_id: z.string().uuid('Geçerli bir kullanıcı seçiniz'),
  first_name: z.string().min(1, 'Ad en az 1 karakter olmalı').max(255, 'Ad çok uzun'),
  last_name: z.string().min(1, 'Soyad en az 1 karakter olmalı').max(255, 'Soyad çok uzun'),
  phone: z.string().min(10, 'Telefon numarası geçersiz').max(50, 'Telefon numarası çok uzun').optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih formatı giriniz (YYYY-MM-DD)').optional(),
  avatar_url: z.string().url('Geçerli bir resim URL\'i giriniz').optional(),
  role_id: z.string().uuid('Geçerli bir rol seçiniz'),
  is_active: z.boolean().default(true)
})

export const updateProfileSchema = createProfileSchema.partial()

// Type exports
export type BrandFormData = z.infer<typeof createBrandSchema>
export type CategoryFormData = z.infer<typeof createCategorySchema>
export type ProductFormData = z.infer<typeof createProductSchema>
export type BannerFormData = z.infer<typeof createBannerSchema>
export type ProductImageFormData = z.infer<typeof createProductImageSchema>
export type CartItemFormData = z.infer<typeof cartItemSchema>
export type UpdateCartItemFormData = z.infer<typeof updateCartItemSchema>
export type CreateOrderFormData = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusFormData = z.infer<typeof updateOrderStatusSchema>
export type UpdateOrderFormData = z.infer<typeof updateOrderSchema>
export type RoleFormData = z.infer<typeof createRoleSchema>
export type ProfileFormData = z.infer<typeof createProfileSchema>

// Validation helpers
export const validateBrand = (data: unknown) => createBrandSchema.safeParse(data)
export const validateCategory = (data: unknown) => createCategorySchema.safeParse(data)
export const validateProduct = (data: unknown) => createProductSchema.safeParse(data)
export const validateBanner = (data: unknown) => createBannerSchema.safeParse(data)
export const validateProductImage = (data: unknown) => createProductImageSchema.safeParse(data)
export const validateCartItem = (data: unknown) => cartItemSchema.safeParse(data)
export const validateUpdateCartItem = (data: unknown) => updateCartItemSchema.safeParse(data)
export const validateCreateOrder = (data: unknown) => createOrderSchema.safeParse(data)
export const validateUpdateOrderStatus = (data: unknown) => updateOrderStatusSchema.safeParse(data)
export const validateUpdateOrder = (data: unknown) => updateOrderSchema.safeParse(data)
export const validateRole = (data: unknown) => createRoleSchema.safeParse(data)
export const validateProfile = (data: unknown) => createProfileSchema.safeParse(data) 