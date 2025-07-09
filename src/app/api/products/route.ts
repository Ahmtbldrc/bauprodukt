import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateProduct } from '@/schemas/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const brand = searchParams.get('brand')
    const category = searchParams.get('category')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('products')
      .select(`
        *,
        brand:brands(*),
        category:categories(*)
      `)
      .range(from, to)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (brand) {
      query = query.eq('brand_id', brand)
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Products fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
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
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = validateProduct(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Generate slug from name if not provided
    if (!body.slug) {
      body.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }

    const { data, error } = await supabase
      .from('products')
      .insert([validation.data])
      .select(`
        *,
        brand:brands(*),
        category:categories(*)
      `)
      .single()

    if (error) {
      console.error('Product creation error:', error)
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Product with this slug already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Product creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 