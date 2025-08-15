import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateProductSchema } from '@/schemas/database'
import type { ProductPdf, ContentSummary, FeaturesListStructure } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const variant = searchParams.get('variant') // Get variant ID parameter
    
    // Check if user is admin from middleware headers
    const userRole = request.headers.get('x-user-role')
    const isAdmin = userRole === 'admin'

    // Use products_with_default_variants view for variant support
    let query = supabase
      .from('products_with_default_variants')
      .select(`
        *,
        product_images(
          id,
          image_url,
          order_index,
          is_cover
        )
      `)
      .eq('id', id)
    
    // Only allow active products for non-admin users
    if (!isAdmin) {
      query = query.eq('status', 'active')
    }
    
    const { data, error } = await query.single()

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

    // Get variant information
    let selectedVariant = null
    let availableVariants = []

    if (variant) {
      // Get specific variant details
      const { data: variantData } = await supabase
        .from('product_variants_detailed')
        .select('*')
        .eq('id', variant)
        .eq('product_id', id)
        .single()
      
      selectedVariant = variantData
    }

    // Get all available variants for this product
    const { data: allVariants } = await supabase
      .from('product_variants_detailed')
      .select('*')
      .eq('product_id', id)
      .eq('is_active', true)
      .order('position', { ascending: true })

    availableVariants = allVariants || []

    // Get product attributes for variant selection UI
    const { data: attributesSummary } = await supabase
      .from('product_attributes_summary')
      .select('*')
      .eq('product_id', id)
      .single()

    // Get PDF information
    const { data: pdfData } = await supabase
      .from('product_pdfs')
      .select('*')
      .eq('product_id', id)
      .eq('download_status', 'completed')
      .order('created_at', { ascending: false })
    
    const pdfs: ProductPdf[] = pdfData || []

    // Generate content summary if features_list exists
    let contentSummary: ContentSummary | undefined
    if (data.features_list) {
      const featuresList = data.features_list as FeaturesListStructure
      const tabs = Object.keys(featuresList)
      const totalContentItems = tabs.reduce((total, tabName) => {
        return total + (featuresList[tabName]?.content_items?.length || 0)
      }, 0)
      const totalPdfs = tabs.reduce((total, tabName) => {
        return total + (featuresList[tabName]?.pdf_references?.length || 0)
      }, 0)
      
      // Find the latest extraction date
      const extractionDates = tabs
        .map(tabName => featuresList[tabName]?.metadata?.extraction_date)
        .filter(Boolean)
        .sort()
      const lastExtractionDate = extractionDates.length > 0 ? extractionDates[extractionDates.length - 1] : null
      
      contentSummary = {
        total_tabs: tabs.length,
        total_content_items: totalContentItems,
        total_pdfs: totalPdfs,
        last_extraction_date: lastExtractionDate
      }
    }

    // Prepare response with variant information
    const productWithVariants = {
      ...data,
      product_images: data.product_images?.sort((a: { order_index: number; is_cover: boolean }, b: { order_index: number; is_cover: boolean }) => {
        // Cover image comes first, then sort by order_index
        if (a.is_cover && !b.is_cover) return -1
        if (!a.is_cover && b.is_cover) return 1
        return a.order_index - b.order_index
      }) || [],
      // Enhanced variant handling with fallback support
      has_variants: data.has_variants,
      selected_variant: selectedVariant || {
        id: data.has_variants ? data.default_variant_id : data.effective_variant_id,
        sku: data.has_variants ? data.default_variant_sku : data.effective_sku,
        price: data.price, // Always available via COALESCE
        compare_at_price: data.discount_price,
        stock_quantity: data.stock, // Always available via COALESCE
        is_default: !selectedVariant,
        is_synthetic: !data.has_variants, // Indicates fallback variant
        attributes: []
      },
      // All available variants for selection (empty if no variants)
      available_variants: data.has_variants ? availableVariants : [],
      // Variant attributes for selection UI (empty if no variants)
      variant_attributes: data.has_variants ? (attributesSummary?.attributes || []) : [],
      // Enhanced content system fields
      content_summary: contentSummary || null,
      pdfs: pdfs,
      
      // Brand ve category bilgileri view'dan geliyor ama nested object formatında değil
      brand: data.brand_name ? {
        id: data.brand_id,
        name: data.brand_name,
        slug: data.brand_slug,
        created_at: ''
      } : null,
      category: data.category_name ? {
        id: data.category_id,
        name: data.category_name,
        slug: data.category_slug,
        parent_id: data.category_parent_id,
        created_at: ''
      } : null
    }

    return NextResponse.json(productWithVariants)
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

    const { data, error: updateError } = await supabase
      .from('products')
      .update(validation.data)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Handle unique constraint violations
      if (updateError.code === '23505') {
        // Check which field caused the constraint violation
        if (updateError.message?.includes('products_slug_key')) {
          return NextResponse.json(
            { error: 'Product with this slug already exists' },
            { status: 409 }
          )
        } else if (updateError.message?.includes('products_stock_code_key')) {
          return NextResponse.json(
            { error: 'Product with this stock code already exists' },
            { status: 409 }
          )
        } else {
          return NextResponse.json(
            { error: 'Product with this data already exists' },
            { status: 409 }
          )
        }
      }

      console.error('Product update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }

    // Add audit log for product update (admin only, middleware ensures this)
    const userEmail = request.headers.get('x-user-email') || 'unknown'
    try {
      await supabase
        .from('audit_log')
        .insert({
          actor: userEmail,
          action: 'update_product',
          target_type: 'product',
          target_id: id,
          after_state: data,
          timestamp: new Date().toISOString()
        })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the product update if audit logging fails
    }

    // Fetch the updated product with relations
    const { data: updatedProduct, error: fetchError } = await supabase
      .from('products_with_relations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Failed to fetch updated product:', fetchError)
      // Return the basic updated product if fetching relations fails
      return NextResponse.json(data)
    }

    // Transform the relations format
    const productWithRelations = {
      ...updatedProduct,
      brand: updatedProduct.brand_name ? {
        id: updatedProduct.brand_id,
        name: updatedProduct.brand_name,
        slug: updatedProduct.brand_slug,
        created_at: ''
      } : null,
      category: updatedProduct.category_name ? {
        id: updatedProduct.category_id,
        name: updatedProduct.category_name,
        slug: updatedProduct.category_slug,
        parent_id: updatedProduct.category_parent_id,
        created_at: ''
      } : null
    }

    return NextResponse.json(productWithRelations)
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
    const { error: fetchError } = await supabase
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

    // Add audit log for product deletion (admin only, middleware ensures this)
    const userEmail = request.headers.get('x-user-email') || 'unknown'
    try {
      await supabase
        .from('audit_log')
        .insert({
          actor: userEmail,
          action: 'delete_product',
          target_type: 'product',
          target_id: id,
          timestamp: new Date().toISOString()
        })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the product deletion if audit logging fails
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