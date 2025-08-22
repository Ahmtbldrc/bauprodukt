import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get conversion factors for a product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('product_conversion_factors')
      .select('*')
      .eq('product_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No conversion factors found, return defaults
        return NextResponse.json({
          product_id: id,
          length_units: true,
          weight_units: true,
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

    return NextResponse.json(data)
  } catch (error) {
    console.error('Conversion factors API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update conversion factors for a product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()
    
    const { length_units, weight_units, volume_units, temperature_units } = body

    // Check if conversion factors already exist
    const { data: existingData } = await supabase
      .from('product_conversion_factors')
      .select('id')
      .eq('product_id', id)
      .single()

    let result

    if (existingData) {
      // Update existing
      const { data, error } = await supabase
        .from('product_conversion_factors')
        .update({
          length_units: length_units ?? true,
          weight_units: weight_units ?? true,
          volume_units: volume_units ?? false,
          temperature_units: temperature_units ?? false
        })
        .eq('product_id', id)
        .select('*')
        .single()

      if (error) {
        console.error('Conversion factors update error:', error)
        return NextResponse.json(
          { error: 'Failed to update conversion factors' },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('product_conversion_factors')
        .insert({
          product_id: id,
          length_units: length_units ?? true,
          weight_units: weight_units ?? true,
          volume_units: volume_units ?? false,
          temperature_units: temperature_units ?? false
        })
        .select('*')
        .single()

      if (error) {
        console.error('Conversion factors creation error:', error)
        return NextResponse.json(
          { error: 'Failed to create conversion factors' },
          { status: 500 }
        )
      }

      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Conversion factors API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete conversion factors for a product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    
    const { error } = await supabase
      .from('product_conversion_factors')
      .delete()
      .eq('product_id', id)

    if (error) {
      console.error('Conversion factors deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete conversion factors' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Conversion factors deleted successfully' })
  } catch (error) {
    console.error('Conversion factors deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
