// Waitlist-related TypeScript interfaces

export interface WaitlistEntry {
  id: string
  product_slug: string
  product_id: string | null
  payload_json: any
  diff_summary: any
  created_at: string
  updated_at: string | null
  created_by: string
  version: number
  reason: WaitlistReason
  is_valid: boolean
  validation_errors: any
  requires_manual_review: boolean
  price_drop_percentage: number | null
  has_invalid_discount: boolean
}

export enum WaitlistReason {
  NEW_PRODUCT = 'new_product',
  PRICE_CHANGE = 'price_change',
  VARIANT_CHANGE = 'variant_change',
  NAME_CHANGE = 'name_change',
  IMAGE_CHANGE = 'image_change',
  SKU_CHANGE = 'sku_change',
  MULTIPLE_CHANGES = 'multiple_changes'
}

export enum ProductStatus {
  ACTIVE = 'active',
  PASSIVE = 'passive',
  WAITING_APPROVAL = 'waiting_approval',
  REJECTED = 'rejected',
  PENDING_UPDATE = 'pending_update'
}

export interface WaitlistValidation {
  is_valid: boolean
  validation_errors: string[]
  requires_manual_review: boolean
  price_drop_percentage: number | null
  has_invalid_discount: boolean
}

export interface WaitlistDiff {
  [key: string]: {
    current: any
    proposed: any
    type: 'numeric' | 'text' | 'boolean' | 'object'
    percentage_change?: number
  }
}

export interface WaitlistStats {
  total_entries: number
  new_products: number
  pending_updates: number
  manual_review_required: number
  invalid_discounts: number
  by_reason: Record<string, number>
  recent_entries: Array<{
    id: string
    product_slug: string
    type: 'new' | 'update'
    reason: string
    created_at: string
    requires_manual_review: boolean
    has_invalid_discount: boolean
  }>
  average_price_drop_percentage: number
  version_statistics: {
    total_revisions: number
    average_revisions: number
    max_revisions: number
  }
  health_indicators: {
    queue_health: 'good' | 'warning' | 'critical'
    error_rate: number
    review_rate: number
  }
}

export interface BulkOperationResult {
  approved?: number
  rejected?: number
  failed: number
  errors: Array<{
    id: string
    error: string
  }>
}

export interface WaitlistApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}