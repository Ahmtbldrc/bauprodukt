import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateProduct } from '@/schemas/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const brand = searchParams.get('brand')
    const category = searchParams.get('category')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('products_with_relations')
      .select(`
        *,
        product_images(
          id,
          image_url,
          order_index,
          is_cover
        )
      `)
      .range(from, to)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (brand) {
      query = query.eq('brand_id', brand)
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Products fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Sort product images and prepare discount information for each product
    const productsWithSortedImages = data?.map(product => ({
      ...product,
      product_images: product.product_images?.sort((a: any, b: any) => {
        // Cover image comes first, then sort by order_index
        if (a.is_cover && !b.is_cover) return -1
        if (!a.is_cover && b.is_cover) return 1
        return a.order_index - b.order_index
      }) || [],
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
    }))

    return NextResponse.json({
      data: productsWithSortedImages,
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
    
    const validation = validateProduct(body)
    if (!validation.success) {
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

    const { data, error: createError } = await supabase
      .from('products')
      .insert([validation.data])
      .select('*')
      .single()

    if (createError) {
      console.error('Product creation error:', createError)
      
      // Handle unique constraint violations
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'Product with this slug already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    // Fetch the created product with relations
    const { data: createdProduct, error: fetchError } = await supabase
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