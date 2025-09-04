'use client'

import { useQuery } from '@tanstack/react-query'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  emoji?: string
  icon_url?: string | null
  parent_id?: string | null
  created_at: string
  parent?: Category | null
  category_type?: 'main' | 'sub'
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
  category_type?: 'main' | 'sub'
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { page = 1, limit = 10, search, parent_id, category_type } = options

  return useQuery<CategoriesResponse>({
    queryKey: ['categories', { page, limit, search, parent_id, category_type }],
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

      if (category_type) {
        params.set('category_type', category_type)
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

// Helper hook to get main categories (parent_id is null)
export function useMainCategories() {
  return useQuery<CategoriesResponse>({
    queryKey: ['categories', 'main'],
    queryFn: async () => {
      const response = await fetch('/api/categories?category_type=main&limit=100')
      if (!response.ok) {
        throw new Error('Failed to fetch main categories')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Helper hook to get sub categories (parent_id is not null), including unattached
export function useSubCategories(includeUnattached: boolean = true) {
  return useQuery<CategoriesResponse>({
    queryKey: ['categories', 'sub', { includeUnattached }],
    queryFn: async () => {
      const response = await fetch('/api/categories?category_type=sub&limit=100')
      if (!response.ok) {
        throw new Error('Failed to fetch sub categories')
      }
      const json = await response.json()
      if (!includeUnattached) return json
      return json
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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

// Fetch children (subcategories) of a given main category using the category_parents relation
export function useCategoryChildren(parentId?: string) {
  return useQuery<Array<{ category_id: string; order_index: number; category: Category }>>({
    queryKey: ['categories', 'children', parentId],
    enabled: !!parentId,
    queryFn: async () => {
      const response = await fetch(`/api/categories/${parentId}/children`)
      if (!response.ok) {
        throw new Error('Failed to fetch children')
      }
      const json = await response.json()
      return json.data || []
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}