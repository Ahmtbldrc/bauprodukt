import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateCartItem } from '@/schemas/database'

interface RouteParams {
  params: {
    sessionId: string
  }
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

    // Sepet items'larını getir
    const { data, error } = await supabase
      .from('cart_details')
      .select('*')
      .eq('session_id', sessionId)
      .not('item_id', 'is', null)

    if (error) {
      console.error('Cart items fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cart items' },
        { status: 500 }
      )
    }

    const items = data.map(item => ({
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
      items,
      total_amount,
      total_items
    })
  } catch (error) {
    console.error('Cart items API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const body = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Validate request body
    const validation = validateCartItem(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { product_id, quantity } = validation.data

    // Önce ürünü kontrol et ve stok bilgisini al
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug, price, discount_price, stock, image_url')
      .eq('id', product_id)
      .single()

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('Product fetch error:', productError)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    // Stok kontrolü
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: `Not enough stock. Available: ${product.stock}` },
        { status: 400 }
      )
    }

    // Sepeti bul veya oluştur
    let cart
    const { data: existingCart, error: cartFetchError } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (cartFetchError && cartFetchError.code !== 'PGRST116') {
      console.error('Cart fetch error:', cartFetchError)
      return NextResponse.json(
        { error: 'Failed to fetch cart' },
        { status: 500 }
      )
    }

    if (existingCart) {
      cart = existingCart
    } else {
      // Yeni sepet oluştur
      const { data: newCart, error: cartCreateError } = await supabase
        .from('carts')
        .insert([{ session_id: sessionId }])
        .select('*')
        .single()

      if (cartCreateError) {
        console.error('Cart creation error:', cartCreateError)
        return NextResponse.json(
          { error: 'Failed to create cart' },
          { status: 500 }
        )
      }
      cart = newCart
    }

    // Aynı ürün sepette var mı kontrol et
    const { data: existingItem, error: itemFetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)
      .single()

    if (itemFetchError && itemFetchError.code !== 'PGRST116') {
      console.error('Cart item fetch error:', itemFetchError)
      return NextResponse.json(
        { error: 'Failed to check existing item' },
        { status: 500 }
      )
    }

    // Etkili fiyatı hesapla (indirim varsa onu kullan)
    const effectivePrice = product.discount_price || product.price

    let cartItem
    if (existingItem) {
      // Mevcut item'ı güncelle
      const newQuantity = existingItem.quantity + quantity

      // Toplam stok kontrolü
      if (product.stock < newQuantity) {
        return NextResponse.json(
          { error: `Not enough stock. Available: ${product.stock}, in cart: ${existingItem.quantity}` },
          { status: 400 }
        )
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ 
          quantity: newQuantity,
          price: effectivePrice // Fiyatı da güncelle (indirim değişmiş olabilir)
        })
        .eq('id', existingItem.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Cart item update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update cart item' },
          { status: 500 }
        )
      }
      cartItem = updatedItem
    } else {
      // Yeni item ekle
      const { data: newItem, error: createError } = await supabase
        .from('cart_items')
        .insert([{
          cart_id: cart.id,
          product_id: product_id,
          quantity: quantity,
          price: effectivePrice
        }])
        .select('*')
        .single()

      if (createError) {
        if (createError.code === '23505') {
          return NextResponse.json(
            { error: 'Product already in cart' },
            { status: 409 }
          )
        }
        console.error('Cart item creation error:', createError)
        return NextResponse.json(
          { error: 'Failed to add item to cart' },
          { status: 500 }
        )
      }
      cartItem = newItem
    }

    // Güncellenmiş cart item'ı product bilgileriyle döndür
    return NextResponse.json({
      id: cartItem.id,
      product_id: cartItem.product_id,
      quantity: cartItem.quantity,
      price: cartItem.price,
      total_price: cartItem.quantity * cartItem.price,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image_url: product.image_url,
        stock: product.stock
      }
    }, { status: existingItem ? 200 : 201 })
  } catch (error) {
    console.error('Cart items creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 