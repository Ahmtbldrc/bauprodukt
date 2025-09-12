import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadFile, validateFile } from '@/lib/upload'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params
    const supabase = createClient()
    const formData = await request.formData()
    
    // Files'ları topla
    const files: File[] = []
    const titles: string[] = []
    
    let fileIndex = 0
    while (formData.has(`file_${fileIndex}`)) {
      const file = formData.get(`file_${fileIndex}`) as File
      const title = formData.get(`title_${fileIndex}`) as string || file.name.replace(/\.[^/.]+$/, '')
      
      files.push(file)
      titles.push(title)
      fileIndex++
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // 1. Tüm dosyaları validate et (video dosyaları)
    for (const file of files) {
      const validation = validateFile(file, 500 * 1024 * 1024, ['video/mp4', 'video/webm', 'video/avi', 'video/mov'])
      if (!validation.valid) {
        return NextResponse.json(
          { error: `File validation failed: ${validation.error}` },
          { status: 400 }
        )
      }
    }

    // 2. BULK UPLOAD: Tüm dosyaları paralel yükle
    const uploadPromises = files.map(async (file, index) => {
      const uploadResult = await uploadFile(file, 'videos', 'products', supabase)
      
      if (!uploadResult.success) {
        throw new Error(`Upload failed for file ${index}: ${uploadResult.error}`)
      }

      // TODO: Video thumbnail generation ve duration extraction
      // Şimdilik basit değerler kullanıyoruz
      return {
        product_id: productId,
        title: titles[index],
        video_url: uploadResult.url!,
        thumbnail_url: null, // TODO: Generate thumbnail
        duration: null, // TODO: Extract duration
        file_size: file.size
      }
    })

    const uploadResults = await Promise.all(uploadPromises)

    // 3. BULK INSERT: Tüm kayıtları tek seferde ekle
    // Determine current max sort_order to append sequentially for bulk
    const { data: maxRow } = await (supabase as any)
      .from('product_videos')
      .select('sort_order')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextOrder = (maxRow?.sort_order ?? 0) + 1
    const payloadWithOrder = uploadResults.map((r) => ({ ...r, sort_order: nextOrder++ }))

    const { data, error } = await (supabase as any)
      .from('product_videos')
      .insert(payloadWithOrder)
      .select('*')

    if (error) {
      console.error('Bulk insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save videos to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Videos uploaded successfully',
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
