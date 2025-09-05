import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type ReorderItem = {
  id: string
  order_index: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const items: ReorderItem[] = Array.isArray(body?.orders) ? body.orders : []

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'orders array is required' }, { status: 400 })
    }

    // Validate payload
    for (const item of items) {
      if (!item?.id || typeof item.order_index !== 'number' || item.order_index < 0) {
        return NextResponse.json({ error: 'Invalid orders payload' }, { status: 400 })
      }
    }

    // Fetch to ensure all ids are main categories (parent_id IS NULL)
    const ids = items.map(i => i.id)
    const { data: cats, error: fetchError } = await supabase
      .from('categories')
      .select('id, parent_id')
      .in('id', ids)

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to validate categories' }, { status: 500 })
    }

    const nonMain = (cats as Array<{ id: string; parent_id: string | null }> | null || []).filter(c => c.parent_id !== null)
    if (nonMain.length > 0) {
      return NextResponse.json({ error: 'Only main categories can be reordered' }, { status: 400 })
    }

    // Bulk update orders
    const updates = items.map(({ id, order_index }) =>
      (supabase as any)
        .from('categories')
        .update({ order_index })
        .eq('id', id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some(r => (r as any).error)
    if (hasError) {
      const firstError = results.find(r => (r as any).error) as any
      console.error('Reorder categories error:', firstError.error)
      return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 })
    }

    // Return refreshed ordered list
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('order_index', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch updated categories' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Categories reorder API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


