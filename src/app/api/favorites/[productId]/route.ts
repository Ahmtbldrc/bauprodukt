import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams { params: Promise<{ productId: string }> }

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const userId = req.headers.get('x-user-id')
    const { productId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'x-user-id required' }, { status: 401 })
    }
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) {
      console.error('Favorites delete error:', error)
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Favorites DELETE API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


