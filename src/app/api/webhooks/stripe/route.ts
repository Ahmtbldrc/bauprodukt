import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyStripeWebhook, processStripeWebhook } from '@/lib/payment/stripe'
import { PaymentProcessingError } from '@/lib/payment/types'
import { headers } from 'next/headers'

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
      orderId = webhookEvent.metadata.order_id
    } else if (webhookEvent.sessionId) {
      // Look up order by session ID
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('provider_session_id', webhookEvent.sessionId)
        .single()
      
      if (order) {
        orderId = order.id
      }
    } else if (webhookEvent.paymentId) {
      // Look up order by payment intent ID
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('provider_payment_id', webhookEvent.paymentId)
        .single()
      
      if (order) {
        orderId = order.id
      } else {
        // If we can't find by payment_intent ID, try to find by session
        // and update the order with the payment_intent ID
        const { data: sessionOrder } = await supabase
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
                await supabase
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
    await supabase
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
      const updateData: any = {
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      }
      
      // Add payment ID if available
      if (webhookEvent.paymentId) {
        updateData.provider_payment_id = webhookEvent.paymentId
      }
      
      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (updateError) {
        console.error('Failed to update order status:', updateError)
        throw updateError
      }

      // Queue emails for sending (handled by email service)
      await queueOrderEmails(supabase, orderId)

      // Mark for Infoniqa sync
      await supabase
        .from('orders')
        .update({
          infoniqa_sync_status: 'pending',
        })
        .eq('id', orderId)
        .is('infoniqa_sync_status', null)

    } else if (webhookEvent.status === 'failed' || webhookEvent.status === 'cancelled' || webhookEvent.status === 'expired') {
      // Update order status
      const updateData: any = {
        payment_status: webhookEvent.status,
        updated_at: new Date().toISOString(),
      }
      
      // Add payment ID if available
      if (webhookEvent.paymentId) {
        updateData.provider_payment_id = webhookEvent.paymentId
      }
      
      await supabase
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

async function queueOrderEmails(supabase: any, orderId: string) {
  try {
    // Fetch order details
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (!order) return

    // Queue customer email (use upsert to handle duplicates)
    const { error: customerEmailError } = await supabase
      .from('email_queue')
      .upsert({
        order_id: orderId,
        recipient_email: order.customer_email,
        recipient_type: 'customer',
        email_type: 'order_confirmation',
        subject: `Bestellbestätigung - ${order.order_number}`,
        body_html: '<p>Email will be generated by email service</p>',
        body_text: 'Email will be generated by email service',
        status: 'pending',
      }, {
        onConflict: 'order_id,recipient_email,email_type',
        ignoreDuplicates: true
      })
    
    if (customerEmailError) {
      console.error('Failed to queue customer email:', customerEmailError)
    }

    // Queue Swiss VFG fulfillment email (use upsert to handle duplicates)
    const swissVfgEmail = process.env.SWISS_VFG_EMAIL || 'fulfillment@swissvfg.ch'
    const { error: fulfillmentEmailError } = await supabase
      .from('email_queue')
      .upsert({
        order_id: orderId,
        recipient_email: swissVfgEmail,
        recipient_type: 'swiss_vfg',
        email_type: 'order_fulfillment',
        subject: `Neue Bestellung - ${order.order_number}`,
        body_html: '<p>Email will be generated by email service</p>',
        body_text: 'Email will be generated by email service',
        status: 'pending',
      }, {
        onConflict: 'order_id,recipient_email,email_type',
        ignoreDuplicates: true
      })
    
    if (fulfillmentEmailError) {
      console.error('Failed to queue fulfillment email:', fulfillmentEmailError)
    }

  } catch (error) {
    console.error('Failed to queue emails:', error)
    // Don't throw - email queuing failure shouldn't fail the webhook
  }
}