import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function valueExists(supabase: ReturnType<typeof createClient>, table: string, column: string, value: string) {
  const { data, error } = await (supabase as any)
    .from(table)
    .select(column)
    .eq(column, value)
    .limit(1)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') {
    // Non-not-found errors should bubble up as existence unknown (treat as exists=false)
    return false
  }
  return !!data
}

async function generateUnique(supabase: ReturnType<typeof createClient>, table: string, column: string, base: string, options?: { suffix?: string; toUpper?: boolean }) {
  const suffix = options?.suffix ?? '-copy'
  const transform = (v: string) => (options?.toUpper ? v.toUpperCase() : v)

  const baseCandidate = transform(base.endsWith(suffix) ? base : `${base}${suffix}`)
  let candidate = baseCandidate
  let counter = 1
  // Try base, then -copy-2, -copy-3,...
  while (await valueExists(supabase, table, column, candidate)) {
    counter += 1
    candidate = transform(`${base}${suffix}-${counter}`)
  }
  return candidate
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  try {
    const { id: productId } = await params

    // Fetch original product
    const { data: original, error: fetchProductError } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (fetchProductError) {
      if (fetchProductError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }

    // Prepare unique fields
    const newSlug = await generateUnique(supabase, 'products', 'slug', original.slug)
    const newStockCode = original.stock_code
      ? await generateUnique(supabase, 'products', 'stock_code', original.stock_code.toString())
      : null

    // Build insert payload for products table (omit id/created_at/updated_at)
    const {
      id: _omit1,
      created_at: _omit2,
      updated_at: _omit3,
      slug: _omit4,
      stock_code: _omit5,
      ...rest
    } = original

    const productInsert = {
      ...rest,
      name: `${original.name} (copy)`,
      slug: newSlug,
      stock_code: newStockCode,
      status: original.status || 'active'
    }

    const { data: created, error: createError } = await (supabase as any)
      .from('products')
      .insert([productInsert])
      .select('*')
      .single()

    if (createError) {
      return NextResponse.json({ error: 'Failed to create product copy' }, { status: 500 })
    }

    const newProductId = created.id as string

    // Clone sub-resources. Best effort: log failures but continue.
    // 1) Images
    try {
      const { data: images } = await (supabase as any)
        .from('product_images')
        .select('*')
        .eq('product_id', productId)

      if (Array.isArray(images) && images.length > 0) {
        const imagesInsert = images.map((img: any, index: number) => ({
          product_id: newProductId,
          image_url: img.image_url,
          order_index: typeof img.order_index === 'number' ? img.order_index : index,
          is_cover: !!img.is_cover
        }))
        await (supabase as any).from('product_images').insert(imagesInsert)
      }
    } catch (e) {
      console.error('Failed to clone images:', e)
    }

    // 2) Documents
    try {
      const { data: documents } = await (supabase as any)
        .from('product_documents')
        .select('*')
        .eq('product_id', productId)

      if (Array.isArray(documents) && documents.length > 0) {
        const docsInsert = documents.map((doc: any) => ({
          product_id: newProductId,
          title: doc.title,
          file_url: doc.file_url,
          file_type: doc.file_type ?? null,
          file_size: doc.file_size ?? null,
          is_active: doc.is_active ?? true
        }))
        await (supabase as any).from('product_documents').insert(docsInsert)
      }
    } catch (e) {
      console.error('Failed to clone documents:', e)
    }

    // 3) Videos
    try {
      const { data: videos } = await (supabase as any)
        .from('product_videos')
        .select('*')
        .eq('product_id', productId)

      if (Array.isArray(videos) && videos.length > 0) {
        const vidsInsert = videos.map((v: any) => ({
          product_id: newProductId,
          title: v.title,
          video_url: v.video_url,
          thumbnail_url: v.thumbnail_url ?? null,
          duration: v.duration ?? null,
          file_size: v.file_size ?? null,
          sort_order: v.sort_order ?? null,
          is_active: v.is_active ?? true
        }))
        await (supabase as any).from('product_videos').insert(vidsInsert)
      }
    } catch (e) {
      console.error('Failed to clone videos:', e)
    }

    // 4) PDFs
    try {
      const { data: pdfs } = await (supabase as any)
        .from('product_pdfs')
        .select('*')
        .eq('product_id', productId)

      if (Array.isArray(pdfs) && pdfs.length > 0) {
        const pdfsInsert = pdfs.map((p: any) => ({
          product_id: newProductId,
          filename: p.filename,
          original_url: p.original_url,
          tab_section: p.tab_section ?? null,
          local_path: p.local_path ?? null,
          supabase_url: p.supabase_url ?? null,
          supabase_path: p.supabase_path ?? null,
          storage_type: p.storage_type,
          file_size: p.file_size ?? null,
          file_hash: p.file_hash ?? null,
          mime_type: p.mime_type ?? null,
          download_status: p.download_status ?? null,
          upload_status: p.upload_status,
          upload_date: p.upload_date ?? null
        }))
        await (supabase as any).from('product_pdfs').insert(pdfsInsert)
      }
    } catch (e) {
      console.error('Failed to clone PDFs:', e)
    }

    // 5) Conversion factors
    try {
      const { data: conv } = await (supabase as any)
        .from('product_conversion_factors')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle()
      if (conv) {
        await (supabase as any)
          .from('product_conversion_factors')
          .insert({
            product_id: newProductId,
            length_units: conv.length_units ?? true,
            weight_units: conv.weight_units ?? true,
            volume_units: conv.volume_units ?? false,
            temperature_units: conv.temperature_units ?? false
          })
      }
    } catch (e) {
      console.error('Failed to clone conversion factors:', e)
    }

    // 6) Variants and attribute values
    try {
      const { data: variants } = await (supabase as any)
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)

      if (Array.isArray(variants) && variants.length > 0) {
        // Insert variants one by one to ensure unique SKU generation
        const oldToNewVariantId: Record<string, string> = {}
        for (const variant of variants) {
          const baseSku = variant.sku
          const uniqueSku = await generateUnique(supabase, 'product_variants', 'sku', baseSku, { suffix: '-COPY', toUpper: false })
          const { id: _vId, created_at: _vC, updated_at: _vU, product_id: _vPid, sku: _vSku, ...variantRest } = variant
          const { data: inserted, error: vErr } = await (supabase as any)
            .from('product_variants')
            .insert([{ ...variantRest, product_id: newProductId, sku: uniqueSku }])
            .select('*')
            .single()
          if (!vErr && inserted) {
            oldToNewVariantId[variant.id] = inserted.id
          }
        }

        // Clone variant attribute values
        const oldVariantIds = Object.keys(oldToNewVariantId)
        if (oldVariantIds.length > 0) {
          const { data: attrValues } = await (supabase as any)
            .from('variant_attribute_values')
            .select('*')
            .in('variant_id', oldVariantIds)

          if (Array.isArray(attrValues) && attrValues.length > 0) {
            const vavs = attrValues
              .map((av: any) => ({
                variant_id: oldToNewVariantId[av.variant_id],
                attribute_value_id: av.attribute_value_id
              }))
              .filter((row: any) => !!row.variant_id)
            if (vavs.length > 0) {
              await (supabase as any)
                .from('variant_attribute_values')
                .insert(vavs)
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to clone variants:', e)
    }

    // Audit log
    try {
      const userEmail = request.headers.get('x-user-email') || 'unknown'
      await (supabase as any)
        .from('audit_log')
        .insert({
          actor: userEmail,
          action: 'duplicate_product',
          target_type: 'product',
          target_id: newProductId,
          before_state: original,
          after_state: created,
          timestamp: new Date().toISOString()
        })
    } catch (e) {
      console.error('Failed to write audit log for duplicate:', e)
    }

    return NextResponse.json({ id: newProductId }, { status: 201 })
  } catch (error) {
    console.error('Product duplicate API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


