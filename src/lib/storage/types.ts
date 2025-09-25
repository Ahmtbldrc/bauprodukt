export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export interface DeleteResult {
  success: boolean
  error?: string
}

export interface StorageFile {
  key: string
  url: string
  size?: number
  contentType?: string
  lastModified?: Date
}

export interface StorageProvider {
  // Upload a file to storage
  upload(file: File, folder: string, productId?: string): Promise<UploadResult>
  
  // Upload with specific key
  uploadWithKey(file: File, key: string): Promise<UploadResult>
  
  // Delete a file from storage
  delete(key: string): Promise<DeleteResult>
  
  // Check if a file exists
  exists(key: string): Promise<boolean>
  
  // List files in a folder
  list(prefix: string): Promise<StorageFile[]>
  
  // Get the provider name
  getProviderName(): string

  // Multipart upload helpers (optional per provider)
  createMultipartUpload?(params: CreateMultipartUploadParams): Promise<CreateMultipartUploadResult>
  getMultipartUploadUrl?(params: GetMultipartUploadUrlParams): Promise<string>
  completeMultipartUpload?(params: CompleteMultipartUploadParams): Promise<UploadResult>
  abortMultipartUpload?(params: AbortMultipartUploadParams): Promise<void>
  uploadMultipartPart?(params: UploadMultipartPartParams): Promise<UploadMultipartPartResult>

  // Single-part presign for small files (<5 MiB)
  getPutObjectUrl?(params: GetPutObjectUrlParams): Promise<{ url: string; key: string }>
}

export interface FileValidation {
  valid: boolean
  error?: string
}

export interface CreateMultipartUploadParams {
  fileName: string
  folder: string
  productId?: string
  contentType?: string
}

export interface CreateMultipartUploadResult {
  uploadId: string
  key: string
}

export interface GetMultipartUploadUrlParams {
  key: string
  uploadId: string
  partNumber: number
  expiresIn?: number
}

export interface CompleteMultipartUploadParams {
  key: string
  uploadId: string
  parts: Array<{ partNumber: number; etag: string }>
  contentType?: string
}

export interface AbortMultipartUploadParams {
  key: string
  uploadId: string
}

export interface UploadMultipartPartParams {
  key: string
  uploadId: string
  partNumber: number
  body: ArrayBuffer | Uint8Array | Buffer
}

export interface UploadMultipartPartResult {
  etag: string
}

export interface GetPutObjectUrlParams {
  fileName: string
  folder: string
  productId?: string
  contentType?: string
  expiresIn?: number
}
