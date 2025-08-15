import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Middleware ensures admin access
  try {
    const supabase = createClient()
    const { id } = await params
    
    // Get waitlist entry
    const { data: entry, error: entryError } = await supabase
      .from('waitlist_updates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (entryError) {
      if (entryError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Waitlist entry not found' },
          { status: 404 }
        )
      }
      
      console.error('Waitlist entry fetch error:', entryError)
      return NextResponse.json(
        { error: 'Failed to fetch waitlist entry' },
        { status: 500 }
      )
    }
    
    let currentProduct = null
    let diff = null
    
    // If this is an update to existing product, get current product and calculate diff
    if (entry.product_id) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', entry.product_id)
        .single()
      
      if (!productError && productData) {
        currentProduct = productData
        
        // Calculate diff between current product and proposed changes
        diff = calculateDiff(productData, entry.payload_json)
      }
    }
    
    const response = {
      id: entry.id,
      product_slug: entry.product_slug,
      product_id: entry.product_id,
      type: entry.product_id ? 'update' : 'new',
      payload_json: entry.payload_json,
      diff_summary: entry.diff_summary,
      current_product: currentProduct,
      calculated_diff: diff,
      validation: {
        is_valid: entry.is_valid,
        has_invalid_discount: entry.has_invalid_discount,
        price_drop_percentage: entry.price_drop_percentage,
        requires_manual_review: entry.requires_manual_review,
        validation_errors: entry.validation_errors
      },
      metadata: {
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        created_by: entry.created_by,
        version: entry.version,
        reason: entry.reason
      }
    }
    
    return NextResponse.json({
      success: true,
      data: response
    })
    
  } catch (error) {
    console.error('Waitlist entry API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate diff between current and proposed product data
function calculateDiff(currentData: Record<string, unknown> | null, proposedData: Record<string, unknown>) {
  const diff: Record<string, unknown> = {}
  const importantFields = [
    'name', 'price', 'discount_price', 'stock', 'description', 
    'stock_code', 'image_url', 'brand_id', 'category_id', 'status'
  ]
  
  importantFields.forEach(field => {
    const currentValue = currentData?.[field]
    const proposedValue = proposedData[field]
    
    if (currentValue !== proposedValue) {
      const changeType = typeof currentValue === 'number' && typeof proposedValue === 'number'
        ? 'numeric'
        : 'text'
      
      diff[field] = {
        current: currentValue,
        proposed: proposedValue,
        type: changeType
      }
      
      // Calculate percentage change for numeric fields
      if (changeType === 'numeric' && currentValue && proposedValue) {
        const percentageChange = ((proposedValue as number) - (currentValue as number)) / (currentValue as number) * 100
        diff[field] = {
          current: currentValue,
          proposed: proposedValue,
          type: changeType,
          percentage_change: Math.round(percentageChange * 100) / 100
        }
      }
    }
  })
  
  return diff
}