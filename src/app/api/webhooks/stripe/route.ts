import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyStripeWebhook, processStripeWebhook } from '@/lib/payment/stripe'
// import { PaymentProcessingError } from '@/lib/payment/types'
import { headers } from 'next/headers'
import type { OrderItem } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = verifyStripeWebhook(body, signature)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Process the webhook event
    const webhookEvent = await processStripeWebhook(event)

    // Find the order based on metadata, session ID, or payment ID
    let orderId: string | null = null
    
    if (webhookEvent.metadata?.order_id) {
      orderId = webhookEvent.metadata.order_id as string
    } else if (webhookEvent.sessionId) {
      // Look up order by session ID
      const { data: order } = await (supabase as any)
        .from('orders')
        .select('id')
        .eq('provider_session_id', webhookEvent.sessionId)
        .single()
      
      if (order) {
        orderId = order.id
      }
    } else if (webhookEvent.paymentId) {
      // Look up order by payment intent ID
      const { data: order } = await (supabase as any)
        .from('orders')
        .select('id')
        .eq('provider_payment_id', webhookEvent.paymentId)
        .single()
      
      if (order) {
        orderId = order.id
      } else {
        // If we can't find by payment_intent ID, try to find by session
        // and update the order with the payment_intent ID
        const { data: sessionOrder } = await (supabase as any)
          .from('orders')
          .select('id, provider_session_id')
          .eq('payment_provider', 'stripe')
          .eq('payment_status', 'pending')
          .not('provider_session_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (sessionOrder && sessionOrder.length > 0) {
          // Try to match session with payment intent using Stripe API
          for (const order of sessionOrder) {
            try {
              const { retrieveStripeSession } = await import('@/lib/payment/stripe')
              const session = await retrieveStripeSession(order.provider_session_id!)
              
              if (session.payment_intent === webhookEvent.paymentId) {
                orderId = order.id
                
                // Update order with payment intent ID for future lookups
                await (supabase as any)
                  .from('orders')
                  .update({ provider_payment_id: webhookEvent.paymentId })
                  .eq('id', order.id)
                
                break
              }
            } catch (err) {
              console.error('Error retrieving session:', err)
              continue
            }
          }
        }
      }
    }

    if (!orderId) {
      console.error('Could not find order for webhook event:', {
        eventType: webhookEvent.eventType,
        sessionId: webhookEvent.sessionId,
        paymentId: webhookEvent.paymentId,
        metadata: webhookEvent.metadata
      })
      // Don't fail the webhook, just log and return success
      return NextResponse.json({ received: true })
    }

    // Log the payment event
    await (supabase as any)
      .from('payment_events')
      .insert({
        order_id: orderId,
        provider: 'stripe',
        event_type: webhookEvent.eventType,
        status_before: null, // We'd need to fetch this from the order
        status_after: webhookEvent.status,
        code: null,
        message: `Stripe webhook: ${webhookEvent.eventType}`,
        raw_payload: webhookEvent.rawPayload,
        correlation_id: event.id,
      })

    // Update order status based on webhook event
    if (webhookEvent.status === 'paid') {
      // Update order to paid status
      const updateData: Record<string, unknown> = {
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      }
      
      // Add payment ID if available
      if (webhookEvent.paymentId) {
        updateData.provider_payment_id = webhookEvent.paymentId
      }
      
      const { error: updateError } = await (supabase as any)
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (updateError) {
        console.error('Failed to update order status:', updateError)
        throw updateError
      }

      // Send post-payment emails via SMTP
      await sendPostPaymentNotifications(supabase, orderId)

      // Mark for Infoniqa sync
      await (supabase as any)
        .from('orders')
        .update({
          infoniqa_sync_status: 'pending',
        })
        .eq('id', orderId)
        .is('infoniqa_sync_status', null)

    } else if (webhookEvent.status === 'failed' || webhookEvent.status === 'cancelled' || webhookEvent.status === 'expired') {
      // Update order status
      const updateData: Record<string, unknown> = {
        payment_status: webhookEvent.status,
        updated_at: new Date().toISOString(),
      }
      
      // Add payment ID if available
      if (webhookEvent.paymentId) {
        updateData.provider_payment_id = webhookEvent.paymentId
      }
      
      await (supabase as any)
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Stripe webhook processing error:', error)
    
    // Log error but return success to prevent Stripe from retrying
    // Stripe will retry if we return an error status
    return NextResponse.json({ received: true })
  }
}

async function sendPostPaymentNotifications(supabase: ReturnType<typeof createClient>, orderId: string) {
  try {
    // Import email service
    const { sendPostPaymentEmails } = await import('@/lib/email')
    
    // Fetch complete order details with customer and items
    const { data: order } = await (supabase as any)
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          product_id,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', orderId)
      .single()

    if (!order) {
      console.error('Order not found for email sending:', orderId)
      return
    }

    // Prepare order data for email templates
    const emailData = {
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name || order.customer_email.split('@')[0],
      customerEmail: order.customer_email,
      customerAddress: {
        street: order.shipping_address || order.customer_address || '',
        city: order.shipping_city || '',
        postalCode: order.shipping_postal_code || '',
        country: order.shipping_country || 'CH'
      },
      totalAmount: order.total_amount,
      items: order.order_items?.map((item: OrderItem) => ({
        product_name: item.product_name,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })) || [],
      paymentProvider: order.payment_provider,
      paymentStatus: order.payment_status,
      providerTransactionId: order.provider_payment_id,
      createdAt: order.created_at,
      paidAt: order.paid_at || new Date().toISOString()
    }

    // Send emails via SMTP
    const result = await sendPostPaymentEmails(emailData)
    
    // Log email sending results
    await (supabase as any)
      .from('payment_events')
      .insert({
        order_id: orderId,
        provider: 'email',
        event_type: 'post_payment_emails',
        status_before: null,
        status_after: 'sent',
        code: null,
        message: `Customer email: ${result.customerEmailSent ? 'sent' : 'failed'}, Swiss VFG email: ${result.swissVFGEmailSent ? 'sent' : 'failed'}`,
        raw_payload: { customerEmailSent: result.customerEmailSent, swissVFGEmailSent: result.swissVFGEmailSent },
        correlation_id: order.order_number
      })

    console.log(`Post-payment emails for order ${order.order_number}:`, result)
    
  } catch (error) {
    console.error('Failed to send post-payment emails:', error)
    
    // Log error event
    try {
      await (supabase as any)
        .from('payment_events')
        .insert({
          order_id: orderId,
          provider: 'email',
          event_type: 'post_payment_emails_error',
          status_before: null,
          status_after: 'failed',
          code: 'email_send_error',
          message: error instanceof Error ? error.message : 'Unknown email sending error',
          raw_payload: { error: String(error) },
          correlation_id: null
        })
    } catch (logError) {
      console.error('Failed to log email error:', logError)
    }
    
    // Don't throw - email sending failure shouldn't fail the webhook
  }
}