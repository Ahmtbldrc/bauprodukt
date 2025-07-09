import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadFile, validateFile } from '@/lib/upload'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params
    const formData = await request.formData()
    
    // Files'ları topla
    const files: File[] = []
    const orderIndexes: number[] = []
    const isCoverFlags: boolean[] = []
    
    let fileIndex = 0
    while (formData.has(`file_${fileIndex}`)) {
      const file = formData.get(`file_${fileIndex}`) as File
      const orderIndex = parseInt(formData.get(`order_${fileIndex}`) as string) || fileIndex
      const isCover = formData.get(`is_cover_${fileIndex}`) === 'true'
      
      files.push(file)
      orderIndexes.push(orderIndex)
      isCoverFlags.push(isCover)
      fileIndex++
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Cover kontrolü - sadece 1 tane olmalı
    const coverCount = isCoverFlags.filter(Boolean).length
    if (coverCount > 1) {
      return NextResponse.json(
        { error: 'Only one image can be set as cover' },
        { status: 400 }
      )
    }

    // Eğer cover belirtilmemişse, ilk resmi cover yap
    if (coverCount === 0 && files.length > 0) {
      isCoverFlags[0] = true
    }

    // 1. Tüm dosyaları validate et
    for (const file of files) {
      const validation = validateFile(file)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `File validation failed: ${validation.error}` },
          { status: 400 }
        )
      }
    }

    // 2. Varsa mevcut cover'ı kaldır (eğer yeni cover geliyorsa)
    if (isCoverFlags.some(Boolean)) {
      await supabase
        .from('product_images')
        .update({ is_cover: false })
        .eq('product_id', productId)
        .eq('is_cover', true)
    }

    // 3. BULK UPLOAD: Tüm dosyaları paralel yükle
    const uploadPromises = files.map(async (file, index) => {
      const uploadResult = await uploadFile(file, 'images', 'products')
      
      if (!uploadResult.success) {
        throw new Error(`Upload failed for file ${index}: ${uploadResult.error}`)
      }

      return {
        product_id: productId,
        image_url: uploadResult.url!,
        order_index: orderIndexes[index],
        is_cover: isCoverFlags[index]
      }
    })

    const uploadResults = await Promise.all(uploadPromises)

    // 4. BULK INSERT: Tüm kayıtları tek seferde ekle
    const { data, error } = await supabase
      .from('product_images')
      .insert(uploadResults)
      .select('*')

    if (error) {
      console.error('Bulk insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save images to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Images uploaded successfully',
      data: data,
      count: data.length
    }, { status: 201 })

  } catch (error) {
    console.error('Bulk upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 