import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PlumberCalculation } from '@/types/database'

// POST - Duplicate calculation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    // Get original calculation
    const { data: original, error: fetchError } = await supabase
      .from('plumber_calculations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !original) {
      return NextResponse.json(
        { error: 'Berechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Get new name from request body (optional)
    const body = await request.json().catch(() => ({})) as { newName?: string }
    const originalCalc = original as PlumberCalculation
    const newName = body.newName || `${originalCalc.name} (Kopie)`

    // Create duplicate
    const { data, error } = await (supabase as any)
      .from('plumber_calculations')
      .insert({
        user_id: user.id,
        name: newName,
        method: originalCalc.method,
        include_hydrant_extra: originalCalc.include_hydrant_extra,
        total_lu: originalCalc.total_lu,
        total_lps: originalCalc.total_lps,
        total_m3_per_hour: originalCalc.total_m3_per_hour,
        recommended_dn: originalCalc.recommended_dn,
        fixture_counts: originalCalc.fixture_counts
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: data as PlumberCalculation }, { status: 201 })
  } catch (error) {
    console.error('Error duplicating calculation:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

