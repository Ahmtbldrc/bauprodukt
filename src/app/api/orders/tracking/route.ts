import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateTrackingSchema = z.object({
  order_number: z.string().min(1, 'Order number is required'),
  tracking_url: z.string().url('Valid tracking URL is required')
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate request body
    const validation = updateTrackingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    const { order_number, tracking_url } = validation.data

    // Check if order exists
    const { error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .eq('order_number', order_number)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      console.error('Order fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    // Update tracking URL
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ tracking_url })
      .eq('order_number', order_number)
      .select('id, order_number, tracking_url, updated_at')
      .single()

    if (updateError) {
      console.error('Order tracking update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update tracking URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tracking URL updated successfully',
      data: {
        order_id: updatedOrder.id,
        order_number: updatedOrder.order_number,
        tracking_url: updatedOrder.tracking_url,
        updated_at: updatedOrder.updated_at
      }
    })

  } catch (error) {
    console.error('Tracking URL update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order_number')

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get tracking URL for order
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, tracking_url')
      .eq('order_number', orderNumber)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      console.error('Order fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      tracking_url: order.tracking_url
    })

  } catch (error) {
    console.error('Tracking URL fetch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}