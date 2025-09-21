import { supabase } from '@/lib/supabase'
import type { StorageProvider, UploadResult, DeleteResult, StorageFile } from './types'

export class SupabaseStorageProvider implements StorageProvider {
  private bucketName: string

  constructor(bucketName: string = 'documents') {
    this.bucketName = bucketName
  }

  async upload(file: File, folder: string, productId?: string): Promise<UploadResult> {
    try {
      // Generate unique key
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      
      let key: string
      if (productId) {
        key = `${folder}/${productId}/${timestamp}-${random}.${fileExt}`
      } else {
        key = `${folder}/${timestamp}-${random}.${fileExt}`
      }

      return await this.uploadWithKey(file, key)
    } catch (error) {
      console.error('Supabase upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async uploadWithKey(file: File, key: string): Promise<UploadResult> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(key, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Supabase upload error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path)

      return {
        success: true,
        url: publicUrl,
        key: data.path
      }
    } catch (error) {
      console.error('Supabase upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async delete(key: string): Promise<DeleteResult> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([key])

      if (error) {
        console.error('Supabase delete error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Supabase delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(key)

      return !error && !!data
    } catch {
      return false
    }
  }

  async list(prefix: string): Promise<StorageFile[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(prefix)

      if (error) {
        console.error('Supabase list error:', error)
        return []
      }

      const files: StorageFile[] = []
      if (data) {
        for (const file of data) {
          const key = `${prefix}/${file.name}`
          const { data: { publicUrl } } = supabase.storage
            .from(this.bucketName)
            .getPublicUrl(key)

          files.push({
            key,
            url: publicUrl,
            size: file.metadata?.size,
            lastModified: file.updated_at ? new Date(file.updated_at) : undefined,
          })
        }
      }

      return files
    } catch (error) {
      console.error('Supabase list error:', error)
      return []
    }
  }

  getProviderName(): string {
    return 'Supabase'
  }
}

// Export a singleton instance
export const supabaseStorage = new SupabaseStorageProvider()