import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateProduct } from '@/schemas/database'
import type { Database } from '@/types/database'

type ProductWithDefaultVariant = Database['public']['Views']['products_with_default_variants']['Row']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const brand = searchParams.get('brand')
    const category = searchParams.get('category')
    const categoriesParam = searchParams.get('categories') // comma-separated category ids
    const stock_code = searchParams.get('stock_code')
    const variant = searchParams.get('variant')
    const status = searchParams.get('status') // Admin filter for status
    const is_changeable = searchParams.get('is_changeable') // Admin filter for changeability
    
    // Check if user is admin from middleware headers
    const userRole = request.headers.get('x-user-role')
    const isAdmin = userRole === 'admin'

    const from = (page - 1) * limit
    const to = from + limit - 1

    // Use products_with_default_variants view for variant support
    let query = (supabase as any)
      .from('products_with_default_variants')
      .select(`
        *,
        product_images(
          id,
          image_url,
          order_index,
          is_cover
        )
      `, { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false })

    // Only filter by status for non-admin users (customers see only active products)
    if (!isAdmin) {
      query = query.eq('status', 'active')
    } else if (status) {
      // Admin can filter by specific status
      query = query.eq('status', status)
    }

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (brand) {
      query = query.eq('brand_id', brand)
    }

    if (categoriesParam) {
      const ids = categoriesParam.split(',').map((s) => s.trim()).filter(Boolean)
      if (ids.length > 0) {
        query = (query as any).in('category_id', ids)
      }
    } else if (category) {
      query = query.eq('category_id', category)
    }

    if (stock_code) {
      query = query.eq('stock_code', stock_code)
    }

    // Admin-only filter for changeability
    if (isAdmin && is_changeable !== null) {
      query = query.eq('is_changeable', is_changeable === 'true')
    }

    // Variant filtering: if variant ID is provided, filter products that have this variant
    if (variant) {
      // This will require a more complex query to check if product has the specified variant
      // For now, we'll handle this after the initial query
    }

    const { data, error, count } = await (query as any)

    if (error) {
      console.error('Products fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Filter by variant if specified
    let filteredData = data
    if (variant && data) {
      // Get products that have the specified variant
      const { data: productsWithVariant } = await (supabase as any)
        .from('product_variants')
        .select('product_id')
        .eq('id', variant)
        .eq('is_active', true)

      if (productsWithVariant && productsWithVariant.length > 0) {
        const productIdsWithVariant = (productsWithVariant as Array<{ product_id: string }>).map((pv) => pv.product_id)
        filteredData = data.filter((product: ProductWithDefaultVariant) => productIdsWithVariant.includes(product.id))
      } else {
        filteredData = []
      }
    }

    // Preload parent categories (main categories) for all products to enrich response
    // Prefer main_category_id from products table if present, otherwise fall back to category_parent_id from the view
    // Fetch main_category_id in a single extra query for all product ids
    const productIds = ((data || []) as Array<any>).map((p) => p.id)
    let productIdToMainId: Record<string, string | null> = {}
    if (productIds.length > 0) {
      const { data: mainMap } = await (supabase as any)
        .from('products')
        .select('id, main_category_id')
        .in('id', productIds)
      if (Array.isArray(mainMap)) {
        productIdToMainId = mainMap.reduce((acc: any, cur: any) => {
          acc[cur.id] = cur.main_category_id || null
          return acc
        }, {})
      }
    }

    const parentIds = Array.from(new Set(((data || []) as Array<any>)
      .map((p) => productIdToMainId[p.id] || p.category_parent_id)
      .filter(Boolean)))

    let parentsById: Record<string, { id: string; name: string; slug: string }> = {}
    if (parentIds.length > 0) {
      const { data: parentsData } = await (supabase as any)
        .from('categories')
        .select('id,name,slug')
        .in('id', parentIds)

      if (Array.isArray(parentsData)) {
        parentsById = parentsData.reduce((acc: any, cur: any) => {
          acc[cur.id] = { id: cur.id, name: cur.name, slug: cur.slug }
          return acc
        }, {})
      }
    }

    // Process products with variant and category information
    const processedProducts = await Promise.all(
      (filteredData || []).map(async (product: ProductWithDefaultVariant & { product_images?: Array<{ id: string; image_url: string; order_index: number; is_cover: boolean }> }) => {
        // If specific variant requested, get that variant's details
        let selectedVariant = null
        if (variant) {
          const { data: variantData } = await (supabase as any)
            .from('product_variants_detailed')
            .select('*')
            .eq('id', variant)
            .eq('product_id', product.id)
            .single()
          
          selectedVariant = variantData
        }

        return {
          ...product,
          product_images: product.product_images?.sort((a: { order_index: number; is_cover: boolean }, b: { order_index: number; is_cover: boolean }) => {
            // Cover image comes first, then sort by order_index
            if (a.is_cover && !b.is_cover) return -1
            if (!a.is_cover && b.is_cover) return 1
            return a.order_index - b.order_index
          }) || [],
          // Enhanced variant information with fallback handling
          has_variants: product.has_variants,
          selected_variant: selectedVariant || {
            id: product.has_variants ? product.default_variant_id : product.effective_variant_id,
            sku: product.has_variants ? product.default_variant_sku : product.effective_sku,
            price: product.price, // Always available via COALESCE
            compare_at_price: product.discount_price,
            stock_quantity: product.stock, // Always available via COALESCE
            is_default: !selectedVariant,
            is_synthetic: !product.has_variants, // Indicates fallback variant
            attributes: selectedVariant?.attributes || []
          },
          // Admin-specific fields (only included if user is admin)
          ...(isAdmin && {
            status: (product as unknown as Record<string, unknown>).status,
            is_changeable: (product as unknown as Record<string, unknown>).is_changeable
          }),
          // Brand ve category bilgileri view'dan geliyor ama nested object formatında değil
          brand: product.brand_name ? {
            id: product.brand_id,
            name: product.brand_name,
            slug: product.brand_slug,
            created_at: ''
          } : null,
          category: product.category_name ? {
            id: product.category_id,
            name: product.category_name,
            slug: product.category_slug,
            parent_id: product.category_parent_id,
            created_at: ''
          } : null
          ,
          // Main category (parent) details for breadcrumb/navigation convenience
          main_category: (productIdToMainId[product.id] || product.category_parent_id) && parentsById[(productIdToMainId[product.id] || product.category_parent_id) as string]
            ? parentsById[(productIdToMainId[product.id] || product.category_parent_id) as string]
            : null
        }
      })
    )

    return NextResponse.json({
      data: processedProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API\'ye gelen veri:', body)
    
    const validation = validateProduct(body)
    console.log('Validation sonucu:', validation)
    
    if (!validation.success) {
      console.error('Validation hatası:', validation.error.errors)
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Generate slug from name if not provided
    if (!body.slug) {
      body.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }

    const { data, error: createError } = await (supabase as any)
      .from('products')
      .insert([validation.data])
      .select('*')
      .single()

    if (createError) {
      console.error('Product creation error:', createError)
      
      // Handle unique constraint violations
      if (createError.code === '23505') {
        // Check which field caused the constraint violation
        if (createError.message?.includes('products_slug_key')) {
          return NextResponse.json(
            { error: 'Product with this slug already exists' },
            { status: 409 }
          )
        } else if (createError.message?.includes('products_stock_code_key')) {
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

      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    // Add audit log for product creation (admin only, middleware ensures this)
    const userEmail = request.headers.get('x-user-email') || 'unknown'
    try {
      await (supabase as any)
        .from('audit_log')
        .insert({
          actor: userEmail,
          action: 'create_product',
          target_type: 'product',
          target_id: data.id,
          after_state: data,
          timestamp: new Date().toISOString()
        })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the product creation if audit logging fails
    }

    // Fetch the created product with relations
    const { data: createdProduct, error: fetchError } = await (supabase as any)
      .from('products_with_relations')
      .select('*')
      .eq('id', data.id)
      .single()

    if (fetchError) {
      console.error('Failed to fetch created product:', fetchError)
      // Return the basic created product if fetching relations fails
      return NextResponse.json(data, { status: 201 })
    }

    // Transform the relations format
    const productWithRelations = {
      ...createdProduct,
      brand: createdProduct.brand_name ? {
        id: createdProduct.brand_id,
        name: createdProduct.brand_name,
        slug: createdProduct.brand_slug,
        created_at: ''
      } : null,
      category: createdProduct.category_name ? {
        id: createdProduct.category_id,
        name: createdProduct.category_name,
        slug: createdProduct.category_slug,
        parent_id: createdProduct.category_parent_id,
        created_at: ''
      } : null
    }

    return NextResponse.json(productWithRelations, { status: 201 })
  } catch (error) {
    console.error('Product creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 