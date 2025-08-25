import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateCartItem } from '@/schemas/database'

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

    // Sepet items'larını variant bilgileri ile getir
    const { data: rows, error } = await (supabase as any)
      .from('cart_items_with_variants')
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

    type CartItemsWithVariantsRow = {
      item_id: string
      product_id: string
      variant_id: string | null
      quantity: number
      item_price: number
      item_total: number
      is_available: boolean
      product_name: string | null
      product_slug: string | null
      product_image: string | null
      product_stock: number | null
      variant_sku: string | null
      variant_title: string | null
      variant_stock: number | null
      variant_attributes: any[] | null
    }

    const data = (rows || []) as CartItemsWithVariantsRow[]

    const items = data.map((item: CartItemsWithVariantsRow) => ({
      id: item.item_id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.item_price,
      total_price: item.item_total,
      is_available: item.is_available,
      product: {
        id: item.product_id,
        name: item.product_name,
        slug: item.product_slug,
        image_url: item.product_image,
        stock: item.product_stock
      },
      variant: item.variant_id ? {
        id: item.variant_id,
        sku: item.variant_sku,
        title: item.variant_title,
        stock_quantity: item.variant_stock,
        attributes: item.variant_attributes || []
      } : null
    }))

    const total_amount = items.reduce((sum: number, item) => sum + (item.total_price || 0), 0)
    const total_items = items.reduce((sum: number, item) => sum + (item.quantity || 0), 0)
    const unavailable_items = items.filter((item) => !item.is_available).length

    return NextResponse.json({
      items,
      total_amount,
      total_items,
      unavailable_items
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

    const { product_id, variant_id, quantity } = validation.data

    // Product ve variant bilgilerini al
    const { data: product, error: productError } = await (supabase as any)
      .from('products')
      .select('id, name, slug, price, discount_price, stock, image_url')
      .eq('id', product_id)
      .single()

    let variant = null
    if (variant_id) {
      const { data: variantData, error: variantError } = await (supabase as any)
        .from('product_variants_detailed')
        .select('*')
        .eq('id', variant_id)
        .eq('product_id', product_id)
        .eq('is_active', true)
        .single()

      if (variantError) {
        if (variantError.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Variant not found or inactive' },
            { status: 404 }
          )
        }
        console.error('Variant fetch error:', variantError)
        return NextResponse.json(
          { error: 'Failed to fetch variant' },
          { status: 500 }
        )
      }
      type VariantDetailed = {
        id: string
        sku: string
        title: string | null
        price: number
        compare_at_price: number | null
        stock_quantity: number
        track_inventory: boolean
        continue_selling_when_out_of_stock: boolean
        attributes: any[]
      }
      variant = variantData as VariantDetailed
    }

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

    // Stok kontrolü - variant varsa variant stock'unu, yoksa product stock'unu kontrol et
    const availableStock = variant ? variant.stock_quantity : product.stock
    const trackInventory = variant ? variant.track_inventory : true
    const continueSelling = variant ? variant.continue_selling_when_out_of_stock : false

    if (trackInventory && !continueSelling && availableStock < quantity) {
      return NextResponse.json(
        { error: `Not enough stock. Available: ${availableStock}` },
        { status: 400 }
      )
    }

    // Sepeti bul veya oluştur
    let cart
    const { data: existingCart, error: cartFetchError } = await (supabase as any)
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
      const { data: newCart, error: cartCreateError } = await (supabase as any)
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

    // Enhanced existing item check for variant-optional products
    let existingItemQuery = (supabase as any)
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)

    // Smart variant matching logic
    if (variant_id) {
      // Specific variant requested
      existingItemQuery = existingItemQuery.eq('variant_id', variant_id)
    } else {
      // No variant requested - match null variant_id items
      existingItemQuery = existingItemQuery.is('variant_id', null)
    }

    const { data: existingItem, error: itemFetchError } = await (existingItemQuery as any).single()

    if (itemFetchError && itemFetchError.code !== 'PGRST116') {
      console.error('Cart item fetch error:', itemFetchError)
      return NextResponse.json(
        { error: 'Failed to check existing item' },
        { status: 500 }
      )
    }

    // Etkili fiyatı hesapla - variant varsa variant price, yoksa product price
    const effectivePrice = variant 
      ? (variant.compare_at_price && variant.compare_at_price > variant.price ? variant.price : variant.price)
      : (product.discount_price || product.price)

    let cartItem
    if (existingItem) {
      // Mevcut item'ı güncelle
      const newQuantity = existingItem.quantity + quantity

      // Toplam stok kontrolü - variant varsa variant stock'unu kontrol et
      if (trackInventory && !continueSelling && availableStock < newQuantity) {
        return NextResponse.json(
          { error: `Not enough stock. Available: ${availableStock}, in cart: ${existingItem.quantity}` },
          { status: 400 }
        )
      }

      const { data: updatedItem, error: updateError } = await (supabase as any)
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
      const { data: newItem, error: createError } = await (supabase as any)
        .from('cart_items')
        .insert([{
          cart_id: cart.id,
          product_id: product_id,
          variant_id: variant_id,
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

    // Güncellenmiş cart item'ı product ve variant bilgileriyle döndür
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
    console.error('Cart items creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 