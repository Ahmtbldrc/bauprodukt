import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateCategory } from '@/schemas/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const parentId = searchParams.get('parent_id')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('categories')
      .select(`
        *,
        parent:parent_id(*)
      `, { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Filter by parent category
    if (parentId) {
      query = query.eq('parent_id', parentId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Categories fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
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
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = validateCategory(body)
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

    // Validate parent category exists if provided
    if (validation.data.parent_id) {
      const { error: parentError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', validation.data.parent_id)
        .single()

      if (parentError) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([validation.data])
      .select(`
        *,
        parent:parent_id(*)
      `)
      .single()

    if (error) {
      console.error('Category creation error:', error)
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Category creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 