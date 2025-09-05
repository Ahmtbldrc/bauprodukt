import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Only allow SVG
    const isSvg = file.type === 'image/svg+xml' || (file.name && file.name.toLowerCase().endsWith('.svg'))
    if (!isSvg) {
      return NextResponse.json({ error: 'Only SVG files are allowed' }, { status: 400 })
    }

    const ext = 'svg'
    const path = `categories/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: 'image/svg+xml' })

    if (error) {
      console.error('Category icon upload error:', error)
      return NextResponse.json({ error: 'Failed to upload icon' }, { status: 500 })
    }

    const { data: publicData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    const iconUrl = publicData.publicUrl

    const { error: updateError } = await (supabase as any)
      .from('categories')
      .update({ icon_url: iconUrl })
      .eq('id', id)

    if (updateError) {
      console.error('Category icon DB update error:', updateError)
      return NextResponse.json({ error: 'Failed to save icon URL' }, { status: 500 })
    }

    return NextResponse.json({ data: { icon_url: iconUrl } })
  } catch (error) {
    console.error('Category icon API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Fetch current icon URL
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('icon_url')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const iconUrl = (category as any)?.icon_url as string | null

    if (iconUrl) {
      // Extract path after bucket name from public URL
      const parts = iconUrl.split('/storage/v1/object/public/')
      if (parts.length === 2) {
        const pathWithBucket = parts[1] // e.g., images/categories/...
        const [bucket, ...rest] = pathWithBucket.split('/')
        const objectPath = rest.join('/')
        if (bucket === 'images' && objectPath) {
          await supabase.storage.from(bucket).remove([objectPath])
        }
      }
    }

    const { error: updateError } = await (supabase as any)
      .from('categories')
      .update({ icon_url: null })
      .eq('id', id)

    if (updateError) {
      console.error('Category icon clear error:', updateError)
      return NextResponse.json({ error: 'Failed to clear icon' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Icon removed' })
  } catch (error) {
    console.error('Category icon delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


