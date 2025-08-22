import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteFile, uploadFile, validateFile } from '@/lib/upload'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Ürün resimlerini listele
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params
    const supabase = createClient()

    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Product images fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product images' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      count: data.length
    })
  } catch (error) {
    console.error('Product images API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Tekli ürün görseli ekle
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params
    const supabase = createClient()
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const orderIndex = parseInt(formData.get('order_index') as string) || 0
    const isCover = formData.get('is_cover') === 'true'

    // Dosya kontrolü
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
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

    // Eğer cover olarak işaretlenmişse, mevcut cover'ları kaldır
    if (isCover) {
      await supabase
        .from('product_images')
        .update({ is_cover: false })
        .eq('product_id', productId)
        .eq('is_cover', true)
    }

    // Dosyayı yükle
    const uploadResult = await uploadFile(file, 'images', 'products')
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadResult.error}` },
        { status: 500 }
      )
    }

    // Veritabanına kaydet
    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url: uploadResult.url!,
        order_index: orderIndex,
        is_cover: isCover
      })
      .select('*')
      .single()

    if (error) {
      console.error('Image insert error:', error)
      
      // Upload edilen dosyayı temizle
      await deleteFile(uploadResult.url!, 'images').catch(err => 
        console.error('Failed to cleanup uploaded file:', err)
      )
      
      return NextResponse.json(
        { error: 'Failed to save image to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Image uploaded successfully',
      data: data
    }, { status: 201 })

  } catch (error) {
    console.error('Single image upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Tüm ürün resimlerini sil
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params
    const supabase = createClient()

    // Önce resimleri getir (dosyaları silmek için)
    const { data: images, error: fetchError } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId)

    if (fetchError) {
      console.error('Failed to fetch images for deletion:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      )
    }

    // Database'den sil
    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId)

    if (deleteError) {
      console.error('Failed to delete images from database:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete images' },
        { status: 500 }
      )
    }

    // Dosyaları storage'dan sil (best effort)
    if (images && images.length > 0) {
      const deletePromises = images.map(img => 
        deleteFile(img.image_url, 'images').catch(err => 
          console.error('Failed to delete file:', img.image_url, err)
        )
      )
      await Promise.allSettled(deletePromises)
    }

    return NextResponse.json({
      message: 'All product images deleted successfully',
      count: images?.length || 0
    })
  } catch (error) {
    console.error('Delete all images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

// PUT endpoint for updating product images (admin functionality)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params
    const supabase = createClient()
    const body = await request.json()

    const { images } = body

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Images array is required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const { error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single()

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to validate product' },
        { status: 500 }
      )
    }

    // Delete existing images for this product
    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId)

    if (deleteError) {
      console.error('Failed to delete existing images:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete existing images' },
        { status: 500 }
      )
    }

    // Insert new images
    if (images.length > 0) {
      const imagesToInsert = images.map((image: {
        image_url: string
        is_cover?: boolean
      }, index: number) => ({
        product_id: productId,
        image_url: image.image_url,
        order_index: index,
        is_cover: image.is_cover || false
      }))

      const { data: insertedImages, error: insertError } = await supabase
        .from('product_images')
        .insert(imagesToInsert)
        .select('*')

      if (insertError) {
        console.error('Failed to insert images:', insertError)
        return NextResponse.json(
          { error: 'Failed to insert images' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Images updated successfully',
        data: insertedImages,
        count: insertedImages.length
      })
    }

    return NextResponse.json({
      message: 'All images removed successfully',
      data: [],
      count: 0
    })

  } catch (error) {
    console.error('Image update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 