import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Middleware ensures admin access
  try {
    const supabase = createClient()
    const userEmail = request.headers.get('x-user-email') || 'unknown'
    
    // Parse request body
    const body = await request.json()
    const { ids, skipInvalid = false } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids array is required' },
        { status: 400 }
      )
    }
    
    const results = {
      approved: 0,
      failed: 0,
      errors: [] as Array<{ id: string; error: string }>
    }
    
    // Process each entry individually
    for (const id of ids) {
      try {
        // Get waitlist entry
        const { data: entry, error: fetchError } = await supabase
          .from('waitlist_updates')
          .select('*')
          .eq('id', id)
          .single()
        
        if (fetchError || !entry) {
          results.failed++
          results.errors.push({
            id,
            error: 'Waitlist entry not found'
          })
          continue
        }
        
        // Skip invalid entries if requested
        if (skipInvalid && (!entry.is_valid || entry.has_invalid_discount)) {
          results.failed++
          results.errors.push({
            id,
            error: 'Entry has validation errors and skipInvalid is true'
          })
          continue
        }
        
        let productId = entry.product_id
        let action = ''
        
        if (entry.product_id) {
          // Update existing product
          action = 'approve_update'
          
          // Extract documents and other fields from payload
          const { 
            documents, 
            videos, 
            conversion_factors, 
            technical_specs,
            general_technical_specs,
            specifications_data,
            variants,
            ...productData 
          } = entry.payload_json as any
          
          // Prepare specifications_data for products table
          const finalSpecificationsData = {
            ...specifications_data,
            ...(technical_specs && { technical_specs }),
            ...(general_technical_specs && { general_technical_specs })
          }
          
          const updateData = {
            ...productData,
            ...(Object.keys(finalSpecificationsData).length > 0 && { specifications_data: finalSpecificationsData }),
            status: 'active',
            updated_at: new Date().toISOString()
          }
          
          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', entry.product_id)
          
          if (updateError) {
            throw new Error(`Failed to update product: ${updateError.message}`)
          }

          // Handle documents separately
          if (documents && Array.isArray(documents)) {
            // First deactivate existing documents
            await supabase
              .from('product_documents')
              .update({ is_active: false })
              .eq('product_id', entry.product_id)

            // Insert new documents
            if (documents.length > 0) {
              const documentsToInsert = documents.map((doc: any) => ({
                product_id: entry.product_id,
                title: doc.title,
                file_url: doc.file_url,
                file_type: doc.file_type,
                file_size: doc.file_size,
                is_active: true
              }))

              const { error: docsError } = await supabase
                .from('product_documents')
                .insert(documentsToInsert)

              if (docsError) {
                console.error('Failed to insert documents:', docsError)
              }
            }
          }

          // Handle videos separately
          if (videos && Array.isArray(videos)) {
            // First deactivate existing videos
            await supabase
              .from('product_videos')
              .update({ is_active: false })
              .eq('product_id', entry.product_id)

            // Insert new videos
            if (videos.length > 0) {
              const videosToInsert = videos.map((video: any) => ({
                product_id: entry.product_id,
                title: video.title,
                video_url: video.video_url,
                thumbnail_url: video.thumbnail_url,
                duration: video.duration,
                file_size: video.file_size,
                is_active: true
              }))

              const { error: videosError } = await supabase
                .from('product_videos')
                .insert(videosToInsert)

              if (videosError) {
                console.error('Failed to insert videos:', videosError)
              }
            }
          }

          // Handle conversion factors separately
          if (conversion_factors) {
            const { error: cfError } = await supabase
              .from('product_conversion_factors')
              .upsert({
                product_id: entry.product_id,
                ...conversion_factors
              })

            if (cfError) {
              console.error('Failed to upsert conversion factors:', cfError)
            }
          }

          // Handle variants separately
          if (variants && Array.isArray(variants)) {
            // First deactivate existing variants
            await supabase
              .from('product_variants')
              .update({ is_active: false })
              .eq('product_id', entry.product_id)

            // Insert new variants
            if (variants.length > 0) {
              const variantsToInsert = variants.map((variant: any) => ({
                product_id: entry.product_id,
                sku: variant.sku,
                title: variant.title,
                price: variant.price,
                compare_at_price: variant.compare_at_price,
                stock_quantity: variant.stock_quantity,
                track_inventory: variant.track_inventory,
                continue_selling_when_out_of_stock: variant.continue_selling_when_out_of_stock,
                is_active: true,
                position: variant.position || 0
              }))

              const { error: variantsError } = await supabase
                .from('product_variants')
                .insert(variantsToInsert)

              if (variantsError) {
                console.error('Failed to insert variants:', variantsError)
              }
            }
          }
        } else {
          // Create new product
          action = 'approve_new'
          
          // Extract documents and other fields from payload
          const { 
            documents, 
            videos, 
            conversion_factors, 
            technical_specs,
            general_technical_specs,
            specifications_data,
            variants,
            ...productData 
          } = entry.payload_json as any
          
          // Prepare specifications_data for products table
          const finalSpecificationsData = {
            ...specifications_data,
            ...(technical_specs && { technical_specs }),
            ...(general_technical_specs && { general_technical_specs })
          }
          
          const newProductData = {
            ...productData,
            ...(Object.keys(finalSpecificationsData).length > 0 && { specifications_data: finalSpecificationsData }),
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: newProduct, error: createError } = await supabase
            .from('products')
            .insert(newProductData)
            .select('id')
            .single()
          
          if (createError) {
            throw new Error(`Failed to create product: ${createError.message}`)
          }
          
          productId = newProduct.id

          // Handle documents separately
          if (documents && Array.isArray(documents)) {
            if (documents.length > 0) {
              const documentsToInsert = documents.map((doc: any) => ({
                product_id: productId,
                title: doc.title,
                file_url: doc.file_url,
                file_type: doc.file_type,
                file_size: doc.file_size,
                is_active: true
              }))

              const { error: docsError } = await supabase
                .from('product_documents')
                .insert(documentsToInsert)

              if (docsError) {
                console.error('Failed to insert documents:', docsError)
              }
            }
          }

          // Handle videos separately
          if (videos && Array.isArray(videos)) {
            if (videos.length > 0) {
              const videosToInsert = videos.map((video: any) => ({
                product_id: productId,
                title: video.title,
                video_url: video.video_url,
                thumbnail_url: video.thumbnail_url,
                duration: video.duration,
                file_size: video.file_size,
                is_active: true
              }))

              const { error: videosError } = await supabase
                .from('product_videos')
                .insert(videosToInsert)

              if (videosError) {
                console.error('Failed to insert videos:', videosError)
              }
            }
          }

          // Handle conversion factors separately
          if (conversion_factors) {
            const { error: cfError } = await supabase
              .from('product_conversion_factors')
              .insert({
                product_id: productId,
                ...conversion_factors
              })

            if (cfError) {
              console.error('Failed to insert conversion factors:', cfError)
            }
          }

          // Handle variants separately
          if (variants && Array.isArray(variants)) {
            if (variants.length > 0) {
              const variantsToInsert = variants.map((variant: any) => ({
                product_id: productId,
                sku: variant.sku,
                title: variant.title,
                price: variant.price,
                compare_at_price: variant.compare_at_price,
                stock_quantity: variant.stock_quantity,
                track_inventory: variant.track_inventory,
                continue_selling_when_out_of_stock: variant.continue_selling_when_out_of_stock,
                is_active: true,
                position: variant.position || 0
              }))

              const { error: variantsError } = await supabase
                .from('product_variants')
                .insert(variantsToInsert)

              if (variantsError) {
                console.error('Failed to insert variants:', variantsError)
              }
            }
          }
        }
        
        // Delete waitlist entry
        await supabase
          .from('waitlist_updates')
          .delete()
          .eq('id', id)
        
        // Create audit log
        try {
          await supabase
            .from('audit_log')
            .insert({
              actor: userEmail,
              action: 'bulk_approve',
              target_type: 'waitlist_update',
              target_id: id,
              after_state: {
                product_id: productId,
                original_action: action,
                bulk_operation: true
              },
              timestamp: new Date().toISOString(),
              reason: `Bulk approval - ${action}`
            })
        } catch (auditError) {
          console.error('Failed to create audit log for bulk approve:', auditError)
        }
        
        results.approved++
        
      } catch (error) {
        results.failed++
        results.errors.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Create summary audit log for bulk operation
    try {
      await supabase
        .from('audit_log')
        .insert({
          actor: userEmail,
          action: 'bulk_approve_summary',
          target_type: 'waitlist_bulk_operation',
          target_id: 'bulk_' + Date.now(),
          after_state: {
            total_requested: ids.length,
            approved: results.approved,
            failed: results.failed,
            skip_invalid: skipInvalid
          },
          timestamp: new Date().toISOString(),
          reason: `Bulk approve operation: ${results.approved} approved, ${results.failed} failed`
        })
    } catch (auditError) {
      console.error('Failed to create bulk operation audit log:', auditError)
    }
    
    return NextResponse.json({
      success: true,
      data: results
    })
    
  } catch (error) {
    console.error('Bulk approve API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}