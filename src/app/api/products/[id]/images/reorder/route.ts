import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: { id: string }
}

interface ReorderItem {
  id: string
  order_index: number
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params
    const body = await request.json()
    const { imageOrders }: { imageOrders: ReorderItem[] } = body

    if (!imageOrders || !Array.isArray(imageOrders)) {
      return NextResponse.json(
        { error: 'Invalid imageOrders data' },
        { status: 400 }
      )
    }

    if (imageOrders.length === 0) {
      return NextResponse.json(
        { error: 'No images to reorder' },
        { status: 400 }
      )
    }

    // Validate that all images belong to this product
    const imageIds = imageOrders.map(item => item.id)
    const { data: existingImages, error: fetchError } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .in('id', imageIds)

    if (fetchError) {
      console.error('Failed to validate images:', fetchError)
      return NextResponse.json(
        { error: 'Failed to validate images' },
        { status: 500 }
      )
    }

    if (existingImages.length !== imageOrders.length) {
      return NextResponse.json(
        { error: 'Some images do not belong to this product' },
        { status: 400 }
      )
    }

    // Bulk update orders
    const updatePromises = imageOrders.map(({ id, order_index }) =>
      supabase
        .from('product_images')
        .update({ order_index })
        .eq('id', id)
        .eq('product_id', productId)
    )

    const results = await Promise.allSettled(updatePromises)
    
    // Check if any update failed
    const failures = results.filter(result => result.status === 'rejected')
    if (failures.length > 0) {
      console.error('Some updates failed:', failures)
      return NextResponse.json(
        { error: 'Failed to update some image orders' },
        { status: 500 }
      )
    }

    // Fetch updated images to return
    const { data: updatedImages, error: updateFetchError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('order_index', { ascending: true })

    if (updateFetchError) {
      console.error('Failed to fetch updated images:', updateFetchError)
      return NextResponse.json(
        { error: 'Order updated but failed to fetch result' },
        { status: 200 } // Order was updated successfully
      )
    }

    return NextResponse.json({
      message: 'Image order updated successfully',
      data: updatedImages
    })
  } catch (error) {
    console.error('Reorder images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 