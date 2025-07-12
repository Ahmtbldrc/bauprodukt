import { Product } from '@/types/product'

/**
 * Generates hierarchical product URL: /[brand]/[category]/[product]
 */
export function generateProductURL(brand: string, category: string, product: string): string {
  return `/${brand}/${category}/${product}`
}

/**
 * Generates hierarchical product URL from Product object
 */
export function generateProductURLFromObject(product: Product): string {
  return generateProductURL(product.brand.slug, product.category.slug, product.slug)
}

/**
 * Generates brand URL: /brands/[brand-slug]
 */
export function generateBrandURL(brandSlug: string): string {
  return `/brands/${brandSlug}`
}

/**
 * Generates category URL: /categories/[category-slug]
 */
export function generateCategoryURL(categorySlug: string): string {
  return `/categories/${categorySlug}`
}

/**
 * Format price with Swiss Franc currency
 */
export function formatPrice(price: number): string {
  return `CHF ${price.toLocaleString('de-CH')}`
}

/**
 * Generate canonical URL for SEO
 */
export function generateCanonicalURL(baseURL: string, product: Product): string {
  return `${baseURL}${generateProductURLFromObject(product)}`
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(originalPrice: number, salePrice: number): number {
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

/**
 * Check if product has discount
 */
export function hasDiscount(product: Product): boolean {
  return !!(product.onSale && product.originalPrice && product.originalPrice > product.price)
} 