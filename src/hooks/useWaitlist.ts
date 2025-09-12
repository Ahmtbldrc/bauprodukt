import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { WaitlistEntry, WaitlistStats } from '@/types/waitlist'

export function useWaitlist(options: {
  page?: number
  limit?: number
  type?: 'new' | 'update' | 'all'
  requiresReview?: boolean
  hasInvalidDiscount?: boolean
  reason?: string
  sortBy?: 'name' | 'date'
  sortOrder?: 'asc' | 'desc'
} = {}) {
  const [data, setData] = useState<WaitlistEntry[]>([])
  const [stats, setStats] = useState<WaitlistStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 7,
    total: 0,
    totalPages: 0
  })

  const fetchWaitlist = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('waitlist_updates')
        .select(`
          *,
          products(
            id,
            name,
            image_url
          )
        `, { count: 'exact' })
      
      // Apply filters
      if (options.type === 'new') {
        query = query.is('product_id', null)
      } else if (options.type === 'update') {
        query = query.not('product_id', 'is', null)
      }
      
      if (options.requiresReview) {
        query = query.eq('requires_manual_review', true)
      }
      
      if (options.hasInvalidDiscount) {
        query = query.eq('has_invalid_discount', true)
      }
      
      if (options.reason) {
        query = query.eq('reason', options.reason)
      }
      
      // Pagination
      const from = (pagination.page - 1) * pagination.limit
      const to = from + pagination.limit - 1
      query = query.range(from, to)

      // Global sorting across all records
      const ascending = options.sortOrder === 'asc'
      if (options.sortBy === 'name') {
        // Order by related products.name; fallback to product_slug for entries without product
        query = (query as any)
          .order('name', { foreignTable: 'products', ascending, nullsFirst: !ascending })
          .order('product_slug', { ascending })
      } else if (options.sortBy === 'date') {
        query = query.order('created_at', { ascending })
      } else {
        // Default: newest first
        query = query.order('created_at', { ascending: false })
      }
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      setData(data || [])
      setPagination(prev => ({
        ...prev,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pagination.limit)
      }))
      
    } catch (err) {
      console.error('Waitlist fetch error:', err)
      if (err instanceof Error) {
        setError(err)
      } else if (typeof err === 'string') {
        setError(new Error(err))
      } else {
        setError(new Error(`Database error: ${JSON.stringify(err)}`))
      }
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, options.type, options.requiresReview, options.hasInvalidDiscount, options.reason, options.sortBy, options.sortOrder])

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('waitlist_updates')
        .select('*')
      
      if (error) throw error
      
      // Calculate statistics
      const stats = {
        total_entries: data.length,
        new_products: (data as any[]).filter(e => !e.product_id).length,
        pending_updates: (data as any[]).filter(e => e.product_id).length,
        manual_review_required: (data as any[]).filter(e => e.requires_manual_review).length,
        invalid_discounts: (data as any[]).filter(e => e.has_invalid_discount).length,
        by_reason: {},
        recent_entries: (data as any[])
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
          })),
        average_price_drop_percentage: 0,
        version_statistics: {
          total_revisions: (data as any[]).reduce((sum, e) => sum + (e.version || 1), 0),
          average_revisions: data.length > 0 
            ? (data as any[]).reduce((sum, e) => sum + (e.version || 1), 0) / data.length
            : 0,
          max_revisions: Math.max(...(data as any[]).map(e => e.version || 1), 0)
        },
        health_indicators: {
          queue_health: data.length < 100 ? 'good' : data.length < 200 ? 'warning' : 'critical',
          error_rate: data.length > 0 ? Math.round(((data as any[]).filter(e => e.has_invalid_discount).length / data.length) * 100 * 100) / 100 : 0,
          review_rate: data.length > 0 ? Math.round(((data as any[]).filter(e => e.requires_manual_review).length / data.length) * 100 * 100) / 100 : 0
        }
      } as WaitlistStats
      
      // Count by reason
      (data as any[]).forEach((entry: any) => {
        const reason = entry.reason || 'unknown'
        stats.by_reason[reason] = (stats.by_reason[reason] || 0) + 1
      })
      
      setStats(stats)
      
    } catch (err) {
      console.error('Failed to fetch waitlist stats:', err)
      if (err instanceof Error) {
        setError(err)
      } else if (typeof err === 'string') {
        setError(new Error(err))
      } else {
        setError(new Error(`Stats fetch error: ${JSON.stringify(err)}`))
      }
    }
  }, [])

  const approveEntry = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/waitlist/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve entry')
      }
      
      // Refresh data
      await fetchWaitlist()
      await fetchStats()
      
      return await response.json()
    } catch (err) {
      console.error('Approve entry error:', err)
      if (err instanceof Error) {
        setError(err)
      } else if (typeof err === 'string') {
        setError(new Error(err))
      } else {
        setError(new Error(`Approve error: ${JSON.stringify(err)}`))
      }
      // Don't re-throw the error to prevent unhandled promise rejections
      return null
    }
  }, [fetchWaitlist, fetchStats])

  const rejectEntry = useCallback(async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/waitlist/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject entry')
      }
      
      // Refresh data
      await fetchWaitlist()
      await fetchStats()
      
      return await response.json()
    } catch (err) {
      console.error('Reject entry error:', err)
      if (err instanceof Error) {
        setError(err)
      } else if (typeof err === 'string') {
        setError(new Error(err))
      } else {
        setError(new Error(`Reject error: ${JSON.stringify(err)}`))
      }
      // Don't re-throw the error to prevent unhandled promise rejections
      return null
    }
  }, [fetchWaitlist, fetchStats])

  const bulkApprove = useCallback(async (ids: string[], skipInvalid: boolean = false) => {
    try {
      const response = await fetch('/api/waitlist/bulk/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, skipInvalid })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to bulk approve')
      }
      
      // Refresh data
      await fetchWaitlist()
      await fetchStats()
      
      return await response.json()
    } catch (err) {
      console.error('Bulk approve error:', err)
      if (err instanceof Error) {
        setError(err)
      } else if (typeof err === 'string') {
        setError(new Error(err))
      } else {
        setError(new Error(`Bulk approve error: ${JSON.stringify(err)}`))
      }
      // Don't re-throw the error to prevent unhandled promise rejections
      return null
    }
  }, [fetchWaitlist, fetchStats])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  useEffect(() => {
    fetchWaitlist()
    fetchStats()
  }, [fetchWaitlist, fetchStats])

  // Options değiştiğinde pagination'ı sıfırla
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [options.type, options.requiresReview, options.hasInvalidDiscount, options.reason, options.sortBy, options.sortOrder])

  return {
    data,
    stats,
    pagination,
    isLoading,
    error,
    approveEntry,
    rejectEntry,
    bulkApprove,
    refetch: fetchWaitlist,
    setPage,
    setLimit
  }
} 
