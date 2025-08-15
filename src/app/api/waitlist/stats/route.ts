import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Middleware ensures admin access
  try {
    const supabase = createClient()
    
    // Get all waitlist entries for statistics
    const { data: allEntries, error } = await supabase
      .from('waitlist_updates')
      .select('*')
    
    if (error) {
      console.error('Waitlist stats fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch waitlist statistics' },
        { status: 500 }
      )
    }
    
    // Calculate statistics
    const stats = {
      total_entries: allEntries.length,
      new_products: allEntries.filter(e => !e.product_id).length,
      pending_updates: allEntries.filter(e => e.product_id).length,
      manual_review_required: allEntries.filter(e => e.requires_manual_review).length,
      invalid_discounts: allEntries.filter(e => e.has_invalid_discount).length,
      by_reason: {} as Record<string, number>,
      recent_entries: allEntries
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(entry => ({
          id: entry.id,
          product_slug: entry.product_slug,
          type: entry.product_id ? 'update' : 'new',
          reason: entry.reason,
          created_at: entry.created_at,
          requires_manual_review: entry.requires_manual_review,
          has_invalid_discount: entry.has_invalid_discount
        }))
    }
    
    // Count by reason
    allEntries.forEach(entry => {
      const reason = entry.reason || 'unknown'
      stats.by_reason[reason] = (stats.by_reason[reason] || 0) + 1
    })
    
    // Calculate additional metrics
    const priceDropEntries = allEntries.filter(e => e.price_drop_percentage && e.price_drop_percentage > 0)
    const averagePriceDrop = priceDropEntries.length > 0 
      ? priceDropEntries.reduce((sum, e) => sum + (e.price_drop_percentage || 0), 0) / priceDropEntries.length
      : 0
    
    const versionStats = {
      total_revisions: allEntries.reduce((sum, e) => sum + (e.version || 1), 0),
      average_revisions: allEntries.length > 0 
        ? allEntries.reduce((sum, e) => sum + (e.version || 1), 0) / allEntries.length
        : 0,
      max_revisions: Math.max(...allEntries.map(e => e.version || 1), 0)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        average_price_drop_percentage: Math.round(averagePriceDrop * 100) / 100,
        version_statistics: versionStats,
        health_indicators: {
          queue_health: allEntries.length < 100 ? 'good' : allEntries.length < 200 ? 'warning' : 'critical',
          error_rate: Math.round((stats.invalid_discounts / stats.total_entries) * 100 * 100) / 100,
          review_rate: Math.round((stats.manual_review_required / stats.total_entries) * 100 * 100) / 100
        }
      }
    })
    
  } catch (error) {
    console.error('Waitlist stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}