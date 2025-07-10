import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateCreateOrder } from '@/schemas/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search') // Email, telefon veya ad-soyad arama
    const order_number = searchParams.get('order_number')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('order_summary')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false })

    // Filtreleri uygula
    if (status) {
      query = query.eq('status', status)
    }

    if (order_number) {
      query = query.eq('order_number', order_number)
    }

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Orders fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = validateCreateOrder(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const orderData = validation.data
    const { session_id } = orderData

    // Sepeti ve içindeki ürünleri kontrol et
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_details')
      .select('*')
      .eq('session_id', session_id)
      .not('item_id', 'is', null)

    if (cartError) {
      console.error('Cart fetch error:', cartError)
      return NextResponse.json(
        { error: 'Failed to fetch cart' },
        { status: 500 }
      )
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Tüm ürünlerin stok kontrolünü yap
    const stockErrors = []
    for (const item of cartItems) {
      if (item.product_stock < item.quantity) {
        stockErrors.push({
          product_name: item.product_name,
          available_stock: item.product_stock,
          requested_quantity: item.quantity
        })
      }
    }

    if (stockErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Insufficient stock for some products', 
          stock_errors: stockErrors 
        },
        { status: 400 }
      )
    }

    // Sipariş numarası generate et
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc('generate_order_number')

    if (orderNumberError) {
      console.error('Order number generation error:', orderNumberError)
      return NextResponse.json(
        { error: 'Failed to generate order number' },
        { status: 500 }
      )
    }

    const orderNumber = orderNumberData

    // Toplam tutarı hesapla
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.item_total || 0), 0)

    // Sipariş oluştur
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        shipping_province: orderData.shipping_province,
        shipping_district: orderData.shipping_district,
        shipping_postal_code: orderData.shipping_postal_code,
        shipping_address: orderData.shipping_address,
        billing_province: orderData.billing_province || null,
        billing_district: orderData.billing_district || null,
        billing_postal_code: orderData.billing_postal_code || null,
        billing_address: orderData.billing_address || null,
        total_amount: totalAmount,
        notes: orderData.notes || null,
        status: 'pending'
      }])
      .select('*')
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Sipariş kalelerini oluştur
    const orderItems = cartItems.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_slug: item.product_slug,
      quantity: item.quantity,
      unit_price: item.item_price,
      total_price: item.item_total
    }))

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (orderItemsError) {
      console.error('Order items creation error:', orderItemsError)
      
      // Sipariş oluşturuldu ama kalemler oluşturulamadı, siparişi geri al
      await supabase.from('orders').delete().eq('id', newOrder.id)
      
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    // Stok güncelleme işlemi
    for (const item of cartItems) {
      const newStock = item.product_stock - item.quantity
      const { error: stockUpdateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id)

      if (stockUpdateError) {
        console.error(`Stock update error for product ${item.product_id}:`, stockUpdateError)
        // Stok güncellenemese bile sipariş devam eder, loglama yeterli
      }
    }

    // Sepeti temizle
    const { error: cartClearError } = await supabase
      .from('carts')
      .delete()
      .eq('session_id', session_id)

    if (cartClearError) {
      console.error('Cart clear error:', cartClearError)
      // Sepet temizlenemediyse de sipariş başarılı, sadece log
    }

    // Oluşturulan siparişi detaylarıyla birlikte döndür
    const { data: orderWithItems, error: fetchOrderError } = await supabase
      .from('order_details')
      .select('*')
      .eq('id', newOrder.id)

    if (fetchOrderError) {
      console.error('Order fetch error:', fetchOrderError)
      // En azından temel order bilgisini döndür
      return NextResponse.json(newOrder, { status: 201 })
    }

    // Order items'ları organize et
    const items = orderWithItems
      .filter(item => item.item_id !== null)
      .map(item => ({
        id: item.item_id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_slug: item.product_slug,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.item_total
      }))

    // Ana order bilgilerini al (ilk kayıttan)
    const orderInfo = orderWithItems[0]

    return NextResponse.json({
      id: orderInfo.id,
      order_number: orderInfo.order_number,
      customer_name: orderInfo.customer_name,
      customer_email: orderInfo.customer_email,
      customer_phone: orderInfo.customer_phone,
      shipping_province: orderInfo.shipping_province,
      shipping_district: orderInfo.shipping_district,
      shipping_postal_code: orderInfo.shipping_postal_code,
      shipping_address: orderInfo.shipping_address,
      billing_province: orderInfo.billing_province,
      billing_district: orderInfo.billing_district,
      billing_postal_code: orderInfo.billing_postal_code,
      billing_address: orderInfo.billing_address,
      status: orderInfo.status,
      total_amount: orderInfo.total_amount,
      notes: orderInfo.notes,
      created_at: orderInfo.created_at,
      updated_at: orderInfo.updated_at,
      items
    }, { status: 201 })
  } catch (error) {
    console.error('Order creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 