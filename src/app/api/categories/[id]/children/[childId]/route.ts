import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string; childId: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: parentId, childId } = await params

    const { error } = await (supabase as any)
      .from('category_parents')
      .delete()
      .eq('parent_id', parentId)
      .eq('category_id', childId)

    if (error) {
      console.error('Delete child relation error:', error)
      return NextResponse.json({ error: 'Failed to remove child from parent' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Children relation DELETE error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


