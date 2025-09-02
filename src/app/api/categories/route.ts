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
    const categoryType = searchParams.get('category_type') as 'main' | 'sub' | null

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
    if (parentId !== null) {
      if (parentId === 'null') {
        // Special handling: parent_id IS NULL
        query = (query as any).is('parent_id', null)
      } else if (parentId) {
        query = query.eq('parent_id', parentId)
      }
    }

    // Filter by category type if provided
    if (categoryType === 'main') {
      // main categories should not have a parent
      query = (query as any).is('parent_id', null)
    } else if (categoryType === 'sub') {
      // sub categories should have a parent
      query = (query as any).not('parent_id', 'is', null)
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
    const { subcategory_ids, parent_ids } = body || {}

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
      const { data: parentCat, error: parentError } = await supabase
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

    const { data, error } = await (supabase as any)
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

    // Optional bulk assignment of subcategories to a newly created MAIN category
    if (Array.isArray(subcategory_ids) && subcategory_ids.length > 0) {
      // Only meaningful for main categories where we want to attach subs
      try {
        const { error: bulkError } = await (supabase as any)
          .from('categories')
          .update({ parent_id: data.id })
          .in('id', subcategory_ids)

        if (bulkError) {
          console.error('Bulk assign subcategories error:', bulkError)
          // Non-fatal: return created main category with a warning
          return NextResponse.json({
            ...data,
            _warning: 'Category created but assigning some subcategories failed'
          }, { status: 201 })
        }
      } catch (e) {
        console.error('Bulk assign subcategories exception:', e)
        return NextResponse.json({
          ...data,
          _warning: 'Category created but assigning some subcategories failed'
        }, { status: 201 })
      }
    }

    // Optional assign multiple parents to the newly created category (subcategory use-case)
    if (Array.isArray(parent_ids) && parent_ids.length > 0) {
      // Filter invalid/self references
      const parentIdsFiltered = parent_ids.filter((pid: string) => pid && pid !== data.id)
      if (parentIdsFiltered.length > 0) {
        // Set primary parent_id for backward compatibility (first parent)
        await (supabase as any)
          .from('categories')
          .update({ parent_id: parentIdsFiltered[0] })
          .eq('id', data.id)

        // Insert relations into junction table
        const relations = parentIdsFiltered.map((pid: string) => ({ category_id: data.id, parent_id: pid }))
        const { error: relError } = await (supabase as any)
          .from('category_parents')
          .insert(relations)
        if (relError) {
          console.error('Create category - relation insert error:', relError)
        }
      }
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