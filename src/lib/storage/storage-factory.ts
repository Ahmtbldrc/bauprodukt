import { USE_S3_STORAGE } from '@/lib/s3-client'
import { S3StorageProvider } from './s3-storage'
import { SupabaseStorageProvider } from './supabase-storage'
import type { StorageProvider } from './types'

class StorageFactory {
  private static instance: StorageProvider | null = null

  static getStorageProvider(): StorageProvider {
    if (!this.instance) {
      if (USE_S3_STORAGE) {
        this.instance = new S3StorageProvider()
        console.log('Using S3/MinIO storage provider')
      } else {
        this.instance = new SupabaseStorageProvider()
        console.log('Using Supabase storage provider')
      }
    }
    return this.instance
  }

  static resetInstance(): void {
    this.instance = null
  }
}

export default StorageFactory
export const storageProvider = StorageFactory.getStorageProvider()