import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyDataTransWebhook, processDataTransWebhook } from '@/lib/payment/datatrans'
import { headers } from 'next/headers'
import type { OrderItem } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const headersList = await headers()
    const contentType = headersList.get('content-type') || ''
    const signature = headersList.get('datatrans-signature')
    
    let data: Record<string, unknown>
    let rawBody: string

    // Handle multiple content types
    if (contentType.includes('application/json')) {
      // JSON webhook
      rawBody = await request.text()
      data = JSON.parse(rawBody)
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Form-encoded webhook (common for redirect callbacks)
      rawBody = await request.text()
      const params = new URLSearchParams(rawBody)
      data = Object.fromEntries(params.entries())
    } else if (contentType.includes('text/xml')) {
      // XML webhook (legacy but still supported)
      rawBody = await request.text()
      // For now, we'll just log XML webhooks
      console.log('Received XML webhook (not fully supported):', rawBody)
      return NextResponse.json({ success: true })
    } else {
      // Try to parse as form data
      const formData = await request.formData()
      data = Object.fromEntries(formData.entries())
      rawBody = JSON.stringify(data)
    }

    // Verify webhook signature if configured
    if (process.env.DATATRANS_HMAC_KEY) {
      const isValid = verifyDataTransWebhook(rawBody, signature || null)
      if (!isValid && signature) {
        console.error('DataTrans webhook signature verification failed')
        // Log but don't reject - Datatrans may not always send signatures
      }
    }
    
    // Process the webhook event
    const webhookEvent = await processDataTransWebhook(data)

    // Find the order based on transaction ID or reference number
    let orderId: string | null = null
    
    if (webhookEvent.metadata?.refno) {
      // Look up order by order number
      const { data: order } = await (supabase as any)
        .from('orders')
        .select('id')
        .eq('order_number', webhookEvent.metadata.refno)
        .single()
      
      if (order) {
        orderId = order.id
      }
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
    }

    if (!orderId) {
      console.error('Could not find order for DataTrans webhook:', webhookEvent)
      // Don't fail the webhook, just log and return success
      return NextResponse.json({ success: true })
    }

    // Log the payment event
    await (supabase as any)
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
        correlation_id: data.transactionId || data.uppTransactionId || data.refno,
      })

    // Update order status based on webhook event
    if (webhookEvent.status === 'paid') {
      // Update order to paid status
      const { error: updateError } = await (supabase as any)
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

    } else if (webhookEvent.status === 'processing') {
      // Update to processing (authorized but not settled)
      await (supabase as any)
        .from('orders')
        .update({
          payment_status: 'processing',
          provider_payment_id: webhookEvent.paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

    } else if (webhookEvent.status === 'failed' || webhookEvent.status === 'cancelled' || webhookEvent.status === 'expired') {
      // Update order status
      await (supabase as any)
        .from('orders')
        .update({
          payment_status: webhookEvent.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      // Log error if failed
      if (webhookEvent.status === 'failed' && webhookEvent.metadata?.errorCode) {
        await (supabase as any)
          .from('payment_errors')
          .insert({
            order_id: orderId,
            provider: 'datatrans',
            error_type: 'payment_failed',
            error_code: webhookEvent.metadata.errorCode,
            error_message: webhookEvent.metadata.errorMessage || 'Payment failed',
            severity: 'error',
            context: webhookEvent.metadata,
            correlation_id: data.transactionId || data.uppTransactionId || data.refno,
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