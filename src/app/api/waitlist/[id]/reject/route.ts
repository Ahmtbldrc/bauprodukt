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
    
    // Parse request body for rejection reason
    const body = await request.json().catch(() => ({}))
    const rejectionReason = body.reason || 'No reason provided'
    
    // Get waitlist entry
    const { data: entry, error: fetchError } = await (supabase as any)
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
    
    try {
      // Delete waitlist entry
      const { error: deleteError } = await (supabase as any)
        .from('waitlist_updates')
        .delete()
        .eq('id', id)
      
      if (deleteError) {
        throw new Error(`Failed to delete waitlist entry: ${deleteError.message}`)
      }
      
      // Create audit log for rejection
      try {
        await (supabase as any)
          .from('audit_log')
          .insert({
            actor: userEmail,
            action: entry.product_id ? 'reject_update' : 'reject_new',
            target_type: 'waitlist_update',
            target_id: id,
            before_state: entry,
            after_state: {
              status: 'rejected',
              rejection_reason: rejectionReason
            },
            timestamp: new Date().toISOString(),
            reason: rejectionReason
          })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
        // Don't fail the rejection if audit logging fails
      }
      
      return NextResponse.json({
        success: true,
        data: {
          message: 'Waitlist entry rejected successfully',
          rejection_reason: rejectionReason,
          entry_type: entry.product_id ? 'update' : 'new',
          product_slug: entry.product_slug
        }
      })
      
    } catch (operationError) {
      console.error('Rejection operation error:', operationError)
      return NextResponse.json(
        { error: operationError instanceof Error ? operationError.message : 'Failed to reject entry' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Waitlist reject API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}