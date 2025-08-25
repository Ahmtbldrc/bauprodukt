import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Middleware ensures admin access
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const actor = searchParams.get('actor')
    const action = searchParams.get('action')
    const targetType = searchParams.get('target_type')
    const targetId = searchParams.get('target_id')
    const from = searchParams.get('from') // Date string
    const to = searchParams.get('to') // Date string
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (actor) {
      query = query.ilike('actor', `%${actor}%`)
    }
    
    if (action) {
      query = query.eq('action', action)
    }
    
    if (targetType) {
      query = query.eq('target_type', targetType)
    }
    
    if (targetId) {
      query = query.eq('target_id', targetId)
    }
    
    if (from) {
      try {
        const fromDate = new Date(from).toISOString()
        query = query.gte('timestamp', fromDate)
      } catch {
        return NextResponse.json(
          { error: 'Invalid from date format' },
          { status: 400 }
        )
      }
    }
    
    if (to) {
      try {
        const toDate = new Date(to).toISOString()
        query = query.lte('timestamp', toDate)
      } catch {
        return NextResponse.json(
          { error: 'Invalid to date format' },
          { status: 400 }
        )
      }
    }
    
    // Pagination
    const offset = (page - 1) * limit
    const rangeEnd = offset + limit - 1
    query = query.range(offset, rangeEnd).order('timestamp', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Audit log fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch audit log entries' },
        { status: 500 }
      )
    }
    
    // Format the response data with additional computed fields
    const formattedData = (data || []).map(entry => ({
      ...(entry as any),
      timestamp_formatted: new Date((entry as any).timestamp).toLocaleString(),
      has_state_changes: !!((entry as any).before_state || (entry as any).after_state),
      action_category: categorizeAction((entry as any).action),
      target_summary: getTargetSummary((entry as any).target_type, (entry as any).target_id, (entry as any).after_state)
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
    console.error('Audit log API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to categorize actions
function categorizeAction(action: string): string {
  if (action.includes('approve')) return 'approval'
  if (action.includes('reject')) return 'rejection'
  if (action.includes('create')) return 'creation'
  if (action.includes('update')) return 'modification'
  if (action.includes('delete')) return 'deletion'
  if (action.includes('bulk')) return 'bulk_operation'
  return 'other'
}

// Helper function to create target summaries
function getTargetSummary(targetType: string, targetId: string, afterState: Record<string, unknown> | null): string {
  switch (targetType) {
    case 'product':
      return afterState?.name ? `Product: ${afterState.name}` : `Product ID: ${targetId}`
    case 'waitlist_update':
      return afterState?.product_slug ? `Waitlist: ${afterState.product_slug}` : `Waitlist ID: ${targetId}`
    case 'waitlist_bulk_operation':
      return afterState?.total_requested ? `Bulk operation: ${afterState.total_requested} items` : 'Bulk operation'
    default:
      return `${targetType}: ${targetId}`
  }
}