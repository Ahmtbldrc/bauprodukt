import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { deleteFile } from '@/lib/upload'

interface RouteParams {
  params: { id: string }
}

// Ürün resimlerini listele
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params

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

// Tüm ürün resimlerini sil
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params

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