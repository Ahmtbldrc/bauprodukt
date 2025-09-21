import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { USE_S3_STORAGE } from '@/lib/s3-client'
import { storageProvider } from '@/lib/storage/storage-factory'
import type { ProductDocument } from '@/types/admin/product-edit'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get all documents for a product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('product_documents')
      .select('*')
      .eq('product_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Documents fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    // If using S3, generate public URLs for documents
    if (USE_S3_STORAGE && data) {
      const documentsWithPublicUrls = (data as ProductDocument[]).map((doc) => {
        if (doc.file_key) {
          // Generate public URL from the S3 key
          const publicUrl = `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${process.env.S3_BUCKET_NAME || 'product-documents'}/${doc.file_key}`
          return { ...doc, file_url: publicUrl }
        }
        return doc
      })
      return NextResponse.json({ data: documentsWithPublicUrls })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new document for a product
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createClient()
    
    const { title, file_url, file_type, file_size, file_key } = body

    if (!title || !file_url) {
      return NextResponse.json(
        { error: 'Title and file_url are required' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('product_documents')
      .insert({
        product_id: id,
        title,
        file_url,
        file_key: file_key || null, // Store S3 key if available
        file_type: file_type || null,
        file_size: file_size || null
      })
      .select('*')
      .single()

    if (error) {
      console.error('Document creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      )
    }

    // If using S3, generate public URL for the response
    if (USE_S3_STORAGE && data.file_key) {
      const publicUrl = `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${process.env.S3_BUCKET_NAME || 'product-documents'}/${data.file_key}`
      data.file_url = publicUrl
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Document creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update multiple documents for a product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createClient()
    
    const { documents } = body

    if (!Array.isArray(documents)) {
      return NextResponse.json(
        { error: 'Documents array is required' },
        { status: 400 }
      )
    }

    // First, deactivate all existing documents for this product
    const { error: deactivateError } = await (supabase as any)
      .from('product_documents')
      .update({ is_active: false })
      .eq('product_id', id)

    if (deactivateError) {
      console.error('Document deactivation error:', deactivateError)
      return NextResponse.json(
        { error: 'Failed to update documents' },
        { status: 500 }
      )
    }

    // Then, insert/update the new documents
    const documentsToInsert = documents.map((doc: { title: string; file_url: string; file_type?: string; file_size?: number }) => ({
      product_id: id,
      title: doc.title,
      file_url: doc.file_url,
      file_type: doc.file_type || null,
      file_size: doc.file_size || null,
      is_active: true
    }))

    const { data, error } = await (supabase as any)
      .from('product_documents')
      .insert(documentsToInsert)
      .select('*')

    if (error) {
      console.error('Documents update error:', error)
      return NextResponse.json(
        { error: 'Failed to update documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Documents update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a specific document for a product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params
    // Robust extraction: support multiple sources to avoid platform/runtime quirks
    let documentId: string | null = null
    try {
      documentId = request.nextUrl?.searchParams.get('documentId') || request.nextUrl?.searchParams.get('id') || null
    } catch {}
    if (!documentId) {
      try {
        const url = new URL(request.url)
        documentId = url.searchParams.get('documentId') || url.searchParams.get('id')
      } catch {}
    }
    if (!documentId) {
      const headerId = request.headers.get('x-document-id')
      if (headerId) documentId = headerId
    }
    if (!documentId) {
      try {
        const contentType = request.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const body = await request.json().catch(() => null as unknown)
          const candidate = (body as any)?.documentId || (body as any)?.id
          if (candidate) documentId = candidate
        }
      } catch {}
    }
    if (!documentId) {
      console.warn('DELETE /products/[id]/documents -> missing documentId. URL:', request.url)
    }
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // First, get the document to check if it exists and get the file URL
    const { data: document, error: fetchError } = await (supabase as any)
      .from('product_documents')
      .select('*')
      .eq('id', documentId)
      .eq('product_id', productId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        )
      }
      console.error('Document fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch document' },
        { status: 500 }
      )
    }

    // Delete the file from storage if using S3
    if (USE_S3_STORAGE && document.file_key) {
      try {
        await storageProvider.delete(document.file_key)
        console.log('Deleted file from S3:', document.file_key)
      } catch (storageError) {
        console.error('Failed to delete file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the document from database
    const { error: deleteError } = await (supabase as any)
      .from('product_documents')
      .delete()
      .eq('id', documentId)
      .eq('product_id', productId)

    if (deleteError) {
      console.error('Document deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Document deleted successfully',
      deletedDocument: document
    })
  } catch (error) {
    console.error('Document deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
