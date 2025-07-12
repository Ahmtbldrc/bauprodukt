import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{
    id: string
    imageId: string
  }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId, imageId } = await params

    // Önce bu resmin bu ürüne ait olduğunu doğrula
    const { data: targetImage, error: validateError } = await supabase
      .from('product_images')
      .select('id')
      .eq('id', imageId)
      .eq('product_id', productId)
      .single()

    if (validateError || !targetImage) {
      return NextResponse.json(
        { error: 'Image not found or does not belong to this product' },
        { status: 404 }
      )
    }

    // Transaction benzeri işlem: 
    // 1. Önce mevcut cover'ı kaldır
    const { error: removeCoverError } = await supabase
      .from('product_images')
      .update({ is_cover: false })
      .eq('product_id', productId)
      .eq('is_cover', true)

    if (removeCoverError) {
      console.error('Failed to remove existing cover:', removeCoverError)
      return NextResponse.json(
        { error: 'Failed to update cover status' },
        { status: 500 }
      )
    }

    // 2. Yeni cover'ı ayarla
    const { error: setCoverError } = await supabase
      .from('product_images')
      .update({ is_cover: true })
      .eq('id', imageId)
      .eq('product_id', productId)

    if (setCoverError) {
      console.error('Failed to set new cover:', setCoverError)
      return NextResponse.json(
        { error: 'Failed to set new cover' },
        { status: 500 }
      )
    }

    // Güncellenmiş resimleri getir
    const { data: updatedImages, error: fetchError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('order_index', { ascending: true })

    if (fetchError) {
      console.error('Failed to fetch updated images:', fetchError)
      return NextResponse.json(
        { error: 'Cover updated but failed to fetch result' },
        { status: 200 } // Cover was updated successfully
      )
    }

    return NextResponse.json({
      message: 'Cover image updated successfully',
      data: updatedImages,
      newCoverId: imageId
    })
  } catch (error) {
    console.error('Set cover error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 