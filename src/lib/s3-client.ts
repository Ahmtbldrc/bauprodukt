import { S3Client } from '@aws-sdk/client-s3'

// S3/MinIO configuration
const s3Config = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  },
  forcePathStyle: true, // Required for MinIO
}

// Create S3 client instance
export const s3Client = new S3Client(s3Config)

// Bucket configuration
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'product-documents'

// Storage provider configuration
export const USE_S3_STORAGE = process.env.USE_S3_STORAGE === 'true'

// Public URL configuration
export const S3_PUBLIC_URL_BASE = process.env.S3_ENDPOINT || 'http://localhost:9000'