import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateCategorySchema } from '@/schemas/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        parent:parent_id(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      
      console.error('Category fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch category' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Category API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { subcategory_ids } = body || {}
    
    const validation = updateCategorySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Generate slug from name if name is being updated and slug is not provided
    if (validation.data.name && !validation.data.slug) {
      validation.data.slug = validation.data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }

    // Validate parent category exists if provided and prevent self-reference
    if (validation.data.parent_id) {
      if (validation.data.parent_id === id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }

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

    const { data, error } = await (supabase as any)
      .from('categories')
      .update(validation.data)
      .eq('id', id)
      .select(`
        *,
        parent:parent_id(*)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }

      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 409 }
        )
      }

      console.error('Category update error:', error)
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      )
    }

    // Optional bulk assign subcategories to this category (as relations in category_parents)
    if (Array.isArray(subcategory_ids)) {
      const ids: string[] = subcategory_ids.filter((cid: string) => cid && cid !== id)

      // Fetch existing relations for this parent
      const { data: existingRels, error: existingErr } = await (supabase as any)
        .from('category_parents')
        .select('category_id, order_index')
        .eq('parent_id', id)

      if (existingErr) {
        console.error('Fetch existing subcategory relations error:', existingErr)
      }

      const existingIds = new Set((existingRels || []).map((r: any) => r.category_id))
      const newIds = ids.filter(cid => !existingIds.has(cid))

      // Determine next order_index start
      const currentMax = existingRels && existingRels.length > 0
        ? Math.max(...existingRels.map((r: any) => r.order_index || 0))
        : -1

      // Insert only new relations at the end
      if (newIds.length > 0) {
        const toInsert = newIds.map((cid, idx) => ({ parent_id: id, category_id: cid, order_index: currentMax + 1 + idx }))
        const { error: insertErr } = await (supabase as any)
          .from('category_parents')
          .insert(toInsert)
        if (insertErr) {
          console.error('Insert new subcategory relations error:', insertErr)
        }
      }

      // Synchronize primary parent_id for included subcategories
      if (ids.length > 0) {
        const { error: setPrimaryErr } = await (supabase as any)
          .from('categories')
          .update({ parent_id: id })
          .in('id', ids)
        if (setPrimaryErr) {
          console.error('Update subcategories primary parent_id error:', setPrimaryErr)
        }
      }

      // Remove relations not in payload (replace behavior)
      const inList = ids.length > 0 ? `(${ids.map((i: string) => `'${i}'`).join(',')})` : '(NULL)'
      const { error: delError } = await (supabase as any)
        .from('category_parents')
        .delete()
        .eq('parent_id', id)
        .not('category_id', 'in', inList)
      if (delError) {
        console.error('Remove missing subcategory relations error:', delError)
      }

      // Unset primary parent_id for removed subcategories that pointed to this parent
      const removedIds = [...existingIds].filter((cid) => !ids.includes(cid))
      if (removedIds.length > 0) {
        const { error: unsetPrimaryErr } = await (supabase as any)
          .from('categories')
          .update({ parent_id: null })
          .in('id', removedIds)
          .eq('parent_id', id)
        if (unsetPrimaryErr) {
          console.error('Unset removed subcategories primary parent_id error:', unsetPrimaryErr)
        }
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Category update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if there are products using this category
    const { data: productsUsingCategory, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (productsError) {
      console.error('Products check error:', productsError)
      return NextResponse.json(
        { error: 'Failed to check category usage' },
        { status: 500 }
      )
    }

    if (productsUsingCategory && productsUsingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category: it is being used by products' },
        { status: 409 }
      )
    }

    // Detach any subcategory relations before deletion
    const { error: relDeleteError } = await (supabase as any)
      .from('category_parents')
      .delete()
      .eq('parent_id', id)
    if (relDeleteError) {
      console.error('Failed to delete subcategory relations:', relDeleteError)
      // Continue anyway; we'll also unset legacy parent_id links
    }

    const { error: unsetSubsError } = await (supabase as any)
      .from('categories')
      .update({ parent_id: null })
      .eq('parent_id', id)
    if (unsetSubsError) {
      console.error('Failed to unset legacy parent_id for subcategories:', unsetSubsError)
      // Non-fatal; proceed to delete parent to avoid blocking
    }

    // Check if category exists before deletion
    const { error: fetchError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      
      console.error('Category fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch category' },
        { status: 500 }
      )
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Category deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Category deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 