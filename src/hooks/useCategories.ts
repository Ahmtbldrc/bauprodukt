'use client'

import { useQuery } from '@tanstack/react-query'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  emoji?: string
  parent_id?: string | null
  created_at: string
  parent?: Category | null
}

interface CategoriesResponse {
  data: Category[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UseCategoriesOptions {
  page?: number
  limit?: number
  search?: string
  parent_id?: string | null
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { page = 1, limit = 10, search, parent_id } = options

  return useQuery<CategoriesResponse>({
    queryKey: ['categories', { page, limit, search, parent_id }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (search) {
        params.set('search', search)
      }

      if (parent_id !== undefined) {
        params.set('parent_id', parent_id || 'null')
      }

      const response = await fetch(`/api/categories?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Helper hook to get all categories (without pagination)
export function useAllCategories() {
  return useQuery<CategoriesResponse>({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const response = await fetch('/api/categories?limit=100') // Get all categories with high limit
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Helper hook to get root categories only (no parent)
export function useRootCategories() {
  return useQuery<CategoriesResponse>({
    queryKey: ['categories', 'root'],
    queryFn: async () => {
      const response = await fetch('/api/categories?parent_id=null&limit=100')
      
      if (!response.ok) {
        throw new Error('Failed to fetch root categories')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Helper hook to get category by slug
export function useCategoryBySlug(slug: string) {
  const { data: categoriesResponse, ...rest } = useAllCategories()
  
  const category = categoriesResponse?.data?.find(cat => cat.slug === slug)
  
  return {
    ...rest,
    data: category,
    isFound: !!category && !rest.isLoading
  }
} 