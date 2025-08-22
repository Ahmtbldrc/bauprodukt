import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    
    const { title, file_url, file_type, file_size } = body

    if (!title || !file_url) {
      return NextResponse.json(
        { error: 'Title and file_url are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('product_documents')
      .insert({
        product_id: id,
        title,
        file_url,
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
    const { error: deactivateError } = await supabase
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

    const { data, error } = await supabase
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
