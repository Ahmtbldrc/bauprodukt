import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateCartItem } from '@/schemas/database'

interface RouteParams { params: Promise<{ userId: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params
    const body = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const validation = validateCartItem(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { product_id, variant_id, quantity } = validation.data

    // Fetch product and optional variant
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug, price, discount_price, stock, image_url')
      .eq('id', product_id)
      .single()

    let variant = null as any
    if (variant_id) {
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants_detailed')
        .select('*')
        .eq('id', variant_id)
        .eq('product_id', product_id)
        .eq('is_active', true)
        .single()
      if (variantError) {
        if (variantError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Variant not found or inactive' }, { status: 404 })
        }
        console.error('Variant fetch error:', variantError)
        return NextResponse.json({ error: 'Failed to fetch variant' }, { status: 500 })
      }
      variant = variantData
    }

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      console.error('Product fetch error:', productError)
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }

    const availableStock = variant ? variant.stock_quantity : product.stock
    const trackInventory = variant ? variant.track_inventory : true
    const continueSelling = variant ? variant.continue_selling_when_out_of_stock : false

    if (trackInventory && !continueSelling && availableStock < quantity) {
      return NextResponse.json({ error: `Not enough stock. Available: ${availableStock}` }, { status: 400 })
    }

    // Find or create cart by user
    let cart
    const { data: existingCart, error: cartFetchError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (cartFetchError && cartFetchError.code !== 'PGRST116') {
      console.error('Cart fetch error:', cartFetchError)
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }

    if (existingCart) {
      cart = existingCart
    } else {
      const { data: newCart, error: cartCreateError } = await supabase
        .from('carts')
        .insert([{ user_id: userId }])
        .select('*')
        .single()
      if (cartCreateError) {
        console.error('Cart creation error:', cartCreateError)
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 })
      }
      cart = newCart
    }

    // Check existing item (variant-aware)
    let existingItemQuery = supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)

    if (variant_id) existingItemQuery = existingItemQuery.eq('variant_id', variant_id)
    else existingItemQuery = existingItemQuery.is('variant_id', null)

    const { data: existingItem, error: itemFetchError } = await existingItemQuery.single()
    if (itemFetchError && itemFetchError.code !== 'PGRST116') {
      console.error('Cart item fetch error:', itemFetchError)
      return NextResponse.json({ error: 'Failed to check existing item' }, { status: 500 })
    }

    const effectivePrice = variant 
      ? (variant.compare_at_price && variant.compare_at_price > variant.price ? variant.price : variant.price)
      : (product.discount_price || product.price)

    let cartItem
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (trackInventory && !continueSelling && availableStock < newQuantity) {
        return NextResponse.json(
          { error: `Not enough stock. Available: ${availableStock}, in cart: ${existingItem.quantity}` },
          { status: 400 }
        )
      }
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity, price: effectivePrice })
        .eq('id', existingItem.id)
        .select('*')
        .single()
      if (updateError) {
        console.error('Cart item update error:', updateError)
        return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 })
      }
      cartItem = updatedItem
    } else {
      const { data: newItem, error: createError } = await supabase
        .from('cart_items')
        .insert([{ cart_id: cart.id, product_id, variant_id, quantity, price: effectivePrice }])
        .select('*')
        .single()
      if (createError) {
        if (createError.code === '23505') {
          return NextResponse.json({ error: 'Product already in cart' }, { status: 409 })
        }
        console.error('Cart item creation error:', createError)
        return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 })
      }
      cartItem = newItem
    }

    return NextResponse.json({
      id: cartItem.id,
      product_id: cartItem.product_id,
      variant_id: cartItem.variant_id,
      quantity: cartItem.quantity,
      price: cartItem.price,
      total_price: cartItem.quantity * cartItem.price,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image_url: product.image_url,
        stock: product.stock
      },
      variant: variant ? {
        id: variant.id,
        sku: variant.sku,
        title: variant.title,
        stock_quantity: variant.stock_quantity,
        attributes: variant.attributes || []
      } : null
    }, { status: existingItem ? 200 : 201 })
  } catch (error) {
    console.error('User cart items POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


