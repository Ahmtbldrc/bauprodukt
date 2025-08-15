import type { WaitlistDiff } from '@/types/waitlist'

/**
 * Calculates the difference between current and proposed product data
 */
export function calculateProductDiff(currentData: Record<string, unknown>, proposedData: Record<string, unknown>): WaitlistDiff {
  const diff: WaitlistDiff = {}
  
  // Important fields to track changes for
  const importantFields = [
    'name',
    'price', 
    'discount_price',
    'stock',
    'description',
    'stock_code',
    'image_url',
    'brand_id',
    'category_id',
    'status',
    'is_changeable'
  ]
  
  importantFields.forEach(field => {
    const currentValue = currentData[field]
    const proposedValue = proposedData[field]
    
    if (!isEqual(currentValue, proposedValue)) {
      diff[field] = {
        current: currentValue,
        proposed: proposedValue,
        type: getValueType(currentValue, proposedValue)
      }
      
      // Calculate percentage change for numeric fields
      if (diff[field].type === 'numeric' && 
          typeof currentValue === 'number' && 
          typeof proposedValue === 'number' && 
          currentValue !== 0) {
        const percentageChange = ((proposedValue - currentValue) / currentValue) * 100
        diff[field].percentage_change = Math.round(percentageChange * 100) / 100
      }
    }
  })
  
  return diff
}

/**
 * Creates a human-readable summary of changes
 */
export function createDiffSummary(diff: WaitlistDiff): Record<string, unknown> {
  const summary = {
    total_changes: Object.keys(diff).length,
    price_changes: [] as Array<Record<string, unknown>>,
    content_changes: [] as Array<Record<string, unknown>>,
    status_changes: [] as Array<Record<string, unknown>>,
    significant_changes: [] as Array<Record<string, unknown>>
  }
  
  Object.entries(diff).forEach(([field, change]) => {
    const changeDescription = {
      field,
      from: change.current,
      to: change.proposed,
      type: change.type,
      percentage_change: change.percentage_change
    }
    
    // Categorize changes
    if (['price', 'discount_price'].includes(field)) {
      summary.price_changes.push(changeDescription)
      
      // Flag significant price changes
      if (change.percentage_change && Math.abs(change.percentage_change) > 20) {
        summary.significant_changes.push({
          ...changeDescription,
          significance: 'major_price_change'
        })
      }
    } else if (['name', 'description'].includes(field)) {
      summary.content_changes.push(changeDescription)
    } else if (['status', 'is_changeable'].includes(field)) {
      summary.status_changes.push(changeDescription)
    }
    
    // Flag other significant changes
    if (field === 'stock' && change.type === 'numeric') {
      const stockChange = change.percentage_change
      if (stockChange && stockChange < -80) {
        summary.significant_changes.push({
          ...changeDescription,
          significance: 'major_stock_decrease'
        })
      } else if (stockChange && stockChange > 500) {
        summary.significant_changes.push({
          ...changeDescription,
          significance: 'major_stock_increase'
        })
      }
    }
    
    if (field === 'category_id' || field === 'brand_id') {
      summary.significant_changes.push({
        ...changeDescription,
        significance: 'category_or_brand_change'
      })
    }
  })
  
  return summary
}

/**
 * Generates a concise text summary of changes
 */
export function generateTextSummary(diff: WaitlistDiff): string {
  const changes = Object.keys(diff)
  
  if (changes.length === 0) {
    return 'No changes detected'
  }
  
  if (changes.length === 1) {
    const field = changes[0]
    const change = diff[field]
    
    if (field === 'price') {
      const percentage = change.percentage_change 
        ? ` (${change.percentage_change > 0 ? '+' : ''}${change.percentage_change}%)`
        : ''
      return `Price changed from ${change.current} to ${change.proposed}${percentage}`
    }
    
    return `${formatFieldName(field)} changed from "${change.current}" to "${change.proposed}"`
  }
  
  // Multiple changes
  const priceChanges = changes.filter(f => ['price', 'discount_price'].includes(f))
  const otherChanges = changes.filter(f => !['price', 'discount_price'].includes(f))
  
  let summary = `${changes.length} changes: `
  
  if (priceChanges.length > 0) {
    summary += `price updates (${priceChanges.join(', ')})`
    if (otherChanges.length > 0) {
      summary += ` and ${otherChanges.length} other field${otherChanges.length > 1 ? 's' : ''}`
    }
  } else {
    summary += otherChanges.map(formatFieldName).join(', ')
  }
  
  return summary
}

/**
 * Checks if two values are equal (handles null, undefined, and type differences)
 */
function isEqual(a: unknown, b: unknown): boolean {
  // Handle null/undefined cases
  if (a === null || a === undefined) {
    return b === null || b === undefined
  }
  if (b === null || b === undefined) {
    return false
  }
  
  // Direct comparison
  if (a === b) return true
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => isEqual(item, b[index]))
  }
  
  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as Record<string, unknown>)
    const keysB = Object.keys(b as Record<string, unknown>)
    
    if (keysA.length !== keysB.length) return false
    
    return keysA.every(key => isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
  }
  
  // Handle string/number type coercion for common cases
  if (typeof a === 'string' && typeof b === 'number') {
    return parseFloat(a) === b
  }
  if (typeof a === 'number' && typeof b === 'string') {
    return a === parseFloat(b)
  }
  
  return false
}

/**
 * Determines the type of value change
 */
function getValueType(currentValue: unknown, proposedValue: unknown): 'numeric' | 'text' | 'boolean' | 'object' {
  if (typeof currentValue === 'number' && typeof proposedValue === 'number') {
    return 'numeric'
  }
  
  if (typeof currentValue === 'boolean' && typeof proposedValue === 'boolean') {
    return 'boolean'
  }
  
  if ((typeof currentValue === 'object' || typeof proposedValue === 'object') &&
      (currentValue !== null || proposedValue !== null)) {
    return 'object'
  }
  
  return 'text'
}

/**
 * Formats field names for display
 */
function formatFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    'name': 'Name',
    'price': 'Price',
    'discount_price': 'Discount Price',
    'stock': 'Stock',
    'description': 'Description',
    'stock_code': 'Stock Code',
    'image_url': 'Image URL',
    'brand_id': 'Brand',
    'category_id': 'Category',
    'status': 'Status',
    'is_changeable': 'Changeability'
  }
  
  return fieldNames[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}