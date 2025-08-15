import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Middleware ensures admin access
  try {
    const supabase = createClient()
    const userEmail = request.headers.get('x-user-email') || 'unknown'
    
    // Parse request body
    const body = await request.json()
    const { ids, skipInvalid = false } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids array is required' },
        { status: 400 }
      )
    }
    
    const results = {
      approved: 0,
      failed: 0,
      errors: [] as Array<{ id: string; error: string }>
    }
    
    // Process each entry individually
    for (const id of ids) {
      try {
        // Get waitlist entry
        const { data: entry, error: fetchError } = await supabase
          .from('waitlist_updates')
          .select('*')
          .eq('id', id)
          .single()
        
        if (fetchError || !entry) {
          results.failed++
          results.errors.push({
            id,
            error: 'Waitlist entry not found'
          })
          continue
        }
        
        // Skip invalid entries if requested
        if (skipInvalid && (!entry.is_valid || entry.has_invalid_discount)) {
          results.failed++
          results.errors.push({
            id,
            error: 'Entry has validation errors and skipInvalid is true'
          })
          continue
        }
        
        let productId = entry.product_id
        let action = ''
        
        if (entry.product_id) {
          // Update existing product
          action = 'approve_update'
          
          const updateData = {
            ...entry.payload_json,
            status: 'active',
            updated_at: new Date().toISOString()
          }
          
          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', entry.product_id)
          
          if (updateError) {
            throw new Error(`Failed to update product: ${updateError.message}`)
          }
        } else {
          // Create new product
          action = 'approve_new'
          
          const newProductData = {
            ...entry.payload_json,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: newProduct, error: createError } = await supabase
            .from('products')
            .insert(newProductData)
            .select('id')
            .single()
          
          if (createError) {
            throw new Error(`Failed to create product: ${createError.message}`)
          }
          
          productId = newProduct.id
        }
        
        // Delete waitlist entry
        await supabase
          .from('waitlist_updates')
          .delete()
          .eq('id', id)
        
        // Create audit log
        try {
          await supabase
            .from('audit_log')
            .insert({
              actor: userEmail,
              action: 'bulk_approve',
              target_type: 'waitlist_update',
              target_id: id,
              after_state: {
                product_id: productId,
                original_action: action,
                bulk_operation: true
              },
              timestamp: new Date().toISOString(),
              reason: `Bulk approval - ${action}`
            })
        } catch (auditError) {
          console.error('Failed to create audit log for bulk approve:', auditError)
        }
        
        results.approved++
        
      } catch (error) {
        results.failed++
        results.errors.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Create summary audit log for bulk operation
    try {
      await supabase
        .from('audit_log')
        .insert({
          actor: userEmail,
          action: 'bulk_approve_summary',
          target_type: 'waitlist_bulk_operation',
          target_id: 'bulk_' + Date.now(),
          after_state: {
            total_requested: ids.length,
            approved: results.approved,
            failed: results.failed,
            skip_invalid: skipInvalid
          },
          timestamp: new Date().toISOString(),
          reason: `Bulk approve operation: ${results.approved} approved, ${results.failed} failed`
        })
    } catch (auditError) {
      console.error('Failed to create bulk operation audit log:', auditError)
    }
    
    return NextResponse.json({
      success: true,
      data: results
    })
    
  } catch (error) {
    console.error('Bulk approve API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}