import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface OrderItemRequest {
  product: {
    id: string
    name: string
    slug: string
  }
  quantity: number
  price: number
}

interface CreateOrderRequest {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingProvince: string
  shippingDistrict: string
  shippingPostalCode: string
  shippingAddress: string
  billingProvince?: string
  billingDistrict?: string
  billingPostalCode?: string
  billingAddress?: string
  notes?: string
  totalAmount: number
  items: OrderItemRequest[]
}

interface OrderItemData {
  order_id: string
  product_id: string
  product_name: string
  product_slug: string
  quantity: number
  unit_price: number
  total_price: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body: CreateOrderRequest = await request.json()
    
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingProvince,
      shippingDistrict,
      shippingPostalCode,
      shippingAddress,
      billingProvince,
      billingDistrict,
      billingPostalCode,
      billingAddress,
      notes,
      totalAmount,
      items
    } = body

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || 
        !shippingProvince || !shippingDistrict || !shippingPostalCode || !shippingAddress) {
      console.error('Missing required fields:', { customerName, customerEmail, customerPhone, shippingProvince, shippingDistrict, shippingPostalCode, shippingAddress })
      return NextResponse.json(
        { error: 'Alle Pflichtfelder müssen ausgefüllt werden' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      console.error('No items in order')
      return NextResponse.json(
        { error: 'Der Warenkorb ist leer' },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = `BP${Math.floor(Math.random() * 999999 + 1).toString().padStart(6, '0')}`

    // Create draft order (no emails will be sent)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_province: shippingProvince,
        shipping_district: shippingDistrict,
        shipping_postal_code: shippingPostalCode,
        shipping_address: shippingAddress,
        billing_province: billingProvince || shippingProvince,
        billing_district: billingDistrict || shippingDistrict,
        billing_postal_code: billingPostalCode || shippingPostalCode,
        billing_address: billingAddress || shippingAddress,
        notes: notes || '',
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'pending', // Add payment status
        currency: 'CHF' // Default currency
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: `Fehler beim Erstellen der Bestellung: ${orderError.message || 'Unbekannter Datenbankfehler'}` },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems: OrderItemData[] = items.map((item: OrderItemRequest) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_slug: item.product.slug,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Try to delete the order if items creation fails
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id)
      
      return NextResponse.json(
        { error: `Fehler beim Erstellen der Bestellpositionen: ${itemsError.message || 'Unbekannter Datenbankfehler'}` },
        { status: 500 }
      )
    }

    // Don't send email on order creation - emails are sent after payment confirmation
    // Email sending is handled by payment webhooks

    return NextResponse.json({
      success: true,
      orderNumber: orderNumber,
      orderId: order.id
    })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: `Interner Serverfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const orderNumber = searchParams.get('orderNumber')

    // If no parameters provided, return empty orders array
    if (!email && !orderNumber) {
      return NextResponse.json({ orders: [] })
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_slug,
          quantity,
          unit_price,
          total_price
        )
      `)

    if (email) {
      query = query.eq('customer_email', email)
    }

    if (orderNumber) {
      query = query.eq('order_number', orderNumber)
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders: orders || [] })

  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 