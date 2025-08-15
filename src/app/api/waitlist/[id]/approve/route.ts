import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  // Middleware ensures admin access
  try {
    const supabase = createClient()
    const { id } = await params
    const userEmail = request.headers.get('x-user-email') || 'unknown'
    
    // Get waitlist entry
    const { data: entry, error: fetchError } = await supabase
      .from('waitlist_updates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Waitlist entry not found' },
          { status: 404 }
        )
      }
      
      console.error('Waitlist entry fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch waitlist entry' },
        { status: 500 }
      )
    }
    
    let productId = entry.product_id
    let action = ''
    let beforeState = null
    
    try {
      if (entry.product_id) {
        // This is an update to existing product
        action = 'approve_update'
        
        // Get current product state for audit
        const { data: currentProduct } = await supabase
          .from('products')
          .select('*')
          .eq('id', entry.product_id)
          .single()
        
        beforeState = currentProduct
        
        // Update existing product
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
        // This is a new product
        action = 'approve_new'
        
        // Create new product
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
      
      // Delete waitlist entry after successful approval
      const { error: deleteError } = await supabase
        .from('waitlist_updates')
        .delete()
        .eq('id', id)
      
      if (deleteError) {
        console.error('Failed to delete waitlist entry:', deleteError)
        // Don't fail the approval if we can't delete the entry
      }
      
      // Create audit log
      try {
        await supabase
          .from('audit_log')
          .insert({
            actor: userEmail,
            action: action,
            target_type: 'waitlist_update',
            target_id: id,
            before_state: beforeState,
            after_state: {
              product_id: productId,
              waitlist_entry: entry,
              action: action
            },
            timestamp: new Date().toISOString(),
            reason: `Approved ${action === 'approve_new' ? 'new product' : 'product update'}`
          })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
        // Don't fail the approval if audit logging fails
      }
      
      return NextResponse.json({
        success: true,
        data: {
          product_id: productId,
          action: action === 'approve_new' ? 'created' : 'updated',
          message: `Product ${action === 'approve_new' ? 'created' : 'updated'} successfully`
        }
      })
      
    } catch (operationError) {
      console.error('Approval operation error:', operationError)
      return NextResponse.json(
        { error: operationError instanceof Error ? operationError.message : 'Failed to approve entry' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Waitlist approve API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}