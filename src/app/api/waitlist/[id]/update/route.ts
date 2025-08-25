import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()
    
    console.log('Waitlist update request for ID:', id)
    console.log('Request body:', body)
    
    // Get user info from middleware headers (optional for now)
    const userEmail = request.headers.get('x-user-email') || 'admin'
    const userRole = request.headers.get('x-user-role') || 'admin'
    
    // Temporarily disable auth check for development
    // TODO: Re-enable authentication middleware
    console.log('User:', userEmail, 'Role:', userRole)

    // Get current entry
    const { data: currentEntry, error: fetchError } = await supabase
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

    console.log('Current entry:', currentEntry)
    console.log('New payload:', body.payload_json)

    // Update the waitlist entry with new payload
    const { data, error } = await (supabase as any)
      .from('waitlist_updates')
      .update({
        payload_json: body.payload_json,
        updated_at: new Date().toISOString(),
        version: ((currentEntry as any)?.version || 0) + 1
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Waitlist update error:', error)
      return NextResponse.json(
        { error: 'Failed to update waitlist entry' },
        { status: 500 }
      )
    }

    console.log('Updated entry:', data)

    // Create audit log entry
    try {
      await supabase
        .from('audit_log')
        .insert({
          actor: userEmail,
          action: 'update_payload',
          target_type: 'waitlist_update',
          target_id: id,
          before_state: currentEntry,
          after_state: data,
          timestamp: new Date().toISOString(),
          reason: 'Admin updated waitlist entry payload'
        } as any)
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the update if audit logging fails
    }

    return NextResponse.json({
      success: true,
      data: data
    })
    
  } catch (error) {
    console.error('Waitlist update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
