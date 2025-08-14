'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AdminSearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const AdminSearchContext = createContext<AdminSearchContextType | undefined>(undefined)

export function AdminSearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <AdminSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
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
