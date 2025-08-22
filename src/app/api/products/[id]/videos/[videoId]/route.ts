import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string; videoId: string }>
}

// DELETE: Delete a video (soft delete by setting is_active to false)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId, videoId } = await params
    const supabase = createClient()
    
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('product_videos')
      .update({ is_active: false })
      .eq('id', videoId)
      .eq('product_id', productId)

    if (error) {
      console.error('Video deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete video' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Video deleted successfully',
      videoId: videoId
    })
  } catch (error) {
    console.error('Video deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
