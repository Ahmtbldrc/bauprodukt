import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string; variantId: string }>
}

// PUT endpoint for updating a single variant
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, variantId } = await params
    const supabase = createClient()
    const body = await request.json()

    const {
      sku,
      title,
      price,
      compare_at_price,
      stock_quantity,
      track_inventory = true,
      continue_selling_when_out_of_stock = false,
      is_active = true,
      position = 0
    } = body

    // Validate required fields
    if (!sku || !price) {
      return NextResponse.json(
        { error: 'SKU and price are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const { error: productError } = await (supabase as any)
      .from('products')
      .select('id')
      .eq('id', id)
      .single()

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to validate product' },
        { status: 500 }
      )
    }

    // Check if variant exists
    const { error: variantCheckError } = await (supabase as any)
      .from('product_variants')
      .select('id')
      .eq('id', variantId)
      .eq('product_id', id)
      .single()

    if (variantCheckError) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Update variant
    const { data: updatedVariant, error: updateError } = await (supabase as any)
      .from('product_variants')
      .update({
        sku,
        title,
        price,
        compare_at_price,
        stock_quantity,
        track_inventory,
        continue_selling_when_out_of_stock,
        is_active,
        position
      })
      .eq('id', variantId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Variant update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update variant' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedVariant)

  } catch (error) {
    console.error('Variant update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint for deleting a single variant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, variantId } = await params
    const supabase = createClient()

    // Check if product exists
    const { error: productError } = await (supabase as any)
      .from('products')
      .select('id')
      .eq('id', id)
      .single()

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to validate product' },
        { status: 500 }
      )
    }

    // Check if variant exists
    const { error: variantCheckError } = await (supabase as any)
      .from('product_variants')
      .select('id')
      .eq('id', variantId)
      .eq('product_id', id)
      .single()

    if (variantCheckError) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Delete variant
    const { error: deleteError } = await (supabase as any)
      .from('product_variants')
      .delete()
      .eq('id', variantId)

    if (deleteError) {
      console.error('Variant deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete variant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Variant deleted successfully',
      deletedVariantId: variantId
    })

  } catch (error) {
    console.error('Variant deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
