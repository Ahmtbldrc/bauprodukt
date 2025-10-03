import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get calculation statistics
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('plumber_calculations')
      .select('id, total_lu, total_lps, total_m3_per_hour, method')
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        data: {
          total_count: 0,
          avg_lu: 0,
          avg_lps: 0,
          avg_m3_per_hour: 0,
          method_m1_count: 0,
          method_m2_count: 0,
        }
      })
    }

    const stats = {
      total_count: data.length,
      avg_lu: data.reduce((sum, calc: any) => sum + calc.total_lu, 0) / data.length,
      avg_lps: data.reduce((sum, calc: any) => sum + calc.total_lps, 0) / data.length,
      avg_m3_per_hour: data.reduce((sum, calc: any) => sum + calc.total_m3_per_hour, 0) / data.length,
      method_m1_count: data.filter((calc: any) => calc.method === 'm1').length,
      method_m2_count: data.filter((calc: any) => calc.method === 'm2').length,
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error('Error fetching calculation stats:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

