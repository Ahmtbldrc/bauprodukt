import axios from 'axios'
import crypto from 'crypto'
import { 
  PaymentSession, 
  PaymentSessionRequest, 
  PaymentWebhookEvent,
  PaymentProcessingError,
  mapDataTransStatus
} from './types'

// DataTrans configuration
const DATATRANS_MERCHANT_ID = process.env.DATATRANS_MERCHANT_ID || ''
const DATATRANS_PASSWORD = process.env.DATATRANS_PASSWORD || ''
const DATATRANS_HMAC_KEY = process.env.DATATRANS_HMAC_KEY || ''
const DATATRANS_PAYMENT_URL = process.env.DATATRANS_PAYMENT_URL || 'https://pay.sandbox.datatrans.com/v1/start'
const DATATRANS_API_URL = process.env.DATATRANS_API_URL || 'https://api.sandbox.datatrans.com/v1'

/**
 * Create a DataTrans Payment Page session (redirect method)
 * Uses the JSON API to initialize a transaction, then returns the redirect URL
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

    // Prepare transaction initialization request for redirect mode
    const transactionRequest = {
      currency: request.currency || 'CHF',
      refno: request.orderNumber,
      amount: Math.round(request.amount * 100), // Convert to cents
      paymentMethods: ['VIS', 'ECA', 'TWI'], // Visa, Mastercard, TWINT
      redirect: {
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        errorUrl: request.cancelUrl,
      },
      option: {
        createAlias: false,
      },
    }

    // Initialize transaction via API
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

    if (!response.data.transactionId) {
      throw new PaymentProcessingError(
        'Invalid DataTrans response',
        'INVALID_RESPONSE',
        'datatrans',
        response.data
      )
    }

    // Construct the redirect URL with the transaction ID
    const redirectUrl = `${DATATRANS_PAYMENT_URL}/${response.data.transactionId}`

    return {
      provider: 'datatrans',
      sessionId: response.data.transactionId,
      redirectUrl,
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
 * Verify DataTrans webhook signature
 * Supports multiple signature formats as Datatrans documentation varies
 */
export function verifyDataTransWebhook(
  payload: string,
  signature: string | null
): boolean {
  // If no HMAC key is configured, skip verification (for testing)
  if (!DATATRANS_HMAC_KEY) {
    console.warn('DataTrans HMAC key not configured, skipping signature verification')
    return true // Allow webhooks in test environment
  }

  if (!signature) {
    console.warn('No signature provided in webhook')
    return false
  }

  try {
    // Try format 1: "t=timestamp,s0=signature" (newer format)
    const timestampFormat = signature.match(/t=([^,]+),s0=([^,]+)/)
    if (timestampFormat) {
      const timestamp = timestampFormat[1]
      const receivedSignature = timestampFormat[2]
      const dataToSign = timestamp + payload

      const hmacKeyBuffer = Buffer.from(DATATRANS_HMAC_KEY, 'hex')
      const expectedSignature = crypto
        .createHmac('sha256', hmacKeyBuffer)
        .update(dataToSign, 'utf8')
        .digest('hex')

      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    }

    // Try format 2: Plain HMAC signature (legacy format)
    const hmacKeyBuffer = Buffer.from(DATATRANS_HMAC_KEY, 'hex')
    const expectedSignature = crypto
      .createHmac('sha256', hmacKeyBuffer)
      .update(payload, 'utf8')
      .digest('hex')

    // Check if the signature matches directly
    if (signature.toLowerCase() === expectedSignature.toLowerCase()) {
      return true
    }

    // Try format 3: For form-encoded callbacks, construct sign from parameters
    // This is used for redirect callbacks with sign parameter
    try {
      const params = JSON.parse(payload)
      if (params.sign) {
        // Construct the string to sign based on documented parameters
        const signString = [
          params.aliasCC || '',
          params.merchantId || DATATRANS_MERCHANT_ID,
          params.amount || '',
          params.currency || '',
          params.refno || ''
        ].join('')

        const calculatedSign = crypto
          .createHmac('sha256', hmacKeyBuffer)
          .update(signString, 'utf8')
          .digest('hex')

        return params.sign.toLowerCase() === calculatedSign.toLowerCase()
      }
    } catch {
      // Not JSON or no sign parameter
    }

    console.warn('Signature verification failed - no matching format')
    return false
  } catch (error) {
    console.error('DataTrans webhook signature verification error:', error)
    return false
  }
}

/**
 * Process DataTrans webhook/callback
 * Handles both JSON webhook events and form-encoded redirect callbacks
 */
interface DataTransWebhookData {
  status?: string
  responseCode?: string | number
  transactionId?: string
  uppTransactionId?: string
  refno?: string
  responseMessage?: string
  authorizationCode?: string
  acquirerAuthorizationCode?: string
  amount?: number | string
  currency?: string
  paymentMethod?: string
  acquirer?: string
  error?: {
    code?: string
    message?: string
  }
  [key: string]: unknown
}

export async function processDataTransWebhook(data: DataTransWebhookData): Promise<PaymentWebhookEvent> {
  const webhookEvent: PaymentWebhookEvent = {
    provider: 'datatrans',
    eventType: String(data.status || data.responseCode || 'unknown'),
    status: 'pending',
    rawPayload: data,
  }

  // Handle legacy response codes (for redirect/callback mode)
  if (data.responseCode) {
    const responseCode = parseInt(String(data.responseCode))
    switch (responseCode) {
      case 1: // Success/Authorized
        webhookEvent.status = 'paid'
        webhookEvent.sessionId = String(data.transactionId || data.uppTransactionId || '')
        webhookEvent.paymentId = String(data.authorizationCode || '')
        webhookEvent.amount = data.amount ? parseFloat(String(data.amount)) / 100 : undefined
        webhookEvent.currency = String(data.currency || '')
        webhookEvent.metadata = {
          refno: data.refno,
          responseMessage: data.responseMessage,
        }
        break

      case 4: // Declined or error
        webhookEvent.status = 'failed'
        webhookEvent.sessionId = String(data.transactionId || data.uppTransactionId || '')
        webhookEvent.metadata = {
          refno: data.refno,
          responseMessage: data.responseMessage,
        }
        break

      case 9: // Cancelled by user
        webhookEvent.status = 'cancelled'
        webhookEvent.sessionId = String(data.transactionId || data.uppTransactionId || '')
        webhookEvent.metadata = {
          refno: data.refno,
          responseMessage: data.responseMessage,
        }
        break

      default:
        console.log(`Unhandled DataTrans response code: ${responseCode}`)
    }
  } else {
    // Handle modern JSON status (for API/webhook mode)
    const status = String(data.status || '').toLowerCase()
    
    switch (status) {
      case 'settled':
      case 'authorized':
        webhookEvent.status = status === 'settled' ? 'paid' : 'processing'
        webhookEvent.sessionId = String(data.transactionId || '')
        webhookEvent.paymentId = String(data.acquirerAuthorizationCode || '')
        webhookEvent.amount = data.amount ? Number(data.amount) / 100 : undefined
        webhookEvent.currency = String(data.currency || '')
        webhookEvent.metadata = {
          refno: data.refno,
          paymentMethod: data.paymentMethod,
          acquirer: data.acquirer,
        }
        break

      case 'failed':
      case 'declined':
        webhookEvent.status = 'failed'
        webhookEvent.sessionId = String(data.transactionId || '')
        webhookEvent.metadata = {
          refno: data.refno,
          errorCode: data.error?.code,
          errorMessage: data.error?.message,
        }
        break

      case 'cancelled':
        webhookEvent.status = 'cancelled'
        webhookEvent.sessionId = String(data.transactionId || '')
        webhookEvent.metadata = {
          refno: data.refno,
        }
        break

      case 'expired':
        webhookEvent.status = 'expired'
        webhookEvent.sessionId = String(data.transactionId || '')
        webhookEvent.metadata = {
          refno: data.refno,
        }
        break

      default:
        console.log(`Unhandled DataTrans webhook status: ${status}`)
    }
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