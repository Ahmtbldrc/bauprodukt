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
 * Format price with Swiss Franc currency.
 * Default behavior (customer):
 * - Non-integer prices show two decimals (e.g., CHF 2'300.20)
 * - Integer prices show as CHF 23.-
 * Admin behavior: always two decimals (e.g., CHF 2'300.20)
 */
export function formatPrice(
  price: number,
  options?: { mode?: 'customer' | 'admin' }
): string {
  const mode = options?.mode ?? 'customer'
  const isIntegerAtTwoDecimals = Math.abs(Math.round(price * 100) - Math.round(Math.trunc(price) * 100)) === 0

  if (mode === 'admin') {
    const formatted = price.toLocaleString('de-CH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return `CHF ${formatted}`
  }

  if (isIntegerAtTwoDecimals) {
    const formattedInteger = Math.trunc(price).toLocaleString('de-CH')
    return `CHF ${formattedInteger}.-`
  }

  const formatted = price.toLocaleString('de-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return `CHF ${formatted}`
}

/**
 * Convenience admin formatter: always two decimals
 */
export function formatPriceAdmin(price: number): string {
  return formatPrice(price, { mode: 'admin' })
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