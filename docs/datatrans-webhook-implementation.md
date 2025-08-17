# DataTrans Webhook Implementation

## Overview

Our DataTrans webhook implementation supports multiple formats and content types to ensure compatibility with various DataTrans integration methods.

## Supported Content Types

### 1. application/json
- Modern webhook format
- Used for API-based integrations
- Contains structured JSON payload

### 2. application/x-www-form-urlencoded
- Common for redirect callbacks
- URL-encoded parameters
- Legacy but still widely used

### 3. text/xml
- Legacy format mentioned in docs
- Currently logged but not fully parsed
- Can be extended if needed

### 4. multipart/form-data
- Fallback support
- Parsed and converted to JSON

## Signature Verification

The implementation supports multiple signature verification methods:

### Format 1: Timestamp-based Signature
- Header format: `t=timestamp,s0=signature`
- Algorithm: HMAC-SHA256(timestamp + payload, hmac_key)
- Used in newer implementations

### Format 2: Direct HMAC
- Plain HMAC-SHA256 signature
- Algorithm: HMAC-SHA256(payload, hmac_key)
- Legacy format support

### Format 3: Parameter-based Sign
- For form-encoded callbacks with `sign` parameter
- Constructs sign from: aliasCC + merchantId + amount + currency + refno
- Algorithm: HMAC-SHA256(concatenated_params, hmac_key)

## Webhook Payload Processing

### Success Response
```json
{
  "status": "authorized",
  "transactionId": "230704151319363016",
  "authorizationCode": "153133651",
  "amount": 1000,
  "currency": "CHF",
  "refno": "ORDER-12345"
}
```

### Error Response
```json
{
  "status": "failed",
  "transactionId": "230704151319363016",
  "errorCode": "DECLINED",
  "errorMessage": "Transaction declined",
  "refno": "ORDER-12345"
}
```

## Response Codes (Legacy Format)

- `01` or `1`: Success/Authorized → `paid`
- `04` or `4`: Declined/Error → `failed`
- `09` or `9`: Cancelled by user → `cancelled`

## Configuration

### Required Environment Variables

```bash
# HMAC key for signature verification (hex-encoded)
DATATRANS_HMAC_KEY=your_hex_encoded_hmac_key

# Optional: Skip verification in test environment
# If HMAC key is not set, verification is skipped with a warning
```

### Webhook URL Configuration

In DataTrans WebAdmin:
1. Navigate to UPP Administration > UPP Data
2. Set "URL Post" to: `https://yourdomain.com/api/webhooks/datatrans`

## Security Considerations

1. **Flexible Verification**: Supports multiple signature formats for compatibility
2. **Test Mode**: Allows webhooks without signature in test environment (with warning)
3. **Non-blocking**: Failed signature verification logs error but doesn't reject webhook
4. **Timing Attack Prevention**: Uses `crypto.timingSafeEqual` for signature comparison

## Error Handling

- **Missing Signature**: Logged as warning, webhook processed
- **Invalid Signature**: Logged as error, webhook still processed
- **Parse Errors**: Gracefully handled with fallback parsing
- **Unknown Formats**: Logged for investigation

## Testing

### Test with cURL

```bash
# JSON webhook
curl -X POST https://your-domain.com/api/webhooks/datatrans \
  -H "Content-Type: application/json" \
  -H "datatrans-signature: t=1234567890,s0=abc123..." \
  -d '{"status":"authorized","transactionId":"123"}'

# Form-encoded webhook
curl -X POST https://your-domain.com/api/webhooks/datatrans \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "status=authorized&transactionId=123&refno=ORDER-123"
```

### Local Testing with ngrok

```bash
# Start ngrok
ngrok http 3000

# Configure webhook URL in DataTrans WebAdmin
https://your-ngrok-url.ngrok.io/api/webhooks/datatrans
```

## Troubleshooting

### Common Issues

1. **Signature Verification Fails**
   - Check HMAC key is correctly configured
   - Verify hex encoding of HMAC key
   - Check signature header format

2. **Webhook Not Received**
   - Verify URL is publicly accessible
   - Check firewall/security rules
   - Confirm webhook configuration in WebAdmin

3. **Order Not Found**
   - Ensure refno matches order_number
   - Check transaction ID mapping
   - Verify order exists in database

## Future Enhancements

1. **XML Parsing**: Full XML webhook support if needed
2. **Retry Logic**: Implement webhook retry handling
3. **Rate Limiting**: Add rate limiting for webhook endpoint
4. **Monitoring**: Add webhook metrics and alerting