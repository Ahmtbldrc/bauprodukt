import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MeterData } from '@/types/database'

export type PlumberProtocolInsert = {
  plumber_calculation_id?: string
  
  // Installation Location
  person_type?: 'person' | 'company'
  company_name?: string
  contact_person?: string
  person_name?: string
  street?: string
  additional_info?: string
  postal_code?: string
  city?: string
  phone?: string
  email?: string
  
  // Meter Data (JSONB)
  old_meter_data?: MeterData | null
  new_meter_data?: MeterData | null
  
  // Additional
  notes?: string
}

// POST - Create new protocol
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient()
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body: PlumberProtocolInsert = await request.json()

    // If plumber_calculation_id is provided, verify it belongs to the user
    if (body.plumber_calculation_id) {
      const { data: calculation, error: calcError } = await supabase
        .from('plumber_calculations')
        .select('id')
        .eq('id', body.plumber_calculation_id)
        .eq('user_id', user.id)
        .single()

      if (calcError || !calculation) {
        return NextResponse.json(
          { error: 'Berechnung nicht gefunden' },
          { status: 404 }
        )
      }
    }

    // Prepare insert data
    const insertData: any = {
      ...body,
      user_id: user.id,
    }

    const { data, error } = await supabase
      .from('plumber_protocols')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating protocol:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      data,
      message: 'Protokoll erfolgreich erstellt' 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating protocol:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

