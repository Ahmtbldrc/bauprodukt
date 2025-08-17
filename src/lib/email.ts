import nodemailer from 'nodemailer'

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: {
    email: string
    name: string
  }
}

// SMTP configuration from environment variables
function getSMTPConfig(): SMTPConfig {
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USERNAME',
    'SMTP_PASSWORD',
    'SMTP_FROM_EMAIL',
    'SMTP_FROM_NAME'
  ]

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }

  return {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USERNAME!,
      pass: process.env.SMTP_PASSWORD!
    },
    from: {
      email: process.env.SMTP_FROM_EMAIL!,
      name: process.env.SMTP_FROM_NAME!
    }
  }
}

// Create transporter with retry mechanism
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const config = getSMTPConfig()
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: true
      }
    })
  }
  return transporter
}

// Email queue for retry mechanism
interface QueuedEmail {
  id: string
  emailData: EmailData
  attempts: number
  maxAttempts: number
  lastAttempt?: Date
  error?: string
}

const emailQueue: Map<string, QueuedEmail> = new Map()
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 5000 // 5 seconds

// Generate unique ID for emails to prevent duplicates
function generateEmailId(orderId: string, template: string): string {
  return `${orderId}-${template}-${Date.now()}`
}

// Sleep helper for retry delays (unused but kept for future use)
// function sleep(ms: number): Promise<void> {
//   return new Promise(resolve => setTimeout(resolve, ms))
// }

export async function sendEmail(emailData: EmailData, idempotencyKey?: string): Promise<boolean> {
  const emailId = idempotencyKey || generateEmailId(Date.now().toString(), 'generic')
  
  // Check if this email was already sent successfully
  const existingEmail = emailQueue.get(emailId)
  if (existingEmail && existingEmail.attempts >= existingEmail.maxAttempts) {
    console.log(`Email ${emailId} already processed with max attempts`)
    return false
  }

  try {
    const transporter = getTransporter()
    const config = getSMTPConfig()
    
    const mailOptions = {
      from: `"${config.from.name}" <${config.from.email}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    }

    console.log(`Attempting to send email ${emailId} to ${emailData.to}`)
    
    const result = await transporter.sendMail(mailOptions)
    
    console.log(`Email sent successfully: ${emailId}`, {
      messageId: result.messageId,
      to: emailData.to,
      subject: emailData.subject
    })
    
    // Remove from queue on success
    emailQueue.delete(emailId)
    
    return true
  } catch (error) {
    console.error(`Failed to send email ${emailId}:`, error)
    
    // Add to retry queue
    const queuedEmail: QueuedEmail = {
      id: emailId,
      emailData,
      attempts: (existingEmail?.attempts || 0) + 1,
      maxAttempts: MAX_RETRY_ATTEMPTS,
      lastAttempt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    
    emailQueue.set(emailId, queuedEmail)
    
    // Schedule retry if not at max attempts
    if (queuedEmail.attempts < queuedEmail.maxAttempts) {
      console.log(`Scheduling retry ${queuedEmail.attempts}/${queuedEmail.maxAttempts} for email ${emailId}`)
      setTimeout(() => retryEmail(emailId), RETRY_DELAY_MS * queuedEmail.attempts)
    } else {
      console.error(`Email ${emailId} failed after ${queuedEmail.maxAttempts} attempts`)
    }
    
    return false
  }
}

// Retry failed emails
async function retryEmail(emailId: string): Promise<void> {
  const queuedEmail = emailQueue.get(emailId)
  if (!queuedEmail || queuedEmail.attempts >= queuedEmail.maxAttempts) {
    return
  }
  
  console.log(`Retrying email ${emailId}, attempt ${queuedEmail.attempts + 1}/${queuedEmail.maxAttempts}`)
  await sendEmail(queuedEmail.emailData, emailId)
}

// Get email queue status for monitoring
export function getEmailQueueStatus() {
  const queue = Array.from(emailQueue.values())
  return {
    totalQueued: queue.length,
    pending: queue.filter(e => e.attempts < e.maxAttempts).length,
    failed: queue.filter(e => e.attempts >= e.maxAttempts).length,
    queue: queue.map(e => ({
      id: e.id,
      attempts: e.attempts,
      maxAttempts: e.maxAttempts,
      lastAttempt: e.lastAttempt,
      error: e.error
    }))
  }
}

// Customer order confirmation email (post-payment only)
export function generateCustomerOrderConfirmationEmail(orderData: {
  orderNumber: string
  customerName: string
  customerEmail: string
  totalAmount: number
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  shippingAddress: string
  paymentProvider: string
  paymentStatus: string
  createdAt: string
  paidAt: string
}) {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">CHF ${item.unit_price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">CHF ${item.total_price.toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bestellbestätigung</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #F39236; margin: 0;">Bauprodukt</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Ihre Bestellung wurde erfolgreich aufgenommen</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 20px 0; color: #333;">Bestellbestätigung</h2>
          <p><strong>Bestellnummer:</strong> ${orderData.orderNumber}</p>
          <p><strong>Bestelldatum:</strong> ${new Date(orderData.createdAt).toLocaleDateString('de-DE')}</p>
          <p><strong>Zahlungsdatum:</strong> ${new Date(orderData.paidAt).toLocaleDateString('de-DE')}</p>
          <p><strong>Zahlungsanbieter:</strong> ${orderData.paymentProvider === 'stripe' ? 'Stripe (Karte/Wallet)' : 'DataTrans (TWINT)'}</p>
          <p><strong>Zahlungsstatus:</strong> <span style="color: #10b981; font-weight: bold;">${orderData.paymentStatus === 'paid' ? 'Bezahlt' : orderData.paymentStatus}</span></p>
          <p><strong>Gesamtbetrag:</strong> CHF ${orderData.totalAmount.toFixed(2)}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0;">Bestellte Artikel</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd;">Produkt</th>
                <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #ddd;">Menge</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #ddd;">Einzelpreis</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #ddd;">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0;">Lieferadresse</h3>
          <p style="margin: 0;">${orderData.shippingAddress}</p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          <p>Vielen Dank für Ihre Bestellung!</p>
          <p>Sie können den Status Ihrer Bestellung jederzeit unter <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" style="color: #F39236;">unserer Website</a> verfolgen.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    to: orderData.customerEmail,
    subject: `Bestellbestätigung - ${orderData.orderNumber}`,
    html
  }
}

// Swiss VFG fulfillment email (post-payment only)
export function generateSwissVFGFulfillmentEmail(orderData: {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  totalAmount: number
  items: Array<{
    product_name: string
    product_id: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  paymentProvider: string
  paymentStatus: string
  providerTransactionId?: string
  createdAt: string
  paidAt: string
}) {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.product_id}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">CHF ${item.unit_price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">CHF ${item.total_price.toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Neue Bestellung zur Abwicklung</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #F39236; margin: 0;">Bauprodukt - Neue Bestellung</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Bestellung zur Abwicklung</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 20px 0; color: #333;">Bestelldetails</h2>
          <p><strong>Bestellnummer:</strong> ${orderData.orderNumber}</p>
          <p><strong>Bestelldatum:</strong> ${new Date(orderData.createdAt).toLocaleDateString('de-DE')}</p>
          <p><strong>Zahlungsdatum:</strong> ${new Date(orderData.paidAt).toLocaleDateString('de-DE')}</p>
          <p><strong>Zahlungsanbieter:</strong> ${orderData.paymentProvider}</p>
          <p><strong>Zahlungsstatus:</strong> ${orderData.paymentStatus}</p>
          ${orderData.providerTransactionId ? `<p><strong>Transaktions-ID:</strong> ${orderData.providerTransactionId}</p>` : ''}
          <p><strong>Gesamtbetrag:</strong> CHF ${orderData.totalAmount.toFixed(2)}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0;">Kundendetails</h3>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
            <p><strong>Name:</strong> ${orderData.customerName}</p>
            <p><strong>E-Mail:</strong> ${orderData.customerEmail}</p>
            <p><strong>Lieferadresse:</strong><br>
              ${orderData.customerAddress.street}<br>
              ${orderData.customerAddress.postalCode} ${orderData.customerAddress.city}<br>
              ${orderData.customerAddress.country}
            </p>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0;">Bestellte Artikel</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd;">Produkt</th>
                <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #ddd;">Produkt-ID</th>
                <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #ddd;">Menge</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #ddd;">Einzelpreis</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #ddd;">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f9f9f9; font-weight: bold;">
                <td colspan="4" style="padding: 12px 8px; text-align: right; border-top: 2px solid #ddd;">Gesamtbetrag:</td>
                <td style="padding: 12px 8px; text-align: right; border-top: 2px solid #ddd;">CHF ${orderData.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="background: #e6f3ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #1e40af;">Wichtige Hinweise</h3>
          <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
            <li>Zahlung ist bereits erfolgt und bestätigt</li>
            <li>Bitte Bestellung zeitnah bearbeiten</li>
            <li>Alle Produktdaten stammen aus dem Web-Scraping Ihrer Website</li>
            <li>Bei Fragen kontaktieren Sie uns unter der Bestellnummer</li>
          </ul>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          <p>Diese E-Mail wurde automatisch generiert nach erfolgreicher Zahlung.</p>
          <p>Bauprodukt Online-Shop</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Swiss VFG email address should be configured as environment variable
  const swissVFGEmail = process.env.SWISS_VFG_EMAIL || 'fulfillment@swissvfg.ch'

  return {
    to: swissVFGEmail,
    subject: `Neue Bestellung zur Abwicklung - ${orderData.orderNumber}`,
    html
  }
}

// Send post-payment notification emails (customer + Swiss VFG)
export async function sendPostPaymentEmails(orderData: {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  totalAmount: number
  items: Array<{
    product_name: string
    product_id: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  paymentProvider: string
  paymentStatus: string
  providerTransactionId?: string
  createdAt: string
  paidAt: string
}): Promise<{ customerEmailSent: boolean; swissVFGEmailSent: boolean }> {
  
  // Generate idempotency keys to prevent duplicate emails
  const customerEmailId = generateEmailId(orderData.orderId, 'customer-confirmation')
  const swissVFGEmailId = generateEmailId(orderData.orderId, 'swissvfg-fulfillment')
  
  console.log(`Sending post-payment emails for order ${orderData.orderNumber}`)
  
  // Send customer confirmation email
  const customerEmail = generateCustomerOrderConfirmationEmail({
    orderNumber: orderData.orderNumber,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    totalAmount: orderData.totalAmount,
    items: orderData.items,
    shippingAddress: `${orderData.customerAddress.street}\n${orderData.customerAddress.postalCode} ${orderData.customerAddress.city}\n${orderData.customerAddress.country}`,
    paymentProvider: orderData.paymentProvider,
    paymentStatus: orderData.paymentStatus,
    createdAt: orderData.createdAt,
    paidAt: orderData.paidAt
  })
  
  // Send Swiss VFG fulfillment email
  const swissVFGEmail = generateSwissVFGFulfillmentEmail({
    orderNumber: orderData.orderNumber,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    customerAddress: orderData.customerAddress,
    totalAmount: orderData.totalAmount,
    items: orderData.items,
    paymentProvider: orderData.paymentProvider,
    paymentStatus: orderData.paymentStatus,
    providerTransactionId: orderData.providerTransactionId,
    createdAt: orderData.createdAt,
    paidAt: orderData.paidAt
  })
  
  // Send emails in parallel but handle failures independently
  const [customerEmailSent, swissVFGEmailSent] = await Promise.all([
    sendEmail(customerEmail, customerEmailId).catch(error => {
      console.error(`Failed to send customer email for order ${orderData.orderNumber}:`, error)
      return false
    }),
    sendEmail(swissVFGEmail, swissVFGEmailId).catch(error => {
      console.error(`Failed to send Swiss VFG email for order ${orderData.orderNumber}:`, error)
      return false
    })
  ])
  
  console.log(`Post-payment emails for order ${orderData.orderNumber}:`, {
    customerEmailSent,
    swissVFGEmailSent
  })
  
  return {
    customerEmailSent,
    swissVFGEmailSent
  }
}

// Verify SMTP configuration
export function verifyEmailConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USERNAME', 
    'SMTP_PASSWORD',
    'SMTP_FROM_EMAIL',
    'SMTP_FROM_NAME'
  ]
  
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  }
}

// Order status update email (optional - not required for v1)
export function generateOrderStatusUpdateEmail(orderData: {
  orderNumber: string
  customerName: string
  customerEmail: string
  status: string
  statusLabel: string
  updatedAt: string
}) {
  const statusColors = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#f97316',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444'
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bestellstatus aktualisiert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #F39236; margin: 0;">Bauprodukt</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Ihre Bestellung wurde aktualisiert</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 20px 0; color: #333;">Statusaktualisierung</h2>
          <p><strong>Bestellnummer:</strong> ${orderData.orderNumber}</p>
          <p><strong>Neuer Status:</strong> <span style="color: ${statusColors[orderData.status as keyof typeof statusColors] || '#666'}; font-weight: bold;">${orderData.statusLabel}</span></p>
          <p><strong>Aktualisiert am:</strong> ${new Date(orderData.updatedAt).toLocaleDateString('de-DE')}</p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          <p>Sie können den aktuellen Status Ihrer Bestellung jederzeit unter <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" style="color: #F39236;">unserer Website</a> verfolgen.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    to: orderData.customerEmail,
    subject: `Bestellstatus aktualisiert - ${orderData.orderNumber}`,
    html
  }
}
