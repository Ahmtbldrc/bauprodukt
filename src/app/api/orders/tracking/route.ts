import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateTrackingSchema = z.object({
  order_number: z.string().min(1, 'Order number is required'),
  tracking_url: z.string().url('Valid tracking URL is required'),
  tracking_number: z.string().min(1, 'Tracking number is required'),
  expected_delivery_date: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed >= new Date()
  }, 'Expected delivery date must be a valid future date')
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

    const { order_number, tracking_url, tracking_number, expected_delivery_date } = validation.data

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

    // Update tracking information and set status to delivered
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        tracking_url,
        tracking_number,
        expected_delivery_date,
        status: 'delivered'
      })
      .eq('order_number', order_number)
      .select('id, order_number, tracking_url, tracking_number, expected_delivery_date, status, updated_at')
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
      message: 'Tracking information added and order status updated to delivered',
      data: {
        order_id: updatedOrder.id,
        order_number: updatedOrder.order_number,
        tracking_url: updatedOrder.tracking_url,
        tracking_number: updatedOrder.tracking_number,
        expected_delivery_date: updatedOrder.expected_delivery_date,
        status: updatedOrder.status,
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

    // Get tracking information for order
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, tracking_url, tracking_number, expected_delivery_date, status')
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
      tracking_url: order.tracking_url,
      tracking_number: order.tracking_number,
      expected_delivery_date: order.expected_delivery_date,
      status: order.status
    })

  } catch (error) {
    console.error('Tracking URL fetch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}