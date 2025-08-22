import { supabase } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

export type UploadResult = {
  success: boolean
  url?: string
  error?: string
}

export async function uploadFile(
  file: File,
  bucket: string = 'images',
  folder: string = 'products',
  supabaseClient?: SupabaseClient<Database>
): Promise<UploadResult> {
  try {
    // Use passed client or fall back to default
    const client = supabaseClient || supabase
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload file to Supabase Storage
    const { data, error } = await client.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Get public URL
    const { data: { publicUrl } } = client.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: publicUrl
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

export async function deleteFile(
  url: string,
  bucket: string = 'images',
  supabaseClient?: SupabaseClient<Database>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use passed client or fall back to default
    const client = supabaseClient || supabase
    
    // Extract file path from URL
    const urlParts = url.split('/')
    
    // Supabase public URL formatında filePath'i çıkar
    // Format: https://your-project.supabase.co/storage/v1/object/public/bucket/folder/file.ext
    const publicIndex = urlParts.findIndex(part => part === 'public')
    if (publicIndex === -1 || publicIndex + 1 >= urlParts.length) {
      return {
        success: false,
        error: 'Invalid file URL format'
      }
    }

    // public'dan sonraki kısmı al (bucket/folder/file.ext)
    const pathAfterPublic = urlParts.slice(publicIndex + 1).join('/')
    
    // Bucket'ı çıkar ve dosya yolunu al
    const pathParts = pathAfterPublic.split('/')
    if (pathParts[0] !== bucket) {
      return {
        success: false,
        error: 'Bucket mismatch in URL'
      }
    }
    
    const filePath = pathParts.slice(1).join('/')

    const { error } = await client.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

export function validateFile(
  file: File,
  maxSize: number = 5 * 1024 * 1024, // 5MB default
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }

  // Check file type with wildcard support
  const isValidType = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      // Handle wildcard types (e.g., 'image/*', 'video/*')
      const baseType = type.replace('/*', '')
      return file.type.startsWith(baseType)
    } else {
      // Handle specific types
      return file.type === type
    }
  })

  if (!isValidType) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

// Document upload helper
export async function uploadDocument(
  file: File,
  productId: string
): Promise<UploadResult> {
  try {
    // Generate unique filename for documents
    const fileExt = file.name.split('.').pop()
    const fileName = `products/${productId}/documents/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload file to Supabase Storage documents bucket
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Document upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path)

    return {
      success: true,
      url: publicUrl
    }
  } catch (error) {
    console.error('Document upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Document upload failed'
    }
  }
}

// Video upload helper
export async function uploadVideo(
  file: File,
  productId: string
): Promise<UploadResult> {
  try {
    // Generate unique filename for videos
    const fileExt = file.name.split('.').pop()
    const fileName = `products/${productId}/videos/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload file to Supabase Storage videos bucket
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Video upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(data.path)

    return {
      success: true,
      url: publicUrl
    }
  } catch (error) {
    console.error('Video upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Video upload failed'
    }
  }
}

// Thumbnail generation helper (placeholder for future implementation)
export async function generateThumbnail(
  file: File,
  type: 'image' | 'video'
): Promise<{ success: boolean; thumbnailUrl?: string; error?: string }> {
  try {
    // TODO: Implement actual thumbnail generation
    // For now, return a placeholder
    if (type === 'image') {
      // For images, we can use the image itself as thumbnail
      return { success: true, thumbnailUrl: URL.createObjectURL(file) }
    } else {
      // For videos, we need to extract a frame
      // This requires additional libraries like ffmpeg.js
      return { 
        success: false, 
        error: 'Video thumbnail generation not implemented yet' 
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Thumbnail generation failed'
    }
  }
} 