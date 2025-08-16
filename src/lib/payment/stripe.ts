import Stripe from 'stripe'
import { 
  PaymentSession, 
  PaymentSessionRequest, 
  PaymentWebhookEvent,
  PaymentProcessingError,
  mapStripeStatus
} from './types'

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
})

/**
 * Create a Stripe Checkout Session
 */
export async function createStripeSession(request: PaymentSessionRequest): Promise<PaymentSession> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new PaymentProcessingError(
        'Stripe is not configured',
        'STRIPE_NOT_CONFIGURED',
        'stripe'
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          setup_future_usage: 'off_session'
        }
      },
      mode: 'payment',
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      customer_email: request.customerEmail,
      line_items: [
        {
          price_data: {
            currency: request.currency || 'chf',
            unit_amount: Math.round(request.amount * 100), // Convert to cents
            product_data: {
              name: `Bestellung ${request.orderNumber}`,
              description: `Bauprodukt Bestellung ${request.orderNumber}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: request.orderId,
        order_number: request.orderNumber,
      },
      locale: 'de',
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      allow_promotion_codes: false,
    })

    if (!session.url) {
      throw new PaymentProcessingError(
        'Failed to create payment session URL',
        'SESSION_URL_MISSING',
        'stripe'
      )
    }

    return {
      provider: 'stripe',
      sessionId: session.id,
      redirectUrl: session.url,
      amount: request.amount,
      currency: request.currency || 'CHF',
      expiresAt: new Date(session.expires_at * 1000),
    }
  } catch (error) {
    if (error instanceof PaymentProcessingError) {
      throw error
    }
    
    const stripeError = error as any
    throw new PaymentProcessingError(
      stripeError.message || 'Failed to create Stripe session',
      stripeError.code || 'STRIPE_ERROR',
      'stripe',
      {
        type: stripeError.type,
        statusCode: stripeError.statusCode,
        requestId: stripeError.requestId,
      }
    )
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new PaymentProcessingError(
      'Stripe webhook secret not configured',
      'WEBHOOK_SECRET_MISSING',
      'stripe'
    )
  }

  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    const err = error as Error
    throw new PaymentProcessingError(
      'Invalid webhook signature',
      'INVALID_SIGNATURE',
      'stripe',
      { error: err.message }
    )
  }
}

/**
 * Process Stripe webhook event
 */
export async function processStripeWebhook(event: Stripe.Event): Promise<PaymentWebhookEvent> {
  const webhookEvent: PaymentWebhookEvent = {
    provider: 'stripe',
    eventType: event.type,
    status: 'pending',
    rawPayload: event,
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      webhookEvent.sessionId = session.id
      webhookEvent.paymentId = session.payment_intent as string
      webhookEvent.status = 'paid'
      webhookEvent.amount = (session.amount_total || 0) / 100
      webhookEvent.currency = session.currency?.toUpperCase() || 'CHF'
      webhookEvent.metadata = session.metadata || undefined
      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      webhookEvent.sessionId = session.id
      webhookEvent.status = 'expired'
      webhookEvent.metadata = session.metadata || undefined
      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      webhookEvent.paymentId = paymentIntent.id
      webhookEvent.status = 'paid'
      webhookEvent.amount = paymentIntent.amount / 100
      webhookEvent.currency = paymentIntent.currency.toUpperCase()
      webhookEvent.metadata = paymentIntent.metadata || undefined
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      webhookEvent.paymentId = paymentIntent.id
      webhookEvent.status = 'failed'
      webhookEvent.metadata = paymentIntent.metadata || undefined
      break
    }

    case 'payment_intent.canceled': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      webhookEvent.paymentId = paymentIntent.id
      webhookEvent.status = 'cancelled'
      webhookEvent.metadata = paymentIntent.metadata || undefined
      break
    }

    case 'charge.succeeded':
    case 'charge.updated':
    case 'payment_intent.created':
      // These are informational events, no action needed
      console.log(`Informational Stripe webhook event: ${event.type}`)
      break

    default:
      // Log unhandled event types but don't throw error
      console.log(`Unhandled Stripe webhook event type: ${event.type}`)
  }

  return webhookEvent
}

/**
 * Retrieve a Stripe Checkout Session
 */
export async function retrieveStripeSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    })
    return session
  } catch (error) {
    const stripeError = error as any
    throw new PaymentProcessingError(
      'Failed to retrieve Stripe session',
      stripeError.code || 'RETRIEVE_SESSION_ERROR',
      'stripe',
      { sessionId, error: stripeError.message }
    )
  }
}

/**
 * Cancel a Stripe Checkout Session
 */
export async function cancelStripeSession(sessionId: string): Promise<void> {
  try {
    await stripe.checkout.sessions.expire(sessionId)
  } catch (error) {
    const stripeError = error as any
    // If session is already expired or completed, don't throw error
    if (stripeError.code === 'checkout.session.cannot_expire') {
      return
    }
    throw new PaymentProcessingError(
      'Failed to cancel Stripe session',
      stripeError.code || 'CANCEL_SESSION_ERROR',
      'stripe',
      { sessionId, error: stripeError.message }
    )
  }
}

/**
 * Get Stripe payment status from session
 */
export async function getStripePaymentStatus(sessionId: string): Promise<{
  status: string
  paymentId?: string
  amount?: number
  currency?: string
}> {
  try {
    const session = await retrieveStripeSession(sessionId)
    
    let status = 'pending'
    if (session.payment_status === 'paid') {
      status = 'paid'
    } else if (session.payment_status === 'unpaid') {
      if (session.status === 'expired') {
        status = 'expired'
      } else if (session.status === 'complete') {
        status = 'failed'
      }
    }

    return {
      status: mapStripeStatus(status),
      paymentId: session.payment_intent as string | undefined,
      amount: session.amount_total ? session.amount_total / 100 : undefined,
      currency: session.currency?.toUpperCase(),
    }
  } catch (error) {
    console.error('Error getting Stripe payment status:', error)
    throw error
  }
}