import axios from 'axios'
import { 
  InfoniqaTransaction,
  PaymentProcessingError,
  OrderWithPayment
} from './types'

// Auth0 configuration for Infoniqa
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || ''
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET || ''
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || ''
const AUTH0_TOKEN_URL = process.env.AUTH0_TOKEN_URL || ''

// Infoniqa API configuration
const INFONIQA_API_BASE = process.env.INFONIQA_API_BASE || ''

let cachedToken: { 
  access_token: string
  expires_at: number 
} | null = null

/**
 * Get Auth0 access token for Infoniqa API
 */
async function getInfoniqaAccessToken(): Promise<string> {
  try {
    // Check if we have a valid cached token
    if (cachedToken && Date.now() < cachedToken.expires_at) {
      return cachedToken.access_token
    }

    if (!AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET || !AUTH0_AUDIENCE || !AUTH0_TOKEN_URL) {
      throw new PaymentProcessingError(
        'Infoniqa Auth0 configuration is missing',
        'AUTH0_NOT_CONFIGURED'
      )
    }

    const response = await axios.post(
      AUTH0_TOKEN_URL,
      {
        grant_type: 'client_credentials',
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_CLIENT_SECRET,
        audience: AUTH0_AUDIENCE,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.data.access_token) {
      throw new PaymentProcessingError(
        'Failed to obtain Auth0 access token',
        'AUTH0_TOKEN_ERROR',
        undefined,
        response.data
      )
    }

    // Cache the token with expiry (subtract 5 minutes for safety)
    const expiresIn = response.data.expires_in || 3600
    cachedToken = {
      access_token: response.data.access_token,
      expires_at: Date.now() + (expiresIn - 300) * 1000,
    }

    return cachedToken.access_token
  } catch (error) {
    if (error instanceof PaymentProcessingError) {
      throw error
    }

    if (axios.isAxiosError(error)) {
      throw new PaymentProcessingError(
        'Failed to authenticate with Auth0',
        'AUTH0_ERROR',
        undefined,
        {
          status: error.response?.status,
          data: error.response?.data,
        }
      )
    }

    throw new PaymentProcessingError(
      'Failed to authenticate with Auth0',
      'AUTH0_ERROR',
      undefined,
      error
    )
  }
}

/**
 * Create a transaction in Infoniqa ONE 200
 */
export async function createInfoniqaTransaction(order: OrderWithPayment): Promise<{
  transactionId: string
  success: boolean
  error?: string
}> {
  try {
    if (!INFONIQA_API_BASE) {
      throw new PaymentProcessingError(
        'Infoniqa API base URL is not configured',
        'INFONIQA_NOT_CONFIGURED'
      )
    }

    if (!order.paid_at || order.payment_status !== 'paid') {
      throw new PaymentProcessingError(
        'Order is not paid',
        'ORDER_NOT_PAID'
      )
    }

    // Get access token
    const accessToken = await getInfoniqaAccessToken()

    // Prepare transaction data according to Infoniqa requirements
    const transactionData: InfoniqaTransaction = {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerAddress: {
        street: order.shipping_address,
        postalCode: order.shipping_postal_code,
        city: order.shipping_district,
        country: 'CH', // Default to Switzerland
      },
      amount: order.total_amount,
      currency: order.currency || 'CHF',
      paymentProvider: order.payment_provider!,
      paymentStatus: 'paid',
      transactionDate: order.paid_at,
      paymentId: order.provider_payment_id,
    }

    // Send transaction to Infoniqa
    const response = await axios.post(
      `${INFONIQA_API_BASE}/transactions`,
      transactionData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-External-Reference': order.order_number, // For idempotency
        },
      }
    )

    if (!response.data.transactionId) {
      throw new PaymentProcessingError(
        'Invalid Infoniqa response',
        'INFONIQA_INVALID_RESPONSE',
        undefined,
        response.data
      )
    }

    return {
      transactionId: response.data.transactionId,
      success: true,
    }
  } catch (error) {
    if (error instanceof PaymentProcessingError) {
      return {
        transactionId: '',
        success: false,
        error: error.message,
      }
    }

    if (axios.isAxiosError(error)) {
      // Check if it's a duplicate transaction (idempotency)
      if (error.response?.status === 409) {
        // Transaction already exists, treat as success
        const existingTransactionId = error.response?.data?.transactionId
        if (existingTransactionId) {
          return {
            transactionId: existingTransactionId,
            success: true,
          }
        }
      }

      return {
        transactionId: '',
        success: false,
        error: error.response?.data?.message || 'Failed to create Infoniqa transaction',
      }
    }

    return {
      transactionId: '',
      success: false,
      error: 'Failed to create Infoniqa transaction',
    }
  }
}

/**
 * Retry Infoniqa sync for failed transactions
 */
export async function retryInfoniqaSync(orderId: string): Promise<{
  success: boolean
  transactionId?: string
  error?: string
}> {
  try {
    // This function would be called by the API route to retry sync
    // The actual order fetching and sync logic would be in the API route
    // This is just a placeholder for the retry mechanism
    
    // In a real implementation, this would:
    // 1. Fetch the order from the database
    // 2. Validate it's eligible for retry
    // 3. Call createInfoniqaTransaction
    // 4. Update the database with the result
    
    return {
      success: false,
      error: 'Retry mechanism not fully implemented',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check Infoniqa transaction status
 */
export async function getInfoniqaTransactionStatus(transactionId: string): Promise<{
  exists: boolean
  status?: string
  data?: any
}> {
  try {
    if (!INFONIQA_API_BASE) {
      throw new PaymentProcessingError(
        'Infoniqa API base URL is not configured',
        'INFONIQA_NOT_CONFIGURED'
      )
    }

    const accessToken = await getInfoniqaAccessToken()

    const response = await axios.get(
      `${INFONIQA_API_BASE}/transactions/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    return {
      exists: true,
      status: response.data.status,
      data: response.data,
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        exists: false,
      }
    }

    throw error
  }
}