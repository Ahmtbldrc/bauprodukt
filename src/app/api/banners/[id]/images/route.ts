import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { deleteFile, uploadFile, validateFile } from '@/lib/upload'

interface RouteParams {
  params: { id: string }
}

// Banner resmini yükle ve güncelle
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bannerId } = await params
    const formData = await request.formData()
    
    const file = formData.get('file') as File

    // Dosya kontrolü
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Banner'ın var olup olmadığını kontrol et
    const { data: existingBanner, error: fetchError } = await supabase
      .from('banners')
      .select('id, image_url')
      .eq('id', bannerId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        )
      }
      
      console.error('Banner fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch banner' },
        { status: 500 }
      )
    }

    // Dosya validasyonu
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: `File validation failed: ${validation.error}` },
        { status: 400 }
      )
    }

    // Dosyayı yükle
    const uploadResult = await uploadFile(file, 'images', 'banners')
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadResult.error}` },
        { status: 500 }
      )
    }

    // Banner'ın image_url'ini güncelle
    const { data, error: updateError } = await supabase
      .from('banners')
      .update({ image_url: uploadResult.url! })
      .eq('id', bannerId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Banner update error:', updateError)
      
      // Upload edilen dosyayı temizle
      await deleteFile(uploadResult.url!, 'images').catch(err => 
        console.error('Failed to cleanup uploaded file:', err)
      )
      
      return NextResponse.json(
        { error: 'Failed to update banner image' },
        { status: 500 }
      )
    }

    // Eski resmi sil (eğer varsa)
    if (existingBanner.image_url) {
      await deleteFile(existingBanner.image_url, 'images').catch(err => 
        console.error('Failed to delete old banner image:', err)
      )
    }

    return NextResponse.json({
      message: 'Banner image uploaded successfully',
      data: {
        id: data.id,
        image_url: data.image_url
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Banner image upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Banner resmini sil
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bannerId } = await params

    // Banner'ı getir
    const { data: existingBanner, error: fetchError } = await supabase
      .from('banners')
      .select('id, image_url')
      .eq('id', bannerId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        )
      }
      
      console.error('Banner fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch banner' },
        { status: 500 }
      )
    }

    if (!existingBanner.image_url) {
      return NextResponse.json(
        { error: 'Banner has no image to delete' },
        { status: 400 }
      )
    }

    // Banner'ın image_url'ini null yap
    const { data, error: updateError } = await supabase
      .from('banners')
      .update({ image_url: null })
      .eq('id', bannerId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Banner update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove banner image' },
        { status: 500 }
      )
    }

    // Dosyayı storage'dan sil
    await deleteFile(existingBanner.image_url, 'images').catch(err => 
      console.error('Failed to delete banner image file:', err)
    )

    return NextResponse.json({
      message: 'Banner image deleted successfully',
      data: {
        id: data.id,
        image_url: data.image_url
      }
    })
  } catch (error) {
    console.error('Banner image deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 