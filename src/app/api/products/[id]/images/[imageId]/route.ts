import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { deleteFile } from '@/lib/upload'

interface RouteParams {
  params: Promise<{ 
    id: string
    imageId: string 
  }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId, imageId } = await params

    // Önce resmi getir (dosyayı silmek ve cover kontrolü için)
    const { data: targetImage, error: fetchError } = await (supabase as any)
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .eq('product_id', productId)
      .single()

    if (fetchError || !targetImage) {
      return NextResponse.json(
        { error: 'Image not found or does not belong to this product' },
        { status: 404 }
      )
    }

    // Eğer cover resmi siliniyorsa, başka bir resmi cover yap
    let needNewCover = false
    if (targetImage.is_cover) {
      // Bu ürünün başka resimleri var mı kontrol et
      const { data: otherImages, error: otherImagesError } = await (supabase as any)
        .from('product_images')
        .select('id, order_index')
        .eq('product_id', productId)
        .neq('id', imageId)
        .order('order_index', { ascending: true })
        .limit(1)

      if (otherImagesError) {
        console.error('Failed to check other images:', otherImagesError)
        return NextResponse.json(
          { error: 'Failed to check other images' },
          { status: 500 }
        )
      }

      // Başka resim varsa onu cover yap
      if (otherImages && otherImages.length > 0) {
        needNewCover = true
        const { error: newCoverError } = await (supabase as any)
          .from('product_images')
          .update({ is_cover: true })
          .eq('id', otherImages[0].id)

        if (newCoverError) {
          console.error('Failed to set new cover:', newCoverError)
          return NextResponse.json(
            { error: 'Failed to set new cover image' },
            { status: 500 }
          )
        }
      }
    }

    // Database'den sil
    const { error: deleteError } = await (supabase as any)
      .from('product_images')
      .delete()
      .eq('id', imageId)
      .eq('product_id', productId)

    if (deleteError) {
      console.error('Failed to delete image from database:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      )
    }

    // Dosyayı storage'dan sil (best effort)
    try {
      await deleteFile(targetImage.image_url, 'images')
    } catch (error) {
      console.error('Failed to delete file from storage:', error)
      // Bu hata olmasa da devam et, database'den silindi
    }

    // Güncellenmiş resim listesini getir
    const { data: remainingImages, error: remainingError } = await (supabase as any)
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('order_index', { ascending: true })

    if (remainingError) {
      console.error('Failed to fetch remaining images:', remainingError)
      return NextResponse.json(
        { 
          message: 'Image deleted successfully',
          warning: 'Failed to fetch remaining images'
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      message: 'Image deleted successfully',
      data: remainingImages,
      deletedImageId: imageId,
      newCoverAssigned: needNewCover
    })
  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 