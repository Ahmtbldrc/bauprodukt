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

    // Upload to Supabase Storage: images/brands/{id}/<unique>
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `brands/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) {
      console.error('Brand logo upload error:', error)
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
    }

    const { data: publicData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    const logoUrl = publicData.publicUrl

    const { error: updateError } = await (supabase as any)
      .from('brands')
      .update({ logo: logoUrl })
      .eq('id', id)

    if (updateError) {
      console.error('Brand logo DB update error:', updateError)
      return NextResponse.json({ error: 'Failed to save logo URL' }, { status: 500 })
    }

    return NextResponse.json({ data: { logo: logoUrl } })
  } catch (error) {
    console.error('Brand logo API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Fetch current logo URL
    const { data: brand, error: fetchError } = await supabase
      .from('brands')
      .select('logo')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const logoUrl = (brand as any)?.logo as string | null

    if (logoUrl) {
      // Extract path after bucket name from public URL
      const parts = logoUrl.split('/storage/v1/object/public/')
      if (parts.length === 2) {
        const pathWithBucket = parts[1] // e.g., images/brands/...
        const [bucket, ...rest] = pathWithBucket.split('/')
        const objectPath = rest.join('/')
        if (bucket === 'images' && objectPath) {
          await supabase.storage.from(bucket).remove([objectPath])
        }
      }
    }

    const { error: updateError } = await (supabase as any)
      .from('brands')
      .update({ logo: null })
      .eq('id', id)

    if (updateError) {
      console.error('Brand logo clear error:', updateError)
      return NextResponse.json({ error: 'Failed to clear logo' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Logo removed' })
  } catch (error) {
    console.error('Brand logo delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
