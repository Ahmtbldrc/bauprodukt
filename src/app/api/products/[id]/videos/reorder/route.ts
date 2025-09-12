import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT: Reorder videos for a product by setting sort_order using provided ID order
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params
    const supabase = createClient()
    const body = await request.json()

    const order = body?.order as string[] | undefined
    if (!Array.isArray(order) || order.length === 0) {
      return NextResponse.json(
        { error: 'order (string[]) is required' },
        { status: 400 }
      )
    }

    // Update each video's sort_order to its index+1
    const updatePromises = order.map((videoId, index) =>
      (supabase as any)
        .from('product_videos')
        .update({ sort_order: index + 1 })
        .eq('id', videoId)
        .eq('product_id', productId)
        .eq('is_active', true)
    )

    const results = await Promise.all(updatePromises)
    const anyError = results.find((r) => r.error)
    if (anyError) {
      console.error('Reorder error:', anyError.error)
      return NextResponse.json(
        { error: 'Failed to reorder videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Order updated' })
  } catch (error) {
    console.error('Reorder API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


