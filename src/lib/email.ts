// Email service for order notifications
// This is a placeholder implementation - in a real application, you would use a service like SendGrid, Mailgun, or AWS SES

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // In a real implementation, you would send the email here
    // For now, we'll just log the email data
    console.log('Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html
    })
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export function generateOrderConfirmationEmail(orderData: {
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
  createdAt: string
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
          <p><strong>Datum:</strong> ${new Date(orderData.createdAt).toLocaleDateString('de-DE')}</p>
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
