import axios from 'axios'
import crypto from 'crypto'
import { 
  PaymentSession, 
  PaymentSessionRequest, 
  PaymentWebhookEvent,
  PaymentProcessingError,
  mapDataTransStatus
} from './types'

// DataTrans API configuration
const DATATRANS_API_URL = process.env.DATATRANS_API_URL || 'https://api.sandbox.datatrans.com/v1'
const DATATRANS_MERCHANT_ID = process.env.DATATRANS_MERCHANT_ID || ''
const DATATRANS_PASSWORD = process.env.DATATRANS_PASSWORD || ''
const DATATRANS_SIGN_KEY = process.env.DATATRANS_SIGN_KEY || ''

/**
 * Create a DataTrans transaction
 */
export async function createDataTransSession(request: PaymentSessionRequest): Promise<PaymentSession> {
  try {
    if (!DATATRANS_MERCHANT_ID || !DATATRANS_PASSWORD) {
      throw new PaymentProcessingError(
        'DataTrans is not configured',
        'DATATRANS_NOT_CONFIGURED',
        'datatrans'
      )
    }

    // Create Basic Auth header
    const auth = Buffer.from(`${DATATRANS_MERCHANT_ID}:${DATATRANS_PASSWORD}`).toString('base64')

    // Prepare transaction initialization request
    const transactionRequest = {
      currency: request.currency || 'CHF',
      refno: request.orderNumber,
      amount: Math.round(request.amount * 100), // Convert to cents
      paymentMethods: ['TWI'], // Twint
      autoSettle: true,
      customer: {
        email: request.customerEmail,
        title: null,
        firstName: request.customerName.split(' ')[0] || '',
        lastName: request.customerName.split(' ').slice(1).join(' ') || '',
      },
      redirect: {
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        errorUrl: request.cancelUrl,
      },
      option: {
        createAlias: false,
        authenticationOnly: false,
      },
      webhook: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/datatrans`,
      },
      theme: {
        name: 'DT2015',
        configuration: {
          brandColor: '#F39236',
        },
      },
      language: 'de',
    }

    const response = await axios.post(
      `${DATATRANS_API_URL}/transactions`,
      transactionRequest,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.data.transactionId || !response.data.location) {
      throw new PaymentProcessingError(
        'Invalid DataTrans response',
        'INVALID_RESPONSE',
        'datatrans',
        response.data
      )
    }

    return {
      provider: 'datatrans',
      sessionId: response.data.transactionId,
      redirectUrl: response.data.location,
      amount: request.amount,
      currency: request.currency || 'CHF',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    }
  } catch (error) {
    if (error instanceof PaymentProcessingError) {
      throw error
    }

    if (axios.isAxiosError(error)) {
      throw new PaymentProcessingError(
        error.response?.data?.error?.message || 'Failed to create DataTrans session',
        error.response?.data?.error?.code || 'DATATRANS_ERROR',
        'datatrans',
        {
          status: error.response?.status,
          data: error.response?.data,
        }
      )
    }

    throw new PaymentProcessingError(
      'Failed to create DataTrans session',
      'DATATRANS_ERROR',
      'datatrans',
      error
    )
  }
}

/**
 * Verify DataTrans webhook signature (HMAC)
 */
export function verifyDataTransWebhook(
  payload: string,
  signature: string
): boolean {
  if (!DATATRANS_SIGN_KEY) {
    throw new PaymentProcessingError(
      'DataTrans sign key not configured',
      'SIGN_KEY_MISSING',
      'datatrans'
    )
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', DATATRANS_SIGN_KEY)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  } catch (error) {
    throw new PaymentProcessingError(
      'Failed to verify DataTrans webhook signature',
      'SIGNATURE_VERIFICATION_ERROR',
      'datatrans',
      error
    )
  }
}

/**
 * Process DataTrans webhook/callback
 */
export async function processDataTransWebhook(data: any): Promise<PaymentWebhookEvent> {
  const webhookEvent: PaymentWebhookEvent = {
    provider: 'datatrans',
    eventType: data.status || 'unknown',
    status: 'pending',
    rawPayload: data,
  }

  // Map DataTrans status to our status
  const status = data.status?.toLowerCase()
  
  switch (status) {
    case 'settled':
    case 'authorized':
      webhookEvent.status = status === 'settled' ? 'paid' : 'processing'
      webhookEvent.sessionId = data.transactionId
      webhookEvent.paymentId = data.acquirerAuthorizationCode
      webhookEvent.amount = data.amount ? data.amount / 100 : undefined
      webhookEvent.currency = data.currency
      webhookEvent.metadata = {
        refno: data.refno,
        paymentMethod: data.paymentMethod,
        acquirer: data.acquirer,
      }
      break

    case 'failed':
    case 'declined':
      webhookEvent.status = 'failed'
      webhookEvent.sessionId = data.transactionId
      webhookEvent.metadata = {
        refno: data.refno,
        errorCode: data.error?.code,
        errorMessage: data.error?.message,
      }
      break

    case 'cancelled':
      webhookEvent.status = 'cancelled'
      webhookEvent.sessionId = data.transactionId
      webhookEvent.metadata = {
        refno: data.refno,
      }
      break

    case 'expired':
      webhookEvent.status = 'expired'
      webhookEvent.sessionId = data.transactionId
      webhookEvent.metadata = {
        refno: data.refno,
      }
      break

    default:
      console.log(`Unhandled DataTrans webhook status: ${status}`)
  }

  return webhookEvent
}

/**
 * Get DataTrans transaction status
 */
export async function getDataTransTransactionStatus(transactionId: string): Promise<{
  status: string
  paymentId?: string
  amount?: number
  currency?: string
}> {
  try {
    if (!DATATRANS_MERCHANT_ID || !DATATRANS_PASSWORD) {
      throw new PaymentProcessingError(
        'DataTrans is not configured',
        'DATATRANS_NOT_CONFIGURED',
        'datatrans'
      )
    }

    const auth = Buffer.from(`${DATATRANS_MERCHANT_ID}:${DATATRANS_PASSWORD}`).toString('base64')

    const response = await axios.get(
      `${DATATRANS_API_URL}/transactions/${transactionId}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    )

    const transaction = response.data

    return {
      status: mapDataTransStatus(transaction.status || 'pending'),
      paymentId: transaction.acquirerAuthorizationCode,
      amount: transaction.amount ? transaction.amount / 100 : undefined,
      currency: transaction.currency,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new PaymentProcessingError(
        'Failed to get DataTrans transaction status',
        error.response?.data?.error?.code || 'GET_STATUS_ERROR',
        'datatrans',
        {
          transactionId,
          status: error.response?.status,
          error: error.response?.data,
        }
      )
    }

    throw new PaymentProcessingError(
      'Failed to get DataTrans transaction status',
      'GET_STATUS_ERROR',
      'datatrans',
      { transactionId, error }
    )
  }
}

/**
 * Cancel a DataTrans transaction
 */
export async function cancelDataTransTransaction(transactionId: string): Promise<void> {
  try {
    if (!DATATRANS_MERCHANT_ID || !DATATRANS_PASSWORD) {
      throw new PaymentProcessingError(
        'DataTrans is not configured',
        'DATATRANS_NOT_CONFIGURED',
        'datatrans'
      )
    }

    const auth = Buffer.from(`${DATATRANS_MERCHANT_ID}:${DATATRANS_PASSWORD}`).toString('base64')

    await axios.post(
      `${DATATRANS_API_URL}/transactions/${transactionId}/cancel`,
      {},
      {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    )
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // If transaction is already completed or cancelled, don't throw error
      if (error.response?.status === 400 && 
          error.response?.data?.error?.code === 'INVALID_TRANSACTION_STATUS') {
        return
      }

      throw new PaymentProcessingError(
        'Failed to cancel DataTrans transaction',
        error.response?.data?.error?.code || 'CANCEL_ERROR',
        'datatrans',
        {
          transactionId,
          status: error.response?.status,
          error: error.response?.data,
        }
      )
    }

    throw new PaymentProcessingError(
      'Failed to cancel DataTrans transaction',
      'CANCEL_ERROR',
      'datatrans',
      { transactionId, error }
    )
  }
}