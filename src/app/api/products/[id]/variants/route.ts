import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()

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
    const { error: productError } = await supabase
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

// PUT endpoint for updating variants (admin functionality)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()

    // Check if this is a single variant update or bulk update
    if (body.variants && Array.isArray(body.variants)) {
      // Bulk update (existing functionality)
      const { variants } = body

      if (!variants || !Array.isArray(variants)) {
        return NextResponse.json(
          { error: 'Variants array is required' },
          { status: 400 }
        )
      }

      // Check if product exists
      const { error: productError } = await supabase
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

      // Delete existing variants for this product
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id)

      if (deleteError) {
        console.error('Failed to delete existing variants:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete existing variants' },
          { status: 500 }
        )
      }

      // Insert new variants
      if (variants.length > 0) {
        const variantsToInsert = variants.map((variant: {
          sku: string
          title?: string
          price: string | number
          compare_at_price?: string | number
          stock_quantity: string | number
          track_inventory?: boolean
          continue_selling_when_out_of_stock?: boolean
          is_active?: boolean
          position?: number
        }) => ({
          product_id: id,
          sku: variant.sku,
          title: variant.title || '',
          price: parseFloat(variant.price.toString()),
          compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price.toString()) : null,
          stock_quantity: parseInt(variant.stock_quantity.toString()),
          track_inventory: variant.track_inventory !== undefined ? variant.track_inventory : true,
          continue_selling_when_out_of_stock: variant.continue_selling_when_out_of_stock !== undefined ? variant.continue_selling_when_out_of_stock : false,
          is_active: variant.is_active !== undefined ? variant.is_active : true,
          position: variant.position || 0
        }))

        const { data: insertedVariants, error: insertError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert)
          .select('*')

        if (insertError) {
          console.error('Failed to insert variants:', insertError)
          return NextResponse.json(
            { error: 'Failed to insert variants' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          message: 'Variants updated successfully',
          data: insertedVariants,
          count: insertedVariants.length
        })
      }

      return NextResponse.json({
        message: 'All variants removed successfully',
        data: [],
        count: 0
      })
    } else {
      // Single variant update
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
      const { error: productError } = await supabase
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

      // Update variant
      const { data: updatedVariant, error: updateError } = await supabase
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
        .eq('product_id', id)
        .eq('sku', sku)
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
    }

  } catch (error) {
    console.error('Variant update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint for deleting variants (admin functionality)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()

    const { variantId } = body

    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const { error: productError } = await supabase
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

    // Check if variant exists and belongs to this product
    const { error: variantCheckError } = await supabase
      .from('product_variants')
      .select('id, product_id')
      .eq('id', variantId)
      .eq('product_id', id)
      .single()

    if (variantCheckError) {
      if (variantCheckError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Variant not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to validate variant' },
        { status: 500 }
      )
    }

    // Delete variant attribute values first (foreign key constraint)
    const { error: attributesDeleteError } = await supabase
      .from('variant_attribute_values')
      .delete()
      .eq('variant_id', variantId)

    if (attributesDeleteError) {
      console.error('Failed to delete variant attributes:', attributesDeleteError)
      // Continue with variant deletion even if attribute deletion fails
    }

    // Delete the variant
    const { error: deleteError } = await supabase
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
      deleted_variant_id: variantId
    })
  } catch (error) {
    console.error('Variant deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}