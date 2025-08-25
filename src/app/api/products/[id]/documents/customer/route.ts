import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    
    // Get all active documents for this product
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

    return NextResponse.json({ 
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
