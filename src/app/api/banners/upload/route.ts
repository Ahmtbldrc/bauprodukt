import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateBanner } from '@/schemas/database'
import { uploadFile, validateFile, deleteFile } from '@/lib/upload'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract all form fields
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const link = formData.get('link') as string
    const orderIndex = formData.get('order_index') as string
    const isActive = formData.get('is_active') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Upload file
    const result = await uploadFile(file, 'images', 'banners')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      )
    }

    // Build banner data
    const bannerData = {
      image_url: result.url,
      title: title || null,
      link: link || null,
      order_index: orderIndex ? parseInt(orderIndex) : undefined,
      is_active: isActive ? isActive === 'true' : true
    }

    // Validate banner data
    const bannerValidation = validateBanner(bannerData)
    if (!bannerValidation.success) {
      // Clean up uploaded file
      await deleteFile(result.url!, 'images').catch(err => 
        console.error('Failed to cleanup uploaded file:', err)
      )
      
      return NextResponse.json(
        { error: 'Banner validation failed', details: bannerValidation.error.errors },
        { status: 400 }
      )
    }

    // Set order_index if not provided
    if (bannerValidation.data.order_index === undefined) {
      const { data: lastBanner } = await supabase
        .from('banners')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)

      bannerValidation.data.order_index = lastBanner && lastBanner.length > 0 
        ? lastBanner[0].order_index + 1 
        : 0
    }

    // Create banner
    const { data, error } = await supabase
      .from('banners')
      .insert([bannerValidation.data])
      .select()
      .single()

    if (error) {
      console.error('Banner creation error:', error)
      
      // Clean up uploaded file
      await deleteFile(result.url!, 'images').catch(err => 
        console.error('Failed to cleanup uploaded file:', err)
      )
      
      return NextResponse.json(
        { error: 'Failed to create banner' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Banner upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 