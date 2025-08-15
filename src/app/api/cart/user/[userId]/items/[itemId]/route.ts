import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateUpdateCartItem } from '@/schemas/database'

interface RouteParams { params: Promise<{ userId: string, itemId: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, itemId } = await params
    const body = await request.json()
    if (!userId || !itemId) {
      return NextResponse.json({ error: 'User ID and Item ID are required' }, { status: 400 })
    }

    const validation = validateUpdateCartItem(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.errors }, { status: 400 })
    }
    const { quantity } = validation.data

    // Ensure item belongs to user's cart
    const { data: userCart, error: cartFetchError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (cartFetchError) {
      if (cartFetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
      }
      console.error('User cart fetch error:', cartFetchError)
      return NextResponse.json({ error: 'Failed to fetch user cart' }, { status: 500 })
    }

    const { data: cartItemWithProduct, error: fetchError } = await supabase
      .from('cart_details')
      .select('*')
      .eq('cart_id', userCart.id)
      .eq('item_id', itemId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
      }
      console.error('Cart item fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch cart item' }, { status: 500 })
    }

    // Stock check
    if (cartItemWithProduct.product_stock < quantity) {
      return NextResponse.json({ error: `Not enough stock. Available: ${cartItemWithProduct.product_stock}` }, { status: 400 })
    }

    // Fetch current product price
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('price, discount_price')
      .eq('id', cartItemWithProduct.product_id)
      .single()

    if (productError) {
      console.error('Product fetch error:', productError)
      return NextResponse.json({ error: 'Failed to fetch product price' }, { status: 500 })
    }

    const effectivePrice = product.discount_price || product.price

    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity, price: effectivePrice })
      .eq('id', itemId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Cart item update error:', updateError)
      return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 })
    }

    return NextResponse.json({
      id: updatedItem.id,
      product_id: updatedItem.product_id,
      quantity: updatedItem.quantity,
      price: updatedItem.price,
      total_price: updatedItem.quantity * updatedItem.price,
      product: {
        id: cartItemWithProduct.product_id,
        name: cartItemWithProduct.product_name,
        slug: cartItemWithProduct.product_slug,
        image_url: cartItemWithProduct.product_image,
        stock: cartItemWithProduct.product_stock
      }
    })
  } catch (error) {
    console.error('User cart item update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, itemId } = await params
    if (!userId || !itemId) {
      return NextResponse.json({ error: 'User ID and Item ID are required' }, { status: 400 })
    }

    // Verify item belongs to user's cart
    const { data: userCart, error: cartFetchError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (cartFetchError) {
      if (cartFetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
      }
      console.error('User cart fetch error:', cartFetchError)
      return NextResponse.json({ error: 'Failed to fetch user cart' }, { status: 500 })
    }

    const { error: verifyError } = await supabase
      .from('cart_details')
      .select('cart_id, item_id')
      .eq('cart_id', userCart.id)
      .eq('item_id', itemId)
      .single()

    if (verifyError) {
      if (verifyError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
      }
      console.error('Cart item verify error:', verifyError)
      return NextResponse.json({ error: 'Failed to verify cart item' }, { status: 500 })
    }

    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      console.error('Cart item deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to remove item from cart' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Item removed from cart successfully' })
  } catch (error) {
    console.error('User cart item deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


