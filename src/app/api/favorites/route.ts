import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'x-user-id required' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('product_id, created_at')
      .eq('user_id', userId)

    if (error) {
      console.error('Favorites fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Favorites GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'x-user-id required' }, { status: 401 })
    }

    const { product_id } = await req.json()
    if (!product_id) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, product_id }])

    if (error && error.code !== '23505') {
      console.error('Favorites insert error:', error)
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Favorites POST API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


