# Email Notification System

This document describes the email notification system implementation for post-payment notifications using SMTP.

## Overview

The email system sends two types of notifications after successful payment:
1. **Customer Confirmation Email** - Sent to the customer with order details
2. **Swiss VFG Fulfillment Email** - Sent to Swiss VFG with complete order details for fulfillment

## Features

- **SMTP Integration**: Uses nodemailer with TLS/STARTTLS encryption
- **Idempotent Sending**: Prevents duplicate emails using unique keys
- **Retry Mechanism**: Automatic retry with exponential backoff (3 attempts)
- **German Localization**: All customer-facing content in German
- **Error Handling**: Comprehensive error logging and recovery
- **Configuration Validation**: Environment variable validation

## Configuration

### Required Environment Variables

```bash
# SMTP Server Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-app-password

# Email Sender Information
SMTP_FROM_EMAIL=noreply@bauprodukt.com
SMTP_FROM_NAME=Bauprodukt

# Swiss VFG Fulfillment Email
SWISS_VFG_EMAIL=fulfillment@swissvfg.ch
```

### SMTP Providers

The system supports any SMTP provider. Common configurations:

#### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # App-specific password required
```

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

## Usage

### Automatic Integration

Emails are automatically sent when payment webhooks mark orders as paid:
- Stripe webhook: `checkout.session.completed`
- DataTrans webhook: Payment success callback

### Manual Testing

Test email functionality using the API endpoint:

```bash
# Check configuration
GET /api/email/test

# Send test emails
POST /api/email/test
Content-Type: application/json

{
  "customerEmail": "test@example.com",
  "customerName": "Test Customer",
  "paymentProvider": "stripe"
}
```

## Email Templates

### Customer Confirmation Email

**Subject**: `Bestellbestätigung - [ORDER_NUMBER]`

**Content**:
- Order confirmation in German
- Order number and payment details
- Payment provider and status
- Complete item list with quantities and prices
- Shipping address
- Total amount

### Swiss VFG Fulfillment Email

**Subject**: `Neue Bestellung zur Abwicklung - [ORDER_NUMBER]`

**Content**:
- Complete order details for fulfillment
- Customer information and shipping address
- Product list with IDs for identification
- Payment confirmation details
- Special notes about payment status

## API Functions

### `sendPostPaymentEmails(orderData)`

Main function to send both customer and Swiss VFG emails.

**Parameters**:
```typescript
{
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
}
```

**Returns**:
```typescript
{
  customerEmailSent: boolean
  swissVFGEmailSent: boolean
}
```

### `verifyEmailConfig()`

Validates SMTP configuration.

**Returns**:
```typescript
{
  isValid: boolean
  missingVars: string[]
}
```

## Error Handling

### Retry Mechanism

- **Max Attempts**: 3 retries per email
- **Retry Delay**: Exponential backoff (5s, 10s, 15s)
- **Idempotency**: Prevents duplicate sends using order ID + template key

### Error Logging

All email events are logged to the `payment_events` table:
- Successful sends
- Failed attempts
- Configuration errors
- SMTP connection issues

### Failure Recovery

- Email failures don't block webhook processing
- Failed emails are queued for retry
- Manual retry possible through logs
- Configuration validation prevents startup issues

## Security

### SMTP Security

- **TLS Encryption**: All connections use TLS/STARTTLS
- **Authentication**: Username/password or API key authentication
- **Certificate Validation**: Enforced SSL certificate validation

### Data Protection

- **No PII in Logs**: Sensitive data excluded from error logs
- **Email Content**: Only necessary order information included
- **Access Control**: Environment variables for sensitive configuration

## Monitoring

### Queue Status

Monitor email queue status:
```typescript
import { getEmailQueueStatus } from '@/lib/email'

const status = getEmailQueueStatus()
// Returns: { totalQueued, pending, failed, queue }
```

### Metrics to Monitor

- Email send success rate
- Average retry attempts
- SMTP connection health
- Queue depth and processing time

## Testing

### Local Development

1. Configure SMTP provider credentials
2. Use test endpoint: `POST /api/email/test`
3. Check console logs for sending status
4. Verify emails received in test accounts

### Production Verification

1. Test with sandbox payment providers
2. Verify both customer and Swiss VFG emails
3. Check email deliverability and formatting
4. Monitor error logs for issues

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check SMTP credentials
   - Verify app-specific passwords for Gmail
   - Confirm account access permissions

2. **Connection Timeout**
   - Verify SMTP host and port
   - Check firewall/network restrictions
   - Confirm TLS/SSL settings

3. **Emails Not Delivered**
   - Check spam folders
   - Verify sender reputation
   - Confirm recipient email addresses

4. **Configuration Errors**
   - Use `GET /api/email/test` to check config
   - Verify all required environment variables
   - Check for typos in variable names

### Support

For email delivery issues:
1. Check application logs for error details
2. Verify SMTP provider status
3. Test with alternative SMTP provider
4. Contact SMTP provider support if needed