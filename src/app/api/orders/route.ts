import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, generateOrderConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
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
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = `BP${Math.floor(Math.random() * 999999 + 1).toString().padStart(6, '0')}`

    // Create order
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
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
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
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    // Send order confirmation email
    try {
      const emailData = generateOrderConfirmationEmail({
        orderNumber,
        customerName: customerName,
        customerEmail: customerEmail,
        totalAmount,
        items: orderItems.map((item: any) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })),
        shippingAddress: shippingAddress,
        createdAt: order.created_at
      })
      
      await sendEmail(emailData)
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError)
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({
      success: true,
      orderNumber: orderNumber,
      orderId: order.id
    })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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