import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadDocument, validateFile } from '@/lib/upload'
interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth kontrolü ekle
    const authHeader = request.headers.get('authorization')
    console.log('Auth header:', authHeader)
    
    const { id: productId } = await params
    console.log('Documents bulk upload started for product:', productId)
    
    const formData = await request.formData()
    console.log('FormData received, keys:', Array.from(formData.keys()))
    
    // Files'ları topla
    const files: File[] = []
    const titles: string[] = []
    
    let fileIndex = 0
    while (formData.has(`file_${fileIndex}`)) {
      const file = formData.get(`file_${fileIndex}`) as File
      const title = formData.get(`title_${fileIndex}`) as string || file.name.replace(/\.[^/.]+$/, '')
      
      console.log(`File ${fileIndex}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        title: title
      })
      
      files.push(file)
      titles.push(title)
      fileIndex++
    }

    console.log(`Total files found: ${files.length}`)

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // 1. Tüm dosyaları validate et (PDF ve image dosyaları) - no size limit for MinIO
    for (const file of files) {
      console.log('Validating file:', file.name, file.type, file.size)
      const validation = validateFile(file, Number.MAX_SAFE_INTEGER, ['application/pdf', 'image/*'])
      console.log('Validation result:', validation)
      
      if (!validation.valid) {
        return NextResponse.json(
          { error: `File validation failed: ${validation.error}` },
          { status: 400 }
        )
      }
    }

    // 2. Ürünün varlığını kontrol et (FK hatalarını erkenden önlemek için)
    const supabase = createClient()
    const { error: productCheckError } = await (supabase as any)
      .from('products')
      .select('id')
      .eq('id', productId)
      .single()

    if (productCheckError) {
      console.error('Product not found for documents upload:', productCheckError)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // 3. BULK UPLOAD: Tüm dosyaları paralel yükle
    console.log('Starting bulk upload...')
    const uploadPromises = files.map(async (file, index) => {
      console.log(`Uploading file ${index}: ${file.name}`)
      
      // Use document-specific upload for S3/Supabase
      const uploadResult = await uploadDocument(file, productId)
      console.log(`Upload result for ${file.name}:`, uploadResult)
      
      if (!uploadResult.success) {
        throw new Error(`Upload failed for file ${index}: ${uploadResult.error}`)
      }

      return {
        product_id: productId,
        title: titles[index],
        file_url: uploadResult.url!,
        file_key: uploadResult.key, // Store S3 key if available
        file_type: file.type,
        file_size: file.size
      }
    })

    const uploadResults = await Promise.all(uploadPromises)
    console.log('All uploads completed:', uploadResults)

    // 4. BULK INSERT: Tüm kayıtları tek seferde ekle
    console.log('Inserting documents to database:', uploadResults)
    const { data, error } = await (supabase as any)
      .from('product_documents')
      .insert(uploadResults)
      .select('*')

    if (error) {
      console.error('Bulk insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save documents to database' },
        { status: 500 }
      )
    }

    console.log('Database insert successful:', data)

    return NextResponse.json({
      message: 'Documents uploaded successfully',
      data: data,
      count: data.length
    }, { status: 201 })

  } catch (error) {
    console.error('Bulk upload error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
