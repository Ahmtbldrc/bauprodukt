import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createClient()
    
    // Get all active variants for this product
    const { data, error } = await supabase
      .from('product_variants_detailed')
      .select('*')
      .eq('product_id', id)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) {
      console.error('Variants fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch variants' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      variants: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Variants API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
