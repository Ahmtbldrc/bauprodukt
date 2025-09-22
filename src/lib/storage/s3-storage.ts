import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client, S3_BUCKET_NAME, S3_PUBLIC_URL_BASE } from '@/lib/s3-client'
import type {
  StorageProvider,
  UploadResult,
  DeleteResult,
  StorageFile,
  CreateMultipartUploadParams,
  CreateMultipartUploadResult,
  GetMultipartUploadUrlParams,
  CompleteMultipartUploadParams,
  AbortMultipartUploadParams,
  UploadMultipartPartParams,
  UploadMultipartPartResult,
} from './types'

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
      
      // Set public read policy for the bucket and ensure CORS support
      await this.setBucketPublicPolicy()
      await this.setBucketCorsConfiguration()
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        try {
          // Create bucket if it doesn't exist
          await s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }))
          console.log(`Created S3 bucket: ${this.bucketName}`)
          
          // Set public read policy for the new bucket and ensure CORS support
          await this.setBucketPublicPolicy()
          await this.setBucketCorsConfiguration()
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

  private async setBucketCorsConfiguration(): Promise<void> {
    try {
      const allowedOriginsEnv = process.env.S3_ALLOWED_ORIGINS
      const allowedOrigins = allowedOriginsEnv
        ? allowedOriginsEnv.split(',').map(origin => origin.trim()).filter(Boolean)
        : ['*']

      await s3Client.send(new PutBucketCorsCommand({
        Bucket: this.bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : ['*'],
              ExposeHeaders: ['ETag', 'etag', 'x-amz-request-id'],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      }))
    } catch (error: any) {
      if (error?.Code === 'NotImplemented' || error?.name === 'NotImplemented') {
        console.warn('Bucket backend does not support CORS configuration via API; skipping automatic setup.')
        return
      }
      console.error('Failed to set bucket CORS configuration:', error)
      // Ignore to avoid breaking uploads if permissions are limited; callers can configure manually.
    }
  }

  private generateObjectKey(fileName: string, folder: string, productId?: string): string {
    const fileExt = fileName.split('.').pop()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)

    const baseName = fileName.replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()

    const normalizedExt = fileExt ? `.${fileExt}` : ''

    if (productId) {
      return `${folder}/${productId}/${productId}-${baseName}-${timestamp}-${random}${normalizedExt}`
    }

    return `${folder}/${baseName}-${timestamp}-${random}${normalizedExt}`
  }

  async upload(file: File, folder: string, productId?: string): Promise<UploadResult> {
    try {
      const key = this.generateObjectKey(file.name, folder, productId)
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

  async createMultipartUpload({ fileName, folder, productId, contentType }: CreateMultipartUploadParams): Promise<CreateMultipartUploadResult> {
    const key = this.generateObjectKey(fileName, folder, productId)

    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    })

    const response = await s3Client.send(command)

    if (!response.UploadId) {
      throw new Error('Failed to initiate multipart upload')
    }

    return {
      uploadId: response.UploadId,
      key,
    }
  }

  async getMultipartUploadUrl({ key, uploadId, partNumber, expiresIn = 3600 }: GetMultipartUploadUrlParams): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    })

    return getSignedUrl(s3Client, command, { expiresIn })
  }

  async uploadMultipartPart({ key, uploadId, partNumber, body }: UploadMultipartPartParams): Promise<UploadMultipartPartResult> {
    const buffer = Buffer.isBuffer(body)
      ? body
      : body instanceof Uint8Array
        ? Buffer.from(body)
        : Buffer.from(body)

    const command = new UploadPartCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: buffer,
      ContentLength: buffer.byteLength,
    })

    const response = await s3Client.send(command)
    const etag = response.ETag || response.ETag

    if (!etag) {
      throw new Error('Multipart upload part response missing ETag')
    }

    return {
      etag: etag.replace(/"/g, ''),
    }
  }

  async completeMultipartUpload({ key, uploadId, parts }: CompleteMultipartUploadParams): Promise<UploadResult> {
    if (!parts.length) {
      throw new Error('No parts provided for multipart completion')
    }

    const sortedParts = [...parts]
      .sort((a, b) => a.partNumber - b.partNumber)
      .map(part => ({
        ETag: part.etag,
        PartNumber: part.partNumber,
      }))

    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    })

    await s3Client.send(command)

    const url = this.getPublicUrl(key)

    return {
      success: true,
      key,
      url,
    }
  }

  async abortMultipartUpload({ key, uploadId }: AbortMultipartUploadParams): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
    })

    await s3Client.send(command)
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
