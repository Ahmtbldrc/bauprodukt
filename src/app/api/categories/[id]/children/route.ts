import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: parentId } = await params

    const { data, error } = await (supabase as any)
      .from('category_parents')
      .select(`
        category_id,
        order_index,
        category:category_id(id, name, slug, emoji, icon_url, created_at)
      `)
      .eq('parent_id', parentId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Fetch children error:', error)
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Children GET error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


