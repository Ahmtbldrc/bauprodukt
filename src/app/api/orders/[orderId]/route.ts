import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateUpdateOrder } from '@/schemas/database'

interface RouteParams {
  params: Promise<{ orderId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order with payment fields and items
    const { data: orderData, error } = await (supabase as any)
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          products (
            name,
            slug
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Order fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    if (!orderData) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Order items'ları organize et
    type OrderItemRow = { id: string; product_id: string; quantity: number; unit_price: number; total_price: number; products?: { name: string; slug: string } }
    const items = (orderData.order_items as OrderItemRow[] | undefined)?.map((item: OrderItemRow) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.products?.name,
      product_slug: item.products?.slug,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    })) || []

    const response = NextResponse.json({
      id: orderData.id,
      order_number: orderData.order_number,
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone,
      shipping_province: orderData.shipping_province,
      shipping_district: orderData.shipping_district,
      shipping_postal_code: orderData.shipping_postal_code,
      shipping_address: orderData.shipping_address,
      billing_province: orderData.billing_province,
      billing_district: orderData.billing_district,
      billing_postal_code: orderData.billing_postal_code,
      billing_address: orderData.billing_address,
      status: orderData.status,
      total_amount: orderData.total_amount,
      notes: orderData.notes,
      payment_provider: orderData.payment_provider,
      payment_status: orderData.payment_status,
      currency: orderData.currency,
      provider_session_id: orderData.provider_session_id,
      provider_payment_id: orderData.provider_payment_id,
      paid_at: orderData.paid_at,
      created_at: orderData.created_at,
      updated_at: orderData.updated_at,
      order_items: items
    })

    // Prevent caching to ensure real-time order status updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await params
    const body = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Validate request body
    const validation = validateUpdateOrder(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Siparişin var olduğunu kontrol et
    const { data: existingOrder, error: fetchError } = await (supabase as any)
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      console.error('Order fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    // Stok kontrolü: Eğer durum cancelled'dan başka bir duruma geçiyorsa
    // ve mevcut durum cancelled ise, stok düşürme gerekebilir
    if (existingOrder.status === 'cancelled' && updateData.status && updateData.status !== 'cancelled') {
      // Bu durumda stok kontrolü yapılabilir, şimdilik basit tutuyoruz
      console.log('Order being reactivated from cancelled status')
    }

    // Siparişi güncelle
    const { data: updatedOrder, error: updateError } = await (supabase as any)
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Order update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    // Get updated order with payment fields and items
    type OrderItemRow = { id: string; product_id: string; quantity: number; unit_price: number; total_price: number; products?: { name: string; slug: string } }
    const { data: orderWithItems, error: fetchOrderError } = await (supabase as any)
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          products (
            name,
            slug
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (fetchOrderError) {
      console.error('Updated order fetch error:', fetchOrderError)
      // Return basic order info if fetch fails
      return NextResponse.json(updatedOrder)
    }

    // Order items'ları organize et
    const items = (orderWithItems.order_items as OrderItemRow[] | undefined)?.map((item: OrderItemRow) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.products?.name,
      product_slug: item.products?.slug,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    })) || []

    return NextResponse.json({
      id: orderWithItems.id,
      order_number: orderWithItems.order_number,
      customer_name: orderWithItems.customer_name,
      customer_email: orderWithItems.customer_email,
      customer_phone: orderWithItems.customer_phone,
      shipping_province: orderWithItems.shipping_province,
      shipping_district: orderWithItems.shipping_district,
      shipping_postal_code: orderWithItems.shipping_postal_code,
      shipping_address: orderWithItems.shipping_address,
      billing_province: orderWithItems.billing_province,
      billing_district: orderWithItems.billing_district,
      billing_postal_code: orderWithItems.billing_postal_code,
      billing_address: orderWithItems.billing_address,
      status: orderWithItems.status,
      total_amount: orderWithItems.total_amount,
      notes: orderWithItems.notes,
      payment_provider: orderWithItems.payment_provider,
      payment_status: orderWithItems.payment_status,
      currency: orderWithItems.currency,
      provider_session_id: orderWithItems.provider_session_id,
      provider_payment_id: orderWithItems.provider_payment_id,
      paid_at: orderWithItems.paid_at,
      created_at: orderWithItems.created_at,
      updated_at: orderWithItems.updated_at,
      order_items: items
    })
  } catch (error) {
    console.error('Order update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Siparişin var olduğunu kontrol et
    const { data: existingOrder, error: fetchError } = await (supabase as any)
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      console.error('Order fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    // Sadece pending veya cancelled durumundaki siparişler silinebilir
    if (!['pending', 'cancelled'].includes(existingOrder.status)) {
      return NextResponse.json(
        { error: 'Only pending or cancelled orders can be deleted' },
        { status: 400 }
      )
    }

    // Siparişi sil (CASCADE ile order_items da silinir)
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (deleteError) {
      console.error('Order deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Order deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 