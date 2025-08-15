import type { SupabaseClient } from '@supabase/supabase-js'
import type { WaitlistEntry, WaitlistStats } from '@/types/waitlist'

/**
 * Formats waitlist entries for API responses
 */
export function formatWaitlistEntry(entry: any): WaitlistEntry {
  return {
    ...entry,
    type: entry.product_id ? 'update' : 'new',
    created_at: entry.created_at,
    updated_at: entry.updated_at || entry.created_at,
  }
}

/**
 * Generates a unique waitlist entry ID
 */
export function generateWaitlistId(): string {
  return `waitlist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Creates a slug from product name
 */
export function createProductSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Validates if a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Sanitizes email for audit logging
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return 'unknown'
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'invalid_email'
  
  return email.toLowerCase().trim()
}

/**
 * Formats timestamp for display
 */
export function formatTimestamp(timestamp: string, locale: string = 'en-US'): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  } catch (error) {
    return timestamp
  }
}

/**
 * Gets relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffSeconds < 60) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    
    return formatTimestamp(timestamp)
  } catch (error) {
    return timestamp
  }
}

/**
 * Calculates queue health based on statistics
 */
export function calculateQueueHealth(stats: Partial<WaitlistStats>): 'good' | 'warning' | 'critical' {
  const totalEntries = stats.total_entries || 0
  const errorRate = stats.invalid_discounts && stats.total_entries 
    ? (stats.invalid_discounts / stats.total_entries) * 100 
    : 0
  const reviewRate = stats.manual_review_required && stats.total_entries
    ? (stats.manual_review_required / stats.total_entries) * 100
    : 0
  
  // Critical conditions
  if (totalEntries > 200 || errorRate > 20 || reviewRate > 50) {
    return 'critical'
  }
  
  // Warning conditions
  if (totalEntries > 100 || errorRate > 10 || reviewRate > 30) {
    return 'warning'
  }
  
  return 'good'
}

/**
 * Categorizes waitlist reason for reporting
 */
export function categorizeWaitlistReason(reason: string): string {
  if (reason.includes('price')) return 'pricing'
  if (reason.includes('variant')) return 'variants'
  if (reason.includes('name') || reason.includes('description')) return 'content'
  if (reason.includes('image')) return 'media'
  if (reason.includes('sku') || reason.includes('stock')) return 'inventory'
  if (reason.includes('multiple')) return 'multiple'
  if (reason.includes('new')) return 'new_product'
  
  return 'other'
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: string, status: number = 500, details?: any) {
  return {
    error,
    status,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  }
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(message && { message })
  }
}

/**
 * Retries a database operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * Safely parses JSON with fallback
 */
export function safeJsonParse(jsonString: string, fallback: any = null): any {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('Failed to parse JSON:', error)
    return fallback
  }
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || typeof text !== 'string') return ''
  
  if (text.length <= maxLength) return text
  
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Groups array items by a key function
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), waitMs)
  }
}