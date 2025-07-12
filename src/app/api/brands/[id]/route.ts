import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateBrandSchema } from '@/schemas/database'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        )
      }
      
      console.error('Brand fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch brand' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Brand API error:', error)
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
    
    const validation = updateBrandSchema.safeParse(body)
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
      .from('brands')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        )
      }

      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Brand with this slug already exists' },
          { status: 409 }
        )
      }

      console.error('Brand update error:', error)
      return NextResponse.json(
        { error: 'Failed to update brand' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Brand update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if there are products using this brand
    const { data: productsUsingBrand, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('brand_id', id)
      .limit(1)

    if (productsError) {
      console.error('Products check error:', productsError)
      return NextResponse.json(
        { error: 'Failed to check brand usage' },
        { status: 500 }
      )
    }

    if (productsUsingBrand && productsUsingBrand.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete brand: it is being used by products' },
        { status: 409 }
      )
    }

    // Check if brand exists before deletion
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Brand deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete brand' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Brand deleted successfully' })
  } catch (error) {
    console.error('Brand deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 