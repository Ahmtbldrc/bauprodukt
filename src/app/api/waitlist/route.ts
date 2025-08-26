import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Middleware ensures admin access
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const type = searchParams.get('type') // 'new', 'update', 'all'
    const requiresReview = searchParams.get('requires_review')
    const hasInvalidDiscount = searchParams.get('has_invalid_discount')
    const reason = searchParams.get('reason')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = (supabase as any)
      .from('waitlist_updates')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (type === 'new') {
      query = query.is('product_id', null)
    } else if (type === 'update') {
      query = query.not('product_id', 'is', null)
    }
    
    if (requiresReview === 'true') {
      query = query.eq('requires_manual_review', true)
    }
    
    if (hasInvalidDiscount === 'true') {
      query = query.eq('has_invalid_discount', true)
    }
    
    if (reason) {
      query = query.eq('reason', reason)
    }
    
    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })
    
    const { data, error, count } = await (query as any)
    
    if (error) {
      console.error('Waitlist fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch waitlist entries' },
        { status: 500 }
      )
    }
    
    // Format the response data
    const formattedData = (data || []).map((entry: any) => ({
      ...entry,
      type: entry.product_id ? 'update' : 'new',
      created_at: entry.created_at,
      updated_at: entry.updated_at || entry.created_at,
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Middleware ensures admin access
  try {
    const supabase = createClient()
    const body = await request.json()
    
    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown'
    const userRole = request.headers.get('x-user-role')
    
    // Verify admin access
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'Waitlist entry ID is required' },
        { status: 400 }
      )
    }
    
    // Get current waitlist entry for audit trail
    const { data: currentEntry, error: fetchError } = await (supabase as any)
      .from('waitlist_updates')
      .select('*')
      .eq('id', body.id)
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
    
    // Prepare update data - only allow specific fields to be updated
    const allowedUpdates = {
      payload_json: body.payload_json,
      diff_summary: body.diff_summary,
      reason: body.reason,
      is_valid: body.is_valid,
      validation_errors: body.validation_errors,
      requires_manual_review: body.requires_manual_review,
      price_drop_percentage: body.price_drop_percentage,
      has_invalid_discount: body.has_invalid_discount,
      version: (currentEntry.version || 0) + 1
    }
    
    // Remove undefined values
    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(allowedUpdates)) {
      if (value !== undefined) {
        updateData[key] = value
      }
    }
    
    // Validate reason if provided
    if (updateData.reason && typeof updateData.reason === 'string') {
      const validReasons = ['new_product', 'price_change', 'variant_change', 'name_change', 'image_change', 'sku_change', 'multiple_changes']
      if (!validReasons.includes(updateData.reason)) {
        return NextResponse.json(
          { error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` },
          { status: 400 }
        )
      }
    }
    
    // Update the waitlist entry
    const { data: updatedEntry, error: updateError } = await (supabase as any)
      .from('waitlist_updates')
      .update(updateData)
      .eq('id', body.id)
      .select('*')
      .single()
    
    if (updateError) {
      console.error('Waitlist update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update waitlist entry' },
        { status: 500 }
      )
    }
    
    // Create audit log entry
    try {
      await (supabase as any)
        .from('audit_log')
        .insert({
          actor: userEmail,
          action: 'manual_edit',
          target_type: 'waitlist_update',
          target_id: body.id,
          before_state: currentEntry,
          after_state: updatedEntry,
          timestamp: new Date().toISOString(),
          reason: 'Admin updated waitlist entry'
        })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the update if audit logging fails
    }
    
    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'Waitlist entry updated successfully'
    })
    
  } catch (error) {
    console.error('Waitlist PUT API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}