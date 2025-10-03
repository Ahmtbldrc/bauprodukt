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

// Helper function to clean MeterData - remove "Grösse" placeholder values
function cleanMeterData(data: MeterData | null | undefined): MeterData | null | undefined {
  if (!data) return data
  
  const cleaned = { ...data }
  
  // Remove "Grösse" from inlet_size and outlet_size
  // Using type assertion as 'Grösse' is a UI placeholder not in PipeSize type
  if ((cleaned.inlet_size as any) === 'Grösse' || cleaned.inlet_size === undefined || (cleaned.inlet_size as any) === '') {
    delete cleaned.inlet_size
  }
  if ((cleaned.outlet_size as any) === 'Grösse' || cleaned.outlet_size === undefined || (cleaned.outlet_size as any) === '') {
    delete cleaned.outlet_size
  }
  
  return cleaned
}

// GET - Get protocol by calculation_id
export async function GET(request: NextRequest) {
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

    // Get calculation_id from query params
    const { searchParams } = new URL(request.url)
    const calculationId = searchParams.get('calculation_id')

    if (!calculationId) {
      return NextResponse.json(
        { error: 'calculation_id ist erforderlich' },
        { status: 400 }
      )
    }

    // Query protocol by calculation_id and user_id
    const { data, error } = await supabase
      .from('plumber_protocols')
      .select('*')
      .eq('plumber_calculation_id', calculationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching protocol:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      data,
      message: data ? 'Protokoll gefunden' : 'Kein Protokoll gefunden' 
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching protocol:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
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

    // Prepare upsert data
    const upsertData: any = {
      ...body,
      user_id: user.id,
      old_meter_data: cleanMeterData(body.old_meter_data),
      new_meter_data: cleanMeterData(body.new_meter_data),
    }

    // Use upsert to insert or update based on plumber_calculation_id
    // If plumber_calculation_id exists, it will update; otherwise insert new
    const { data, error } = await supabase
      .from('plumber_protocols')
      .upsert(upsertData, {
        onConflict: 'plumber_calculation_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating protocol:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      data,
      message: 'Protokoll erfolgreich gespeichert' 
    }, { status: 200 })

  } catch (error) {
    console.error('Error creating protocol:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

