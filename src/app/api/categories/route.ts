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

    console.info('[GET /api/categories] params:', { page, limit, search, parentId, categoryType })

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('categories')
      .select(`
        *,
        parent:parent_id(*)
      `, { count: 'exact' })
      .range(from, to)

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Filter by parent category if provided
    if (parentId !== null) {
      if (parentId === 'null') {
        query = (query as any).is('parent_id', null)
      } else if (parentId) {
        query = query.eq('parent_id', parentId)
      }
    }

    // Filter by category type if provided (explicit field, not inferred from parent_id)
    if (categoryType === 'main') {
      query = query.eq('category_type', 'main')
      query = query.order('order_index', { ascending: true })
    } else if (categoryType === 'sub') {
      query = query.eq('category_type', 'sub')
      query = query.order('created_at', { ascending: false })
    }

    // If no category type filter is provided, default order by created_at desc
    if (!categoryType) {
      query = query.order('created_at', { ascending: false })
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

    console.info('[POST /api/categories] Incoming body:', { ...body, file: undefined })

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

    // If client explicitly requested sub, honor it (avoid defaults overriding)
    if (body.category_type === 'sub') {
      (validation as any).data.category_type = 'sub'
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

    // Build final insert payload with explicit category_type resolution
    const toInsert = {
      ...validation.data,
      category_type:
        body.category_type === 'sub' || (validation as any).data.parent_id
          ? 'sub'
          : 'main',
    }

    console.info('[POST /api/categories] Insert payload:', toInsert)

    const { data, error } = await (supabase as any)
      .from('categories')
      .insert([toInsert])
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
      // Maintain legacy primary parent for subs
      try {
        const { error: bulkError } = await (supabase as any)
          .from('categories')
          .update({ parent_id: data.id })
          .in('id', subcategory_ids)

        if (bulkError) {
          console.error('Bulk assign subcategories (parent_id) error:', bulkError)
        }
      } catch (e) {
        console.error('Bulk assign subcategories (parent_id) exception:', e)
      }

      // Insert relations into junction table with proper ordering
      try {
        // Fetch existing relations for this parent to compute next order_index
        const { data: existingRels, error: existingErr } = await (supabase as any)
          .from('category_parents')
          .select('category_id, order_index')
          .eq('parent_id', data.id)

        if (existingErr) {
          console.error('Fetch existing relations on create error:', existingErr)
        }

        const existingIds = new Set((existingRels || []).map((r: any) => r.category_id))
        const currentMax = existingRels && existingRels.length > 0
          ? Math.max(...existingRels.map((r: any) => r.order_index || 0))
          : -1

        const toInsertRels = (subcategory_ids as string[])
          .filter((cid) => cid && !existingIds.has(cid))
          .map((cid, idx) => ({ parent_id: data.id, category_id: cid, order_index: currentMax + 1 + idx }))

        if (toInsertRels.length > 0) {
          const { error: insertErr } = await (supabase as any)
            .from('category_parents')
            .insert(toInsertRels)
          if (insertErr) {
            console.error('Insert subcategory relations on create error:', insertErr)
          }
        }
      } catch (e) {
        console.error('Insert subcategory relations on create exception:', e)
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