import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PlumberCalculation } from '@/types/database'

// GET - List all calculations with filters
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient()
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderBy = searchParams.get('orderBy') || 'created_at'
    const ascending = searchParams.get('ascending') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    const search = searchParams.get('search')
    const method = searchParams.get('method') as 'm1' | 'm2' | null
    const dn = searchParams.get('dn')

    let query = supabase
      .from('plumber_calculations')
      .select('*')
      .eq('user_id', user.id)

    // Filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (method) {
      query = query.eq('method', method)
    }
    if (dn) {
      query = query.eq('recommended_dn', dn)
    }

    // Sorting
    query = query.order(orderBy as any, { ascending })

    // Pagination
    if (limit) {
      query = query.limit(limit)
    }
    if (offset !== undefined && limit) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data as PlumberCalculation[] })
  } catch (error) {
    console.error('Error fetching calculations:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST - Create new calculation
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient()
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('plumber_calculations')
      .insert({
        ...body,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: data as PlumberCalculation }, { status: 201 })
  } catch (error) {
    console.error('Error creating calculation:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

