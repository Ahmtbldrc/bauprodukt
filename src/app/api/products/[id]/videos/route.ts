import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get all videos for a product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('product_videos')
      .select('*')
      .eq('product_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Videos fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Videos API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new video for a product
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()
    
    const { title, video_url, thumbnail_url, duration, file_size } = body

    if (!title || !video_url) {
      return NextResponse.json(
        { error: 'Title and video_url are required' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('product_videos')
      .insert({
        product_id: id,
        title,
        video_url,
        thumbnail_url: thumbnail_url || null,
        duration: duration || null,
        file_size: file_size || null
      })
      .select('*')
      .single()

    if (error) {
      console.error('Video creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create video' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Video creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update multiple videos for a product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()
    
    const { videos } = body

    if (!Array.isArray(videos)) {
      return NextResponse.json(
        { error: 'Videos array is required' },
        { status: 400 }
      )
    }

    // First, deactivate all existing videos for this product
    const { error: deactivateError } = await (supabase as any)
      .from('product_videos')
      .update({ is_active: false })
      .eq('product_id', id)

    if (deactivateError) {
      console.error('Video deactivation error:', deactivateError)
      return NextResponse.json(
        { error: 'Failed to update videos' },
        { status: 500 }
      )
    }

    // Then, insert/update the new videos
    const videosToInsert = videos.map((video: { title: string; video_url: string; thumbnail_url?: string; duration?: number; file_size?: number }) => ({
      product_id: id,
      title: video.title,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || null,
      duration: video.duration || null,
      file_size: video.file_size || null,
      is_active: true
    }))

    const { data, error } = await (supabase as any)
      .from('product_videos')
      .insert(videosToInsert)
      .select('*')

    if (error) {
      console.error('Videos update error:', error)
      return NextResponse.json(
        { error: 'Failed to update videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Videos update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
