import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    
    // Get conversion factors for this product
    const { data, error } = await supabase
      .from('product_conversion_factors')
      .select('*')
      .eq('product_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No conversion factors found, return defaults
        return NextResponse.json({
          length_units: false,
          weight_units: false,
          volume_units: false,
          temperature_units: false
        })
      }
      
      console.error('Conversion factors fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversion factors' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || {
      length_units: false,
      weight_units: false,
      volume_units: false,
      temperature_units: false
    })
  } catch (error) {
    console.error('Conversion factors API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
