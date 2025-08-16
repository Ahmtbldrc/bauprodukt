import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDataTransSession } from '@/lib/payment/datatrans'
import { PaymentProcessingError } from '@/lib/payment/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order fetch error:', orderError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order is eligible for payment
    if (order.payment_status !== 'pending' && order.payment_status !== 'failed') {
      return NextResponse.json(
        { error: 'Order is not eligible for payment' },
        { status: 400 }
      )
    }

    // Create success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/checkout/success?orderId=${orderId}&provider=datatrans`
    const cancelUrl = `${baseUrl}/checkout/failure?orderId=${orderId}&provider=datatrans&code=cancelled`

    // Create DataTrans transaction
    const session = await createDataTransSession({
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.total_amount,
      currency: order.currency || 'CHF',
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      successUrl,
      cancelUrl,
    })

    // Update order with session information
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_provider: 'datatrans',
        payment_status: 'pending',
        provider_session_id: session.sessionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order with session:', updateError)
      // Don't fail the request, session is already created
    }

    // Log payment session creation
    await supabase
      .from('payment_sessions')
      .insert({
        order_id: orderId,
        provider: 'datatrans',
        session_id: session.sessionId,
        amount: session.amount,
        currency: session.currency,
        expires_at: session.expiresAt,
      })

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      redirectUrl: session.redirectUrl,
    })

  } catch (error) {
    console.error('DataTrans session creation error:', error)
    
    if (error instanceof PaymentProcessingError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}