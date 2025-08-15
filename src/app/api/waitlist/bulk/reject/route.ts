import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Middleware ensures admin access
  try {
    const supabase = createClient()
    const userEmail = request.headers.get('x-user-email') || 'unknown'
    
    // Parse request body
    const body = await request.json()
    const { ids, reason = 'Bulk rejection' } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids array is required' },
        { status: 400 }
      )
    }
    
    const results = {
      rejected: 0,
      failed: 0,
      errors: [] as Array<{ id: string; error: string }>
    }
    
    // Get all entries first for audit logging
    const { data: entries, error: fetchError } = await supabase
      .from('waitlist_updates')
      .select('*')
      .in('id', ids)
    
    if (fetchError) {
      console.error('Failed to fetch waitlist entries for bulk reject:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch waitlist entries' },
        { status: 500 }
      )
    }
    
    // Process each entry
    for (const id of ids) {
      try {
        const entry = entries?.find(e => e.id === id)
        
        if (!entry) {
          results.failed++
          results.errors.push({
            id,
            error: 'Waitlist entry not found'
          })
          continue
        }
        
        // Delete waitlist entry
        const { error: deleteError } = await supabase
          .from('waitlist_updates')
          .delete()
          .eq('id', id)
        
        if (deleteError) {
          throw new Error(`Failed to delete waitlist entry: ${deleteError.message}`)
        }
        
        // Create audit log for each rejection
        try {
          await supabase
            .from('audit_log')
            .insert({
              actor: userEmail,
              action: 'bulk_reject',
              target_type: 'waitlist_update',
              target_id: id,
              before_state: entry,
              after_state: {
                status: 'rejected',
                rejection_reason: reason,
                bulk_operation: true
              },
              timestamp: new Date().toISOString(),
              reason: `Bulk rejection: ${reason}`
            })
        } catch (auditError) {
          console.error('Failed to create audit log for bulk reject:', auditError)
        }
        
        results.rejected++
        
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
          action: 'bulk_reject_summary',
          target_type: 'waitlist_bulk_operation',
          target_id: 'bulk_reject_' + Date.now(),
          after_state: {
            total_requested: ids.length,
            rejected: results.rejected,
            failed: results.failed,
            rejection_reason: reason
          },
          timestamp: new Date().toISOString(),
          reason: `Bulk reject operation: ${results.rejected} rejected, ${results.failed} failed - ${reason}`
        })
    } catch (auditError) {
      console.error('Failed to create bulk operation audit log:', auditError)
    }
    
    return NextResponse.json({
      success: true,
      data: results
    })
    
  } catch (error) {
    console.error('Bulk reject API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}