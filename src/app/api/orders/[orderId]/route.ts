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

    // Siparişi detaylarıyla getir
    const { data: orderData, error } = await supabase
      .from('order_details')
      .select('*')
      .eq('id', orderId)

    if (error) {
      console.error('Order fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    if (!orderData || orderData.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Ana order bilgilerini al (ilk kayıttan)
    const orderInfo = orderData[0]

    // Order items'ları organize et
    const items = orderData
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
    })
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
    const { data: existingOrder, error: fetchError } = await supabase
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
    const { data: updatedOrder, error: updateError } = await supabase
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

    // Güncellenmiş siparişi detaylarıyla getir
    const { data: orderWithItems, error: fetchOrderError } = await supabase
      .from('order_details')
      .select('*')
      .eq('id', orderId)

    if (fetchOrderError) {
      console.error('Updated order fetch error:', fetchOrderError)
      // En azından temel order bilgisini döndür
      return NextResponse.json(updatedOrder)
    }

    // Ana order bilgilerini al (ilk kayıttan)
    const orderInfo = orderWithItems[0]

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
    const { data: existingOrder, error: fetchError } = await supabase
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