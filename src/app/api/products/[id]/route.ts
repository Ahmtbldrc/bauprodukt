import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateProductSchema } from '@/schemas/database'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        brand:brands(*),
        category:categories(*),
        product_images(
          id,
          image_url,
          order_index,
          is_cover
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      
      console.error('Product fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    // Sort product images by order_index
    const productWithSortedImages = {
      ...data,
      product_images: data.product_images?.sort((a: any, b: any) => {
        // Cover image comes first, then sort by order_index
        if (a.is_cover && !b.is_cover) return -1
        if (!a.is_cover && b.is_cover) return 1
        return a.order_index - b.order_index
      }) || []
    }

    return NextResponse.json(productWithSortedImages)
  } catch (error) {
    console.error('Product API error:', error)
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
    
    const validation = updateProductSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Generate slug from name if name is being updated and slug is not provided
    if (validation.data.name && !validation.data.slug) {
      validation.data.slug = validation.data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }

    const { data, error } = await supabase
      .from('products')
      .update(validation.data)
      .eq('id', id)
      .select(`
        *,
        brand:brands(*),
        category:categories(*)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Product with this slug already exists' },
          { status: 409 }
        )
      }

      console.error('Product update error:', error)
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Product update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if product exists before deletion
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      
      console.error('Product fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Product deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Product deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 