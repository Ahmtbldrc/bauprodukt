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
}

export interface FileValidation {
  valid: boolean
  error?: string
}