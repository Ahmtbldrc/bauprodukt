'use client'

import { useQuery } from '@tanstack/react-query'

interface Brand {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  created_at: string
}

interface BrandsResponse {
  data: Brand[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UseBrandsOptions {
  page?: number
  limit?: number
  search?: string
}

export function useBrands(options: UseBrandsOptions = {}) {
  const { page = 1, limit = 10, search } = options

  return useQuery<BrandsResponse>({
    queryKey: ['brands', { page, limit, search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (search) {
        params.set('search', search)
      }

      const response = await fetch(`/api/brands?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch brands')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Helper hook to get all brands (without pagination)
export function useAllBrands() {
  return useQuery<BrandsResponse>({
    queryKey: ['brands', 'all'],
    queryFn: async () => {
      const response = await fetch('/api/brands?limit=100') // Get all brands with high limit
      
      if (!response.ok) {
        throw new Error('Failed to fetch brands')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
} 