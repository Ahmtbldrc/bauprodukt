import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    
    // Get all active videos for this product
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

    return NextResponse.json({ 
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Videos API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
