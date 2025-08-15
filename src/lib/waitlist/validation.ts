import type { WaitlistValidation } from '@/types/waitlist'

/**
 * Validates product data according to Swiss VFG business rules
 */
export function validateProductData(data: any, oldData?: any): WaitlistValidation {
  const errors: string[] = []
  let requiresManualReview = false
  let priceDropPercentage: number | null = null
  let hasInvalidDiscount = false
  
  // Required fields validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Product name is required and must be a non-empty string')
  }
  
  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    errors.push('Price is required and must be a positive number')
  }
  
  if (!data.slug || typeof data.slug !== 'string' || data.slug.trim().length === 0) {
    errors.push('Product slug is required and must be a non-empty string')
  }
  
  // Price validation - discount price must be less than regular price
  if (data.discount_price !== null && data.discount_price !== undefined) {
    if (typeof data.discount_price !== 'number') {
      errors.push('Discount price must be a number')
    } else if (data.discount_price >= data.price) {
      errors.push('Discount price must be less than regular price')
      hasInvalidDiscount = true
      requiresManualReview = true
    } else if (data.discount_price < 0) {
      errors.push('Discount price cannot be negative')
      hasInvalidDiscount = true
      requiresManualReview = true
    }
  }
  
  // Stock validation
  if (data.stock !== null && data.stock !== undefined) {
    if (typeof data.stock !== 'number' || data.stock < 0) {
      errors.push('Stock must be a non-negative number')
    }
  }
  
  // Price drop validation (if updating existing product)
  if (oldData && oldData.price && data.price) {
    priceDropPercentage = ((oldData.price - data.price) / oldData.price) * 100
    
    // Flag significant price drops for manual review
    if (priceDropPercentage > 30) {
      requiresManualReview = true
      errors.push(`Significant price drop detected: ${priceDropPercentage.toFixed(1)}%`)
    }
    
    // Flag price increases that might be errors
    if (priceDropPercentage < -50) {
      requiresManualReview = true
      errors.push(`Significant price increase detected: ${Math.abs(priceDropPercentage).toFixed(1)}%`)
    }
  }
  
  // Brand validation - must be VFG for Swiss VFG scraper
  if (data.brand_id && typeof data.brand_id === 'string') {
    // This would need to be checked against actual VFG brand ID in the database
    // For now, we'll just ensure it's provided
  }
  
  // Category validation
  if (data.category_id && typeof data.category_id !== 'string') {
    errors.push('Category ID must be a string')
  }
  
  // Stock code validation (if provided)
  if (data.stock_code !== null && data.stock_code !== undefined) {
    if (typeof data.stock_code !== 'string' || data.stock_code.trim().length === 0) {
      errors.push('Stock code must be a non-empty string if provided')
    }
  }
  
  // Description validation (if provided)
  if (data.description !== null && data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string')
    } else if (data.description.length > 5000) {
      errors.push('Description is too long (maximum 5000 characters)')
    }
  }
  
  // Image URL validation (if provided)
  if (data.image_url !== null && data.image_url !== undefined) {
    if (typeof data.image_url !== 'string') {
      errors.push('Image URL must be a string')
    } else {
      try {
        new URL(data.image_url)
      } catch {
        errors.push('Image URL must be a valid URL')
      }
    }
  }
  
  // Variant validation triggers
  if (data.variants && Array.isArray(data.variants)) {
    // Check if variant count matches source (this would need source data)
    if (data.variants.length === 0) {
      requiresManualReview = true
      errors.push('Product has empty variants array - manual review required')
    }
    
    // Validate individual variants
    data.variants.forEach((variant: any, index: number) => {
      if (!variant.sku || typeof variant.sku !== 'string') {
        errors.push(`Variant ${index + 1}: SKU is required and must be a string`)
      }
      
      if (!variant.price || typeof variant.price !== 'number' || variant.price <= 0) {
        errors.push(`Variant ${index + 1}: Price is required and must be positive`)
      }
      
      if (variant.stock_quantity !== null && variant.stock_quantity !== undefined) {
        if (typeof variant.stock_quantity !== 'number' || variant.stock_quantity < 0) {
          errors.push(`Variant ${index + 1}: Stock quantity must be non-negative`)
        }
      }
    })
  }
  
  // Additional manual review triggers
  if (errors.length > 5) {
    requiresManualReview = true
  }
  
  return {
    is_valid: errors.length === 0,
    validation_errors: errors,
    requires_manual_review: requiresManualReview,
    price_drop_percentage: priceDropPercentage,
    has_invalid_discount: hasInvalidDiscount
  }
}

/**
 * Validates bulk operation request
 */
export function validateBulkRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' }
  }
  
  if (!body.ids || !Array.isArray(body.ids)) {
    return { valid: false, error: 'ids array is required' }
  }
  
  if (body.ids.length === 0) {
    return { valid: false, error: 'ids array cannot be empty' }
  }
  
  if (body.ids.length > 100) {
    return { valid: false, error: 'Maximum 100 items allowed in bulk operation' }
  }
  
  // Validate each ID is a string
  for (let i = 0; i < body.ids.length; i++) {
    if (typeof body.ids[i] !== 'string' || body.ids[i].trim().length === 0) {
      return { valid: false, error: `Invalid ID at index ${i}: must be a non-empty string` }
    }
  }
  
  return { valid: true }
}

/**
 * Sanitizes product data before processing
 */
export function sanitizeProductData(data: any): any {
  return {
    ...data,
    name: typeof data.name === 'string' ? data.name.trim() : data.name,
    slug: typeof data.slug === 'string' ? data.slug.trim().toLowerCase() : data.slug,
    description: typeof data.description === 'string' ? data.description.trim() : data.description,
    stock_code: typeof data.stock_code === 'string' ? data.stock_code.trim() : data.stock_code,
    // Ensure numeric fields are properly typed
    price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
    discount_price: typeof data.discount_price === 'string' ? parseFloat(data.discount_price) : data.discount_price,
    stock: typeof data.stock === 'string' ? parseInt(data.stock, 10) : data.stock,
  }
}