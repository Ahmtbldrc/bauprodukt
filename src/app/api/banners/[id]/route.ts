import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateBannerSchema } from '@/schemas/database'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        )
      }
      
      console.error('Banner fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch banner' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Banner API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const validation = updateBannerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('banners')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        )
      }

      console.error('Banner update error:', error)
      return NextResponse.json(
        { error: 'Failed to update banner' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Banner update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if banner exists before deletion
    const { error: fetchError } = await supabase
      .from('banners')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        )
      }
      
      console.error('Banner fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch banner' },
        { status: 500 }
      )
    }

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Banner deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete banner' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Banner deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 