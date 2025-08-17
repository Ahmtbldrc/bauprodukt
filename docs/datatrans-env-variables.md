# DataTrans Environment Variables

This document outlines the environment variables required for DataTrans integration in the redirect mode.

## Required Environment Variables

### Core Configuration

- **`DATATRANS_MERCHANT_ID`**: Your 10-digit DataTrans merchant ID (REQUIRED)
  - Found in: UPP Administration > UPP Data
  - Example: `1100007283` (test) or `3xxxxxxxxx` (production)

- **`DATATRANS_HMAC_KEY`**: HMAC key for webhook signature verification (hex-encoded)
  - Found in: UPP Administration > Security > "Security signature"
  - Must enable "Security signature" checkbox first
  - Example: `3a4e8b2c9d1f6e7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2`

### Optional Configuration

- **`DATATRANS_PAYMENT_URL`**: DataTrans payment page URL
  - Default: `https://pay.sandbox.datatrans.com/v1/start` (test)
  - Production: `https://pay.datatrans.com/v1/start`

- **`DATATRANS_API_URL`**: DataTrans API base URL (for status checks)
  - Default: `https://api.sandbox.datatrans.com/v1` (test)  
  - Production: `https://api.datatrans.com/v1`

- **`DATATRANS_PASSWORD`**: Server-to-server password (REQUIRED for redirect method)
  - Found in: UPP Administration > Security > "Server-to-Server service security"
  - Required for transaction initialization even with redirect method

## Setup Instructions

### 1. Test Environment Setup

1. Request test merchant account from DataTrans
2. Log into test admin panel: https://admin.sandbox.datatrans.com/
3. Navigate to UPP Administration > UPP Data
4. Note your merchant ID
5. Navigate to UPP Administration > Security
6. Enable "Security signature" and generate HMAC key
7. Configure "URL Post" webhook endpoint: `{YOUR_DOMAIN}/api/webhooks/datatrans`

### 2. Production Environment Setup

1. Complete contract with DataTrans for production account
2. Log into production admin panel: https://admin.datatrans.com/
3. Follow same steps as test environment
4. Update environment variables with production values

## Environment File Example

```bash
# DataTrans Configuration
DATATRANS_MERCHANT_ID=1100007283
DATATRANS_HMAC_KEY=3a4e8b2c9d1f6e7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2

# Optional - defaults provided
DATATRANS_PAYMENT_URL=https://pay.sandbox.datatrans.com/v1/start
DATATRANS_API_URL=https://api.sandbox.datatrans.com/v1

# Required for transaction initialization
DATATRANS_PASSWORD=your_server_to_server_password
```

## WebAdmin Configuration

### URL Post (Webhook) Configuration

In the DataTrans WebAdmin tool:

1. Go to UPP Administration > UPP Data
2. Set "URL Post" to: `https://yourdomain.com/api/webhooks/datatrans`
3. This is where DataTrans will send payment notifications

### Security Configuration

1. Go to UPP Administration > Security
2. Enable "Security signature" 
3. Copy the generated HMAC key to `DATATRANS_HMAC_KEY`
4. Enable "Protect server-to-server services with password" if using API calls

### Payment Methods

The integration supports these payment methods:
- **VIS**: Visa
- **ECA**: Eurocard/Mastercard  
- **TWI**: TWINT (Swiss mobile payment)

These are configured in the redirect URL as `paymentMethod=VIS,ECA,TWI`.

## Security Notes

- Never commit HMAC keys to version control
- Use different merchant IDs for test and production
- HMAC key is hex-encoded, typically 64 characters long
- Webhook endpoint must be publicly accessible via HTTPS
- DataTrans requires TLS 1.2+ for all communications

## Troubleshooting

### Common Issues

1. **"Missing signature" errors**: Check DATATRANS_HMAC_KEY is set correctly
2. **"Invalid signature" errors**: Verify HMAC key matches WebAdmin configuration
3. **Order not found**: Ensure refno (order number) is unique and correctly passed
4. **Webhook not receiving calls**: Verify URL Post is configured in WebAdmin and publicly accessible

### Testing Webhooks

1. Use ngrok or similar tool for local development
2. Set webhook URL to: `https://your-ngrok-url.ngrok.io/api/webhooks/datatrans`
3. Monitor webhook calls in DataTrans admin panel
4. Check application logs for signature verification

## Important Notes on Redirect Method

The DataTrans redirect method still requires server-to-server API initialization:

1. Your server calls `/v1/transactions` API to initialize the transaction
2. DataTrans returns a `transactionId`
3. Your server constructs redirect URL: `https://pay.datatrans.com/v1/start/{transactionId}`
4. User is redirected to DataTrans payment page
5. After payment, user is redirected back to your success/error/cancel URLs
6. DataTrans sends webhook notification to confirm payment status

This hybrid approach ensures:
- Secure transaction initialization with authentication
- Simple redirect flow for the user
- Reliable webhook notifications for payment confirmation