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
    
    let query = supabase
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
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Waitlist fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch waitlist entries' },
        { status: 500 }
      )
    }
    
    // Format the response data
    const formattedData = (data || []).map(entry => ({
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