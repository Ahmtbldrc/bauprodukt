import { useQuery } from '@tanstack/react-query'
import { Banner } from '@/types/database'

interface BannersResponse {
  data: Banner[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Fetch all banners
const fetchBanners = async (searchParams?: URLSearchParams): Promise<BannersResponse> => {
  const url = `/api/banners?${searchParams?.toString() || ''}`
  console.log('🔍 Fetching banners from:', url)
  
  const response = await fetch(url)
  console.log('📡 Response status:', response.status, response.statusText)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Banner fetch error:', errorText)
    throw new Error(`Failed to fetch banners: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  console.log('✅ Banners response data:', data)
  console.log('📊 Banners count:', data.data?.length || 0)
  
  return data
}

// Hook to get banners with pagination and filtering
export const useBanners = (
  page: number = 1,
  limit: number = 10,
  isActive?: boolean
) => {
  const searchParams = new URLSearchParams()
  searchParams.set('page', page.toString())
  searchParams.set('limit', limit.toString())
  
  if (isActive !== undefined) {
    searchParams.set('is_active', isActive.toString())
  }

  return useQuery({
    queryKey: ['banners', page, limit, isActive],
    queryFn: () => fetchBanners(searchParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to get only active banners
export const useActiveBanners = () => {
  const searchParams = new URLSearchParams()
  searchParams.set('is_active', 'true')
  searchParams.set('limit', '100') // Get all active banners

  console.log('🎯 Fetching active banners...')

  return useQuery({
    queryKey: ['banners', 'active'],
    queryFn: () => fetchBanners(searchParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
} 