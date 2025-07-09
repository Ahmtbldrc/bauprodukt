import { supabase } from './supabase'

export type UploadResult = {
  success: boolean
  url?: string
  error?: string
}

export async function uploadFile(
  file: File,
  bucket: string = 'images',
  folder: string = 'products'
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
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
    const { data: { publicUrl } } = supabase.storage
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
  bucket: string = 'images'
): Promise<{ success: boolean; error?: string }> {
  try {
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

    const { error } = await supabase.storage
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

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
} 