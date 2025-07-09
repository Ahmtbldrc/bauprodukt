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
  slug: z.string().min(1, 'Slug gerekli').max(255, 'Slug çok uzun').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir')
})

export const updateBrandSchema = createBrandSchema.partial()

// Category schemas
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Kategori adı gerekli'),
  slug: z.string().min(1, 'Slug gerekli'),
  parent_id: z.string().uuid().nullable(),
  created_at: z.string()
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı gerekli').max(255, 'Kategori adı çok uzun'),
  slug: z.string().min(1, 'Slug gerekli').max(255, 'Slug çok uzun').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
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
  stock: z.number().int().min(0, 'Stok negatif olamaz'),
  image_url: z.string().url().nullable(),
  brand_id: z.string().uuid().nullable(),
  category_id: z.string().uuid().nullable(),
  created_at: z.string()
})

export const createProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı gerekli').max(255, 'Ürün adı çok uzun'),
  slug: z.string().min(1, 'Slug gerekli').max(255, 'Slug çok uzun').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().max(2000, 'Açıklama çok uzun').optional(),
  price: z.number().min(0, 'Fiyat negatif olamaz'),
  stock: z.number().int().min(0, 'Stok negatif olamaz'),
  image_url: z.string().url('Geçerli bir URL giriniz').optional(),
  brand_id: z.string().uuid('Geçerli bir marka seçiniz').optional(),
  category_id: z.string().uuid('Geçerli bir kategori seçiniz').optional()
})

export const updateProductSchema = createProductSchema.partial()

// Banner schemas
export const bannerSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  image_url: z.string().url(),
  link: z.string().url().nullable(),
  order_index: z.number().int().min(0),
  is_active: z.boolean(),
  created_at: z.string()
})

export const createBannerSchema = z.object({
  title: z.string().max(255, 'Başlık çok uzun').optional(),
  image_url: z.string().url('Geçerli bir resim URL\'i gerekli'),
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

// Type exports
export type BrandFormData = z.infer<typeof createBrandSchema>
export type CategoryFormData = z.infer<typeof createCategorySchema>
export type ProductFormData = z.infer<typeof createProductSchema>
export type BannerFormData = z.infer<typeof createBannerSchema>
export type ProductImageFormData = z.infer<typeof createProductImageSchema>

// Validation helpers
export const validateBrand = (data: unknown) => createBrandSchema.safeParse(data)
export const validateCategory = (data: unknown) => createCategorySchema.safeParse(data)
export const validateProduct = (data: unknown) => createProductSchema.safeParse(data)
export const validateBanner = (data: unknown) => createBannerSchema.safeParse(data)
export const validateProductImage = (data: unknown) => createProductImageSchema.safeParse(data) 