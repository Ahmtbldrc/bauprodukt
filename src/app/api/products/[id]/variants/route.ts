import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if product exists first
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('id', id)
      .single()

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      
      console.error('Product fetch error:', productError)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    // Get all variants for this product
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants_detailed')
      .select('*')
      .eq('product_id', id)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (variantsError) {
      console.error('Variants fetch error:', variantsError)
      return NextResponse.json(
        { error: 'Failed to fetch variants' },
        { status: 500 }
      )
    }

    // Get product attributes for variant selection UI
    const { data: attributesSummary, error: attributesError } = await supabase
      .from('product_attributes_summary')
      .select('*')
      .eq('product_id', id)
      .single()

    if (attributesError && attributesError.code !== 'PGRST116') {
      console.error('Attributes fetch error:', attributesError)
    }

    // Find default variant (first by position)
    const defaultVariant = variants && variants.length > 0 ? variants[0] : null

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug
      },
      variants: variants || [],
      attributes: attributesSummary?.attributes || [],
      default_variant_id: defaultVariant?.id || null,
      variant_count: variants?.length || 0
    })
  } catch (error) {
    console.error('Product variants API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint for creating new variants (admin functionality)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      sku,
      title,
      price,
      compare_at_price,
      stock_quantity,
      track_inventory = true,
      continue_selling_when_out_of_stock = false,
      position = 0,
      attribute_values = []
    } = body

    // Validate required fields
    if (!sku || !price) {
      return NextResponse.json(
        { error: 'SKU and price are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
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

    // Create variant
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert([{
        product_id: id,
        sku,
        title,
        price,
        compare_at_price,
        stock_quantity,
        track_inventory,
        continue_selling_when_out_of_stock,
        position
      }])
      .select('*')
      .single()

    if (variantError) {
      if (variantError.code === '23505') {
        return NextResponse.json(
          { error: 'Variant with this SKU already exists' },
          { status: 409 }
        )
      }
      console.error('Variant creation error:', variantError)
      return NextResponse.json(
        { error: 'Failed to create variant' },
        { status: 500 }
      )
    }

    // Add attribute values if provided
    if (attribute_values.length > 0) {
      const attributeValueInserts = attribute_values.map((attributeValueId: string) => ({
        variant_id: variant.id,
        attribute_value_id: attributeValueId
      }))

      const { error: attributesError } = await supabase
        .from('variant_attribute_values')
        .insert(attributeValueInserts)

      if (attributesError) {
        console.error('Variant attributes creation error:', attributesError)
        // Don't fail the whole operation, but log the error
      }
    }

    // Return the created variant with details
    const { data: createdVariant } = await supabase
      .from('product_variants_detailed')
      .select('*')
      .eq('id', variant.id)
      .single()

    return NextResponse.json(createdVariant || variant, { status: 201 })
  } catch (error) {
    console.error('Variant creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}