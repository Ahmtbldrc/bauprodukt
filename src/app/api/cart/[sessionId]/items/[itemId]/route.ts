import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateUpdateCartItem } from '@/schemas/database'

interface RouteParams {
  params: Promise<{
    sessionId: string
    itemId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId, itemId } = await params

    if (!sessionId || !itemId) {
      return NextResponse.json(
        { error: 'Session ID and Item ID are required' },
        { status: 400 }
      )
    }

    // Sepet item'ını getir
    const { data, error } = await supabase
      .from('cart_details')
      .select('*')
      .eq('session_id', sessionId)
      .eq('item_id', itemId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        )
      }
      console.error('Cart item fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cart item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: data.item_id,
      product_id: data.product_id,
      quantity: data.quantity,
      price: data.item_price,
      total_price: data.item_total,
      product: {
        id: data.product_id,
        name: data.product_name,
        slug: data.product_slug,
        image_url: data.product_image,
        stock: data.product_stock
      }
    })
  } catch (error) {
    console.error('Cart item API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId, itemId } = await params
    const body = await request.json()

    if (!sessionId || !itemId) {
      return NextResponse.json(
        { error: 'Session ID and Item ID are required' },
        { status: 400 }
      )
    }

    // Validate request body
    const validation = validateUpdateCartItem(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { quantity } = validation.data

    // Önce cart item'ını ve product bilgisini kontrol et
    const { data: cartItemWithProduct, error: fetchError } = await supabase
      .from('cart_details')
      .select('*')
      .eq('session_id', sessionId)
      .eq('item_id', itemId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        )
      }
      console.error('Cart item fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch cart item' },
        { status: 500 }
      )
    }

    // Stok kontrolü
    if (cartItemWithProduct.product_stock < quantity) {
      return NextResponse.json(
        { error: `Not enough stock. Available: ${cartItemWithProduct.product_stock}` },
        { status: 400 }
      )
    }

    // Güncel ürün fiyatını al (indirim değişmiş olabilir)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('price, discount_price')
      .eq('id', cartItemWithProduct.product_id)
      .single()

    if (productError) {
      console.error('Product fetch error:', productError)
      return NextResponse.json(
        { error: 'Failed to fetch product price' },
        { status: 500 }
      )
    }

    const effectivePrice = product.discount_price || product.price

    // Cart item'ı güncelle
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ 
        quantity: quantity,
        price: effectivePrice // Fiyatı da güncelle
      })
      .eq('id', itemId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Cart item update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update cart item' },
        { status: 500 }
      )
    }

    // Güncellenmiş item'ı product bilgileriyle döndür
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
    console.error('Cart item update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId, itemId } = await params

    if (!sessionId || !itemId) {
      return NextResponse.json(
        { error: 'Session ID and Item ID are required' },
        { status: 400 }
      )
    }

    // Önce item'ın bu session'a ait olduğunu kontrol et
    const { error: fetchError } = await supabase
      .from('cart_details')
      .select('cart_id, item_id')
      .eq('session_id', sessionId)
      .eq('item_id', itemId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        )
      }
      console.error('Cart item check error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to verify cart item' },
        { status: 500 }
      )
    }

    // Cart item'ı sil
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      console.error('Cart item deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove item from cart' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Item removed from cart successfully'
    })
  } catch (error) {
    console.error('Cart item deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 