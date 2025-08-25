import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Sepeti ve içindeki ürünleri getir
    const { data: rows, error } = await (supabase as any)
      .from('cart_details')
      .select('*')
      .eq('session_id', sessionId)

    if (error) {
      console.error('Cart fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cart' },
        { status: 500 }
      )
    }

    // Eğer sepet yoksa boş sepet döndür
    const data = (rows || []) as Array<{
      cart_id: string | null
      session_id: string
      cart_created_at: string | null
      cart_updated_at: string | null
      expires_at: string | null
      item_id: string | null
      product_id: string | null
      quantity: number | null
      item_price: number | null
      item_total: number | null
      product_name: string | null
      product_slug: string | null
      product_image: string | null
      product_stock: number | null
    }>

    if (!data || data.length === 0) {
      return NextResponse.json({
        cart_id: null,
        session_id: sessionId,
        items: [],
        total_amount: 0,
        total_items: 0,
        cart_created_at: null,
        cart_updated_at: null,
        expires_at: null
      })
    }

    // İlk kayıttan sepet bilgilerini al
    const cartInfo = data[0]
    
    // Items'ları organize et
    const items = data
      .filter((item) => item.item_id !== null)
      .map((item) => ({
        id: item.item_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.item_price,
        total_price: item.item_total,
        product: {
          id: item.product_id,
          name: item.product_name,
          slug: item.product_slug,
          image_url: item.product_image,
          stock: item.product_stock
        }
      }))

    // Toplam hesapla
    const total_amount = items.reduce((sum: number, item) => sum + (item.total_price || 0), 0)
    const total_items = items.reduce((sum: number, item) => sum + (item.quantity || 0), 0)

    return NextResponse.json({
      cart_id: cartInfo.cart_id,
      session_id: cartInfo.session_id,
      items,
      total_amount,
      total_items,
      cart_created_at: cartInfo.cart_created_at,
      cart_updated_at: cartInfo.cart_updated_at,
      expires_at: cartInfo.expires_at
    })
  } catch (error) {
    console.error('Cart API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Sepet zaten var mı kontrol et
    const { data: existingCart, error: fetchError } = await (supabase as any)
      .from('carts')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Cart check error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check existing cart' },
        { status: 500 }
      )
    }

    // Eğer sepet varsa, mevcut sepeti döndür
    if (existingCart) {
      return NextResponse.json({
        cart_id: existingCart.id,
        session_id: existingCart.session_id,
        items: [],
        total_amount: 0,
        total_items: 0,
        cart_created_at: existingCart.created_at,
        cart_updated_at: existingCart.updated_at,
        expires_at: existingCart.expires_at
      })
    }

    // Yeni sepet oluştur
    const { data: newCart, error: createError } = await (supabase as any)
      .from('carts')
      .insert([{ session_id: sessionId }])
      .select('*')
      .single()

    if (createError) {
      console.error('Cart creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create cart' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      cart_id: newCart.id,
      session_id: newCart.session_id,
      items: [],
      total_amount: 0,
      total_items: 0,
      cart_created_at: newCart.created_at,
      cart_updated_at: newCart.updated_at,
      expires_at: newCart.expires_at
    }, { status: 201 })
  } catch (error) {
    console.error('Cart creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Sepeti sil (CASCADE ile cart_items da silinir)
    const { error: deleteError } = await supabase
      .from('carts')
      .delete()
      .eq('session_id', sessionId)

    if (deleteError) {
      console.error('Cart deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to clear cart' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Cart cleared successfully'
    })
  } catch (error) {
    console.error('Cart deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 