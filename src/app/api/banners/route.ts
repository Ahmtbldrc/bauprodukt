import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateBanner } from '@/schemas/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const isActive = searchParams.get('is_active')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('banners')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('order_index', { ascending: true })

    // Filter by active status
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Banners fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch banners' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Banners API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = validateBanner(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    // If no order_index provided, set it to the next available position
    if (validation.data.order_index === undefined) {
      const { data: lastBanner } = await supabase
        .from('banners')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)

      validation.data.order_index = lastBanner && lastBanner.length > 0 
        ? lastBanner[0].order_index + 1 
        : 0
    }

    const { data, error } = await supabase
      .from('banners')
      .insert([validation.data])
      .select()
      .single()

    if (error) {
      console.error('Banner creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create banner' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Banner creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 