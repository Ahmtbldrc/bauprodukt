import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userId } = await req.json()

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'sessionId and userId required' },
        { status: 400 }
      )
    }

    // Find guest cart by session
    const { data: guestCart, error: guestErr } = await (supabase as any)
      .from('carts')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (guestErr) {
      if (guestErr.code === 'PGRST116') {
        return NextResponse.json({ message: 'No guest cart' })
      }
      console.error('Guest cart fetch error:', guestErr)
      return NextResponse.json({ error: 'Failed to fetch guest cart' }, { status: 500 })
    }

    // Find or create user cart
    let userCart
    const { data: existingUserCart, error: userCartErr } = await (supabase as any)
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (userCartErr && userCartErr.code !== 'PGRST116') {
      console.error('User cart fetch error:', userCartErr)
      return NextResponse.json({ error: 'Failed to fetch user cart' }, { status: 500 })
    }

    if (existingUserCart) {
      userCart = existingUserCart
    } else {
      const { data: created, error: createErr } = await (supabase as any)
        .from('carts')
        .insert([{ 
          user_id: userId,
          session_id: `temp_${userId}_${Date.now()}` // Geçici session_id ekle
        }])
        .select('*')
        .single()
      if (createErr) {
        console.error('User cart create error:', createErr)
        return NextResponse.json({ error: 'Failed to create user cart' }, { status: 500 })
      }
      userCart = created
    }

    // Merge items
    const { data: guestItems, error: itemsErr } = await (supabase as any)
      .from('cart_items')
      .select('*')
      .eq('cart_id', guestCart.id)

    if (itemsErr) {
      console.error('Guest items fetch error:', itemsErr)
      return NextResponse.json({ error: 'Failed to fetch guest cart items' }, { status: 500 })
    }

    for (const gi of guestItems || []) {
      const { data: existing, error: exErr } = await (supabase as any)
        .from('cart_items')
        .select('*')
        .eq('cart_id', userCart.id)
        .eq('product_id', gi.product_id)
        .is('variant_id', gi.variant_id ?? null)
        .single()

      if (exErr && exErr.code !== 'PGRST116') {
        console.error('Merge check error:', exErr)
        return NextResponse.json({ error: 'Failed to check existing item' }, { status: 500 })
      }

      if (existing) {
        const { error: updErr } = await (supabase as any)
          .from('cart_items')
          .update({ quantity: existing.quantity + gi.quantity })
          .eq('id', existing.id)
        if (updErr) {
          console.error('Merge update error:', updErr)
          return NextResponse.json({ error: 'Failed to update merged item' }, { status: 500 })
        }
      } else {
        const { error: insErr } = await (supabase as any)
          .from('cart_items')
          .insert([{ 
            cart_id: userCart.id, 
            product_id: gi.product_id, 
            variant_id: gi.variant_id, 
            quantity: gi.quantity, 
            price: gi.price 
          }])
        if (insErr) {
          console.error('Merge insert error:', insErr)
          return NextResponse.json({ error: 'Failed to insert merged item' }, { status: 500 })
        }
      }
    }

    // Remove guest cart
    const { error: delErr } = await (supabase as any)
      .from('carts')
      .delete()
      .eq('id', guestCart.id)

    if (delErr) {
      console.error('Guest cart delete error:', delErr)
      return NextResponse.json({ error: 'Failed to delete guest cart' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Merged' })
  } catch (error) {
    console.error('Cart merge API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


