import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

type ChildOrder = { category_id: string; order_index: number }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: parentId } = await params
    const body = await request.json()
    const items: ChildOrder[] = Array.isArray(body) ? body : Array.isArray(body?.orders) ? body.orders : []
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'orders array is required' }, { status: 400 })
    }

    for (const item of items) {
      if (!item?.category_id || typeof item.order_index !== 'number' || item.order_index < 0) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      }
    }

    // Ensure relations exist
    const ids = items.map(i => i.category_id)
    const { data: rels, error: fetchError } = await (supabase as any)
      .from('category_parents')
      .select('parent_id, category_id')
      .eq('parent_id', parentId)
      .in('category_id', ids)

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to validate relations' }, { status: 500 })
    }

    if (!rels || rels.length !== ids.length) {
      return NextResponse.json({ error: 'Some relations do not exist' }, { status: 400 })
    }

    // Bulk updates
    const updates = items.map(({ category_id, order_index }) =>
      (supabase as any)
        .from('category_parents')
        .update({ order_index })
        .eq('parent_id', parentId)
        .eq('category_id', category_id)
    )
    const results = await Promise.all(updates)
    const hasError = results.some(r => (r as any).error)
    if (hasError) {
      const firstError = results.find(r => (r as any).error) as any
      console.error('Reorder children error:', firstError.error)
      return NextResponse.json({ error: 'Failed to reorder children' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Children reorder POST error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


