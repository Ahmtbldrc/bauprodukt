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
    
    // Get audit log entry
    const { data: entry, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Audit log entry not found' },
          { status: 404 }
        )
      }
      
      console.error('Audit log entry fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch audit log entry' },
        { status: 500 }
      )
    }
    
    // Get related entries (if any)
    const relatedEntries = await getRelatedEntries(supabase, entry)
    
    // Calculate state diff if before and after states exist
    const stateDiff = calculateStateDiff(entry.before_state, entry.after_state)
    
    const response = {
      ...entry,
      timestamp_formatted: new Date(entry.timestamp).toLocaleString(),
      action_category: categorizeAction(entry.action),
      target_summary: getTargetSummary(entry.target_type, entry.target_id, entry.after_state),
      state_diff: stateDiff,
      related_entries: relatedEntries,
      metadata: {
        has_before_state: !!entry.before_state,
        has_after_state: !!entry.after_state,
        has_reason: !!entry.reason,
        state_change_count: stateDiff ? Object.keys(stateDiff).length : 0
      }
    }
    
    return NextResponse.json({
      success: true,
      data: response
    })
    
  } catch (error) {
    console.error('Audit log entry API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get related audit entries
async function getRelatedEntries(supabase: any, entry: any) {
  try {
    // Get other entries for the same target
    const { data: sameTargetEntries } = await supabase
      .from('audit_log')
      .select('id, action, timestamp, actor')
      .eq('target_type', entry.target_type)
      .eq('target_id', entry.target_id)
      .neq('id', entry.id)
      .order('timestamp', { ascending: false })
      .limit(10)
    
    // Get other entries by the same actor in the same time period (±1 hour)
    const timeWindow = 60 * 60 * 1000 // 1 hour in milliseconds
    const entryTime = new Date(entry.timestamp).getTime()
    const startTime = new Date(entryTime - timeWindow).toISOString()
    const endTime = new Date(entryTime + timeWindow).toISOString()
    
    const { data: sameActorEntries } = await supabase
      .from('audit_log')
      .select('id, action, timestamp, target_type, target_id')
      .eq('actor', entry.actor)
      .gte('timestamp', startTime)
      .lte('timestamp', endTime)
      .neq('id', entry.id)
      .order('timestamp', { ascending: false })
      .limit(5)
    
    return {
      same_target: sameTargetEntries || [],
      same_actor_timeframe: sameActorEntries || []
    }
  } catch (error) {
    console.error('Failed to fetch related entries:', error)
    return { same_target: [], same_actor_timeframe: [] }
  }
}

// Helper function to calculate state differences
function calculateStateDiff(beforeState: any, afterState: any) {
  if (!beforeState && !afterState) return null
  if (!beforeState) return { added: afterState }
  if (!afterState) return { removed: beforeState }
  
  const diff: any = {}
  const allKeys = new Set([...Object.keys(beforeState), ...Object.keys(afterState)])
  
  allKeys.forEach(key => {
    const before = beforeState[key]
    const after = afterState[key]
    
    if (before !== after) {
      diff[key] = {
        before,
        after,
        type: getChangeType(before, after)
      }
      
      // Calculate percentage change for numeric values
      if (typeof before === 'number' && typeof after === 'number' && before !== 0) {
        diff[key].percentage_change = Math.round(((after - before) / before) * 100 * 100) / 100
      }
    }
  })
  
  return Object.keys(diff).length > 0 ? diff : null
}

// Helper function to determine change type
function getChangeType(before: any, after: any): string {
  if (before === null || before === undefined) return 'added'
  if (after === null || after === undefined) return 'removed'
  if (typeof before !== typeof after) return 'type_changed'
  if (typeof before === 'number') return 'value_changed'
  if (typeof before === 'string') return 'text_changed'
  if (typeof before === 'boolean') return 'boolean_changed'
  return 'modified'
}

// Helper functions (same as in the main audit route)
function categorizeAction(action: string): string {
  if (action.includes('approve')) return 'approval'
  if (action.includes('reject')) return 'rejection'
  if (action.includes('create')) return 'creation'
  if (action.includes('update')) return 'modification'
  if (action.includes('delete')) return 'deletion'
  if (action.includes('bulk')) return 'bulk_operation'
  return 'other'
}

function getTargetSummary(targetType: string, targetId: string, afterState: any): string {
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