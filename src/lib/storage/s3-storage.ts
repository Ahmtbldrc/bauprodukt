import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3'
import { s3Client, S3_BUCKET_NAME, S3_PUBLIC_URL_BASE } from '@/lib/s3-client'
import type { StorageProvider, UploadResult, DeleteResult, StorageFile } from './types'

export class S3StorageProvider implements StorageProvider {
  private bucketName: string

  constructor(bucketName?: string) {
    this.bucketName = bucketName || S3_BUCKET_NAME
    this.ensureBucketExists()
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }))
      
      // Set public read policy for the bucket
      await this.setBucketPublicPolicy()
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        try {
          // Create bucket if it doesn't exist
          await s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }))
          console.log(`Created S3 bucket: ${this.bucketName}`)
          
          // Set public read policy for the new bucket
          await this.setBucketPublicPolicy()
        } catch (createError: any) {
          // Ignore error if bucket already exists (race condition)
          if (createError.name !== 'BucketAlreadyOwnedByYou' && 
              createError.name !== 'BucketAlreadyExists') {
            console.error('Failed to create bucket:', createError)
          }
        }
      }
    }
  }

  private async setBucketPublicPolicy(): Promise<void> {
    try {
      const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`]
          }
        ]
      }

      await s3Client.send(new PutBucketPolicyCommand({
        Bucket: this.bucketName,
        Policy: JSON.stringify(bucketPolicy)
      }))
      
      console.log(`Set public read policy for bucket: ${this.bucketName}`)
    } catch (error) {
      console.error('Failed to set bucket policy:', error)
      // Don't throw error as bucket creation should still succeed
    }
  }

  async upload(file: File, folder: string, productId?: string): Promise<UploadResult> {
    try {
      // Generate unique key with original filename
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      
      // Clean the original filename - remove extension and sanitize
      const originalName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[^a-zA-Z0-9\-_]/g, '-') // Replace special chars with dash
        .replace(/-+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-|-$/g, '') // Remove leading/trailing dashes
        .toLowerCase()
      
      let key: string
      if (productId) {
        // Format: products/productId/productId-originalname-timestamp-random.ext
        key = `${folder}/${productId}/${productId}-${originalName}-${timestamp}-${random}.${fileExt}`
      } else {
        // Format: folder/originalname-timestamp-random.ext
        key = `${folder}/${originalName}-${timestamp}-${random}.${fileExt}`
      }

      return await this.uploadWithKey(file, key)
    } catch (error) {
      console.error('S3 upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async uploadWithKey(file: File, key: string): Promise<UploadResult> {
    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
        ContentLength: file.size,
      })

      await s3Client.send(command)

      // Generate public URL for the uploaded file
      const url = this.getPublicUrl(key)

      return {
        success: true,
        url,
        key
      }
    } catch (error) {
      console.error('S3 upload with key error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async delete(key: string): Promise<DeleteResult> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await s3Client.send(command)

      return { success: true }
    } catch (error) {
      console.error('S3 delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  getPublicUrl(key: string): string {
    // Return direct public URL to the object
    return `${S3_PUBLIC_URL_BASE}/${this.bucketName}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await s3Client.send(command)
      return true
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw error
    }
  }

  async list(prefix: string): Promise<StorageFile[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      })

      const response = await s3Client.send(command)
      const files: StorageFile[] = []

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key) {
            const url = this.getPublicUrl(object.Key)
            files.push({
              key: object.Key,
              url,
              size: object.Size,
              lastModified: object.LastModified,
            })
          }
        }
      }

      return files
    } catch (error) {
      console.error('S3 list error:', error)
      return []
    }
  }

  getProviderName(): string {
    return 'S3/MinIO'
  }
}

// Export a singleton instance
export const s3Storage = new S3StorageProvider()