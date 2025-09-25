import { S3Client } from '@aws-sdk/client-s3'
import type { AwsCredentialIdentity } from '@aws-sdk/types'
import { HttpRequest } from '@smithy/protocol-http'

// S3/MinIO configuration
// Internal endpoint for SDK & presigned URLs (upload gateway)
const endpoint = (
  process.env.S3_INTERNAL_ENDPOINT ||
  process.env.S3_ENDPOINT ||
  'http://localhost:9000'
).replace(/\/$/, '')
const region = process.env.S3_REGION || 'us-east-1'
const credentials: AwsCredentialIdentity = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
}

const s3Config = {
  endpoint,
  region,
  credentials,
  forcePathStyle: true, // Required for MinIO
  // AWS SDK v3 will use SigV4 by default; explicit signer not required for MinIO
}

// Create S3 client instance
export const s3Client = new S3Client(s3Config)

// TEMP DEBUG: log multipart initiate/sign requests going through the SDK
s3Client.middlewareStack.add(
  (next) => async (args) => {
    const out = await next(args)
    const req = ((args as any).request || (out as any).request) as HttpRequest | undefined
    if (req && typeof req.path === 'string' && req.path.includes('uploads')) {
      console.log('>>> [DEBUG] Multipart Initiate Request')
      console.log('protocol:', (req as any).protocol)
      console.log('hostname:', (req as any).hostname)
      console.log('path    :', req.path)
      console.log('headers :', req.headers)
    }
    return out
  },
  { step: 'finalizeRequest' }
)

// Bucket configuration
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'product-documents'

// Storage provider configuration
export const USE_S3_STORAGE = process.env.USE_S3_STORAGE === 'true'

// Public URL configuration
// Public base for viewing files (could be CDN or 443 gateway)
export const S3_PUBLIC_URL_BASE = (
  process.env.S3_PUBLIC_URL_BASE ||
  process.env.S3_ENDPOINT ||
  'http://localhost:9000'
).replace(/\/$/, '')