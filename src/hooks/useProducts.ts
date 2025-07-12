'use client'

import { useQuery } from '@tanstack/react-query'

interface ProductImage {
  id: string
  image_url: string
  order_index: number
  is_cover: boolean
}

interface Brand {
  id: string
  name: string
  slug: string
  created_at: string
}

interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  created_at: string
}

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  discount_price?: number
  stock: number
  stock_code?: string
  image_url?: string
  brand_id?: string
  category_id?: string
  created_at: string
  brand?: Brand
  category?: Category
  product_images?: ProductImage[]
}

interface ProductsResponse {
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UseProductsOptions {
  page?: number
  limit?: number
  search?: string
  brand?: string
  category?: string
  stock_code?: string
}

export function useProducts(options: UseProductsOptions = {}) {
  const { page = 1, limit = 10, search, brand, category, stock_code } = options

  return useQuery<ProductsResponse>({
    queryKey: ['products', { page, limit, search, brand, category, stock_code }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (search) {
        params.set('search', search)
      }

      if (brand) {
        params.set('brand', brand)
      }

      if (category) {
        params.set('category', category)
      }

      if (stock_code) {
        params.set('stock_code', stock_code)
      }

      const response = await fetch(`/api/products?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Helper hook to get products by category ID
export function useProductsByCategory(categoryId: string, options: Omit<UseProductsOptions, 'category'> = {}) {
  return useProducts({
    ...options,
    category: categoryId,
    limit: options.limit || 100 // Get more products for category pages
  })
}

// Hook to get a single product by ID
export function useProductById(productId: string) {
  return useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!productId, // Only run query if productId is provided
  })
}

// Hook to find product by slug from a list of products
export function useProductBySlug(slug: string, options: UseProductsOptions = {}) {
  const { data: productsResponse, ...rest } = useProducts({
    ...options,
    search: slug, // Search by slug
    limit: 100 // Get more products to increase chance of finding the exact match
  })

  // Find exact slug match
  const product = productsResponse?.data?.find(product => product.slug === slug)
  
  return {
    ...rest,
    data: product,
    isFound: !!product && !rest.isLoading
  }
}

// Hook to get products by brand and category and find specific product
export function useProductByBrandCategorySlug(
  brandId: string | undefined,
  categoryId: string | undefined,
  productSlug: string
) {
  const options: UseProductsOptions = { limit: 100 }
  
  if (brandId) {
    options.brand = brandId
  }
  
  if (categoryId) {
    options.category = categoryId
  }

  const { data: productsResponse, ...rest } = useProducts(options)

  // Find product with exact slug match
  const product = productsResponse?.data?.find(product => product.slug === productSlug)
  
  return {
    ...rest,
    data: product,
    isFound: !!product && !rest.isLoading
  }
}

// Hook to get products by brand ID
export function useProductsByBrand(brandId: string, options: Omit<UseProductsOptions, 'brand'> = {}) {
  return useProducts({
    ...options,
    brand: brandId,
    limit: options.limit || 100 // Get more products for brand pages
  })
} 