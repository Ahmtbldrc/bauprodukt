import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyDataTransWebhook, processDataTransWebhook } from '@/lib/payment/datatrans'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('x-datatrans-signature')

    if (!signature) {
      console.error('Missing DataTrans signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const isValid = verifyDataTransWebhook(body, signature)
    if (!isValid) {
      console.error('DataTrans webhook signature verification failed')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Parse the webhook data
    const data = JSON.parse(body)
    
    // Process the webhook event
    const webhookEvent = await processDataTransWebhook(data)

    // Find the order based on transaction ID or reference number
    let orderId: string | null = null
    
    if (webhookEvent.metadata?.refno) {
      // Look up order by order number
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', webhookEvent.metadata.refno)
        .single()
      
      if (order) {
        orderId = order.id
      }
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
    }

    if (!orderId) {
      console.error('Could not find order for DataTrans webhook:', webhookEvent)
      // Don't fail the webhook, just log and return success
      return NextResponse.json({ success: true })
    }

    // Log the payment event
    await supabase
      .from('payment_events')
      .insert({
        order_id: orderId,
        provider: 'datatrans',
        event_type: webhookEvent.eventType,
        status_before: null,
        status_after: webhookEvent.status,
        code: webhookEvent.metadata?.errorCode || null,
        message: webhookEvent.metadata?.errorMessage || `DataTrans webhook: ${webhookEvent.eventType}`,
        raw_payload: webhookEvent.rawPayload,
        correlation_id: data.transactionId,
      })

    // Update order status based on webhook event
    if (webhookEvent.status === 'paid') {
      // Update order to paid status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          provider_payment_id: webhookEvent.paymentId,
          paid_at: new Date().toISOString(),
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Failed to update order status:', updateError)
        throw updateError
      }

      // Queue emails for sending
      await queueOrderEmails(supabase, orderId)

      // Mark for Infoniqa sync
      await supabase
        .from('orders')
        .update({
          infoniqa_sync_status: 'pending',
        })
        .eq('id', orderId)
        .is('infoniqa_sync_status', null)

    } else if (webhookEvent.status === 'processing') {
      // Update to processing (authorized but not settled)
      await supabase
        .from('orders')
        .update({
          payment_status: 'processing',
          provider_payment_id: webhookEvent.paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

    } else if (webhookEvent.status === 'failed' || webhookEvent.status === 'cancelled' || webhookEvent.status === 'expired') {
      // Update order status
      await supabase
        .from('orders')
        .update({
          payment_status: webhookEvent.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      // Log error if failed
      if (webhookEvent.status === 'failed' && webhookEvent.metadata?.errorCode) {
        await supabase
          .from('payment_errors')
          .insert({
            order_id: orderId,
            provider: 'datatrans',
            error_type: 'payment_failed',
            error_code: webhookEvent.metadata.errorCode,
            error_message: webhookEvent.metadata.errorMessage || 'Payment failed',
            severity: 'error',
            context: webhookEvent.metadata,
            correlation_id: data.transactionId,
          })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DataTrans webhook processing error:', error)
    
    // Log error but return success to prevent DataTrans from retrying
    return NextResponse.json({ success: true })
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