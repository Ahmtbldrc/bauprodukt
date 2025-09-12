'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AdminSearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  productFilters: {
    brandId: string
    categoryId: string
  }
  setProductFilters: React.Dispatch<React.SetStateAction<{
    brandId: string
    categoryId: string
  }>>
  waitlistFilters: {
    type: 'new' | 'update' | 'all'
    requiresReview: boolean
    hasInvalidDiscount: boolean
    reason: string
  }
  setWaitlistFilters: React.Dispatch<React.SetStateAction<{
    type: 'new' | 'update' | 'all'
    requiresReview: boolean
    hasInvalidDiscount: boolean
    reason: string
  }>>
}

const AdminSearchContext = createContext<AdminSearchContextType | undefined>(undefined)

export function AdminSearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [productFilters, setProductFilters] = useState<{ brandId: string; categoryId: string }>({ brandId: '', categoryId: '' })
  const [waitlistFilters, setWaitlistFilters] = useState<{
    type: 'new' | 'update' | 'all'
    requiresReview: boolean
    hasInvalidDiscount: boolean
    reason: string
  }>({
    type: 'all',
    requiresReview: false,
    hasInvalidDiscount: false,
    reason: ''
  })

  return (
    <AdminSearchContext.Provider value={{ 
      searchQuery, 
      setSearchQuery, 
      productFilters,
      setProductFilters,
      waitlistFilters, 
      setWaitlistFilters 
    }}>
      {children}
    </AdminSearchContext.Provider>
  )
}

export function useAdminSearch() {
  const context = useContext(AdminSearchContext)
  if (context === undefined) {
    throw new Error('useAdminSearch must be used within a AdminSearchProvider')
  }
  return context
}
