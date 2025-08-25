import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  // Middleware ensures admin access
  try {
    const supabase = createClient()
    const { id } = await params
    const userEmail = request.headers.get('x-user-email') || 'unknown'
    
    // Get waitlist entry
    const { data: entry, error: fetchError } = await supabase
      .from('waitlist_updates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Waitlist entry not found' },
          { status: 404 }
        )
      }
      
      console.error('Waitlist entry fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch waitlist entry' },
        { status: 500 }
      )
    }
    
    let productId = entry.product_id
    let action = ''
    let beforeState = null
    
    try {
      if (entry.product_id) {
        // This is an update to existing product
        action = 'approve_update'
        
        // Get current product state for audit
        const { data: currentProduct } = await supabase
          .from('products')
          .select('*')
          .eq('id', entry.product_id)
          .single()
        
        beforeState = currentProduct
        
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
        
        // Update existing product (without special fields)
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
        // This is a new product
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
        
        // Create new product (without special fields)
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
      
      // Delete waitlist entry after successful approval
      const { error: deleteError } = await supabase
        .from('waitlist_updates')
        .delete()
        .eq('id', id)
      
      if (deleteError) {
        console.error('Failed to delete waitlist entry:', deleteError)
        // Don't fail the approval if we can't delete the entry
      }
      
      // Create audit log
      try {
        await supabase
          .from('audit_log')
          .insert({
            actor: userEmail,
            action: action,
            target_type: 'waitlist_update',
            target_id: id,
            before_state: beforeState,
            after_state: {
              product_id: productId,
              waitlist_entry: entry,
              action: action
            },
            timestamp: new Date().toISOString(),
            reason: `Approved ${action === 'approve_new' ? 'new product' : 'product update'}`
          })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
        // Don't fail the approval if audit logging fails
      }
      
      return NextResponse.json({
        success: true,
        data: {
          product_id: productId,
          action: action === 'approve_new' ? 'created' : 'updated',
          message: `Product ${action === 'approve_new' ? 'created' : 'updated'} successfully`
        }
      })
      
    } catch (operationError) {
      console.error('Approval operation error:', operationError)
      return NextResponse.json(
        { error: operationError instanceof Error ? operationError.message : 'Failed to approve entry' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Waitlist approve API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}