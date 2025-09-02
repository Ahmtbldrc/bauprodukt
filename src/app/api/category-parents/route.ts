import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/category-parents?category_ids=a,b,c
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryIdsParam = searchParams.get('category_ids') || ''
    const categoryIds = categoryIdsParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    let query = supabase
      .from('category_parents')
      .select(`
        category_id,
        parent:parent_id(id, name, slug)
      `)
      .order('category_id', { ascending: true })

    if (categoryIds.length > 0) {
      query = query.in('category_id', categoryIds)
    }

    const { data, error } = await query
    if (error) {
      console.error('Category parents fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch category relations' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Category parents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


