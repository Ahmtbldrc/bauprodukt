import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams { params: Promise<{ userId: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Find cart by user
    const { data: cart, error: cartErr } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (cartErr) {
      if (cartErr.code === 'PGRST116') {
        return NextResponse.json({
          cart_id: null,
          session_id: null,
          items: [],
          total_amount: 0,
          total_items: 0,
          cart_created_at: null,
          cart_updated_at: null,
          expires_at: null
        })
      }
      console.error('Cart fetch error:', cartErr)
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }

    // Fetch details by cart_id
    const { data, error } = await supabase
      .from('cart_details')
      .select('*')
      .eq('cart_id', cart.id)

    if (error) {
      console.error('Cart details fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch cart details' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        cart_id: cart.id,
        session_id: cart.session_id,
        items: [],
        total_amount: 0,
        total_items: 0,
        cart_created_at: cart.created_at,
        cart_updated_at: cart.updated_at,
        expires_at: cart.expires_at
      })
    }

    const cartInfo = data[0]
    const items = data
      .filter(item => item.item_id !== null)
      .map(item => ({
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

    const total_amount = items.reduce((sum, item) => sum + (item.total_price || 0), 0)
    const total_items = items.reduce((sum, item) => sum + (item.quantity || 0), 0)

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: cart, error: fetchError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ message: 'No cart to clear' })
      }
      console.error('Cart fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }

    const { error: deleteError } = await supabase
      .from('carts')
      .delete()
      .eq('id', cart.id)

    if (deleteError) {
      console.error('Cart deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Cart cleared successfully' })
  } catch (error) {
    console.error('Cart deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


