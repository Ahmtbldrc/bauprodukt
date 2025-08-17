// Payment system types and interfaces

export type PaymentProvider = 'stripe' | 'datatrans'

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'

export type InfoniqaSyncStatus = 
  | 'pending'
  | 'success'
  | 'failed'
  | null

export interface PaymentSession {
  provider: PaymentProvider
  sessionId: string
  redirectUrl: string
  amount: number
  currency: string
  expiresAt?: Date
}

export interface PaymentSessionRequest {
  orderId: string
  orderNumber: string
  amount: number
  currency?: string
  customerEmail: string
  customerName: string
  successUrl: string
  cancelUrl: string
}

export interface PaymentWebhookEvent {
  provider: PaymentProvider
  eventType: string
  sessionId?: string
  paymentId?: string
  status: PaymentStatus
  amount?: number
  currency?: string
  metadata?: Record<string, unknown>
  rawPayload?: Record<string, unknown>
}

export interface PaymentError {
  code: string
  message: string
  provider?: PaymentProvider
  details?: Record<string, unknown>
}

export interface InfoniqaTransaction {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerAddress: {
    street: string
    postalCode: string
    city: string
    country: string
  }
  amount: number
  currency: string
  paymentProvider: PaymentProvider
  paymentStatus: 'paid'
  transactionDate: Date
  paymentId?: string
}

export interface EmailNotification {
  orderId: string
  recipientEmail: string
  recipientType: 'customer' | 'swiss_vfg'
  emailType: 'order_confirmation' | 'order_fulfillment' | 'payment_failure'
  subject: string
  bodyHtml: string
  bodyText?: string
}

export interface OrderWithPayment {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_province: string
  shipping_district: string
  shipping_postal_code: string
  shipping_address: string
  billing_province?: string
  billing_district?: string
  billing_postal_code?: string
  billing_address?: string
  total_amount: number
  status: string
  payment_provider?: PaymentProvider
  payment_status?: PaymentStatus
  currency?: string
  provider_session_id?: string
  provider_payment_id?: string
  infoniqa_sync_status?: InfoniqaSyncStatus
  infoniqa_transaction_id?: string
  requires_manual_reconciliation?: boolean
  paid_at?: Date
  created_at: Date
  updated_at: Date
  order_items?: Array<{
    id: string
    product_id: string
    product_name: string
    product_slug: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export class PaymentProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: PaymentProvider,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PaymentProcessingError'
  }
}

// Helper functions for status mapping
export function mapStripeStatus(stripeStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'paid': 'paid',
    'payment_failed': 'failed',
    'expired': 'expired',
    'canceled': 'cancelled',
    'processing': 'processing',
    'requires_payment_method': 'pending',
    'requires_confirmation': 'pending',
    'requires_action': 'pending'
  }
  return statusMap[stripeStatus] || 'pending'
}

export function mapDataTransStatus(dataTransStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'settled': 'paid',
    'authorized': 'processing',
    'failed': 'failed',
    'cancelled': 'cancelled',
    'expired': 'expired',
    'pending': 'pending'
  }
  return statusMap[dataTransStatus.toLowerCase()] || 'pending'
}

// Validation helpers
export function isValidPaymentProvider(provider: unknown): provider is PaymentProvider {
  return provider === 'stripe' || provider === 'datatrans'
}

export function isValidPaymentStatus(status: unknown): status is PaymentStatus {
  const validStatuses: PaymentStatus[] = ['pending', 'processing', 'paid', 'failed', 'cancelled', 'expired']
  return validStatuses.includes(status as PaymentStatus)
}