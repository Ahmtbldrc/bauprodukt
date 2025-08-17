'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { useAdminSearch } from '@/contexts/AdminSearchContext'

interface WaitlistFiltersProps {
  onFiltersChange: (filters: {
    type: 'new' | 'update' | 'all'
    requiresReview: boolean
    hasInvalidDiscount: boolean
    reason: string
  }) => void
}

export function WaitlistFilters({ onFiltersChange }: WaitlistFiltersProps) {
  const { waitlistFilters, setWaitlistFilters } = useAdminSearch()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: string, value: string | boolean) => {
    const newFilters = { ...waitlistFilters, [key]: value }
    setWaitlistFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      type: 'all' as const,
      requiresReview: false,
      hasInvalidDiscount: false,
      reason: ''
    }
    setWaitlistFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = waitlistFilters.type !== 'all' || 
                          waitlistFilters.requiresReview || 
                          waitlistFilters.hasInvalidDiscount || 
                          waitlistFilters.reason

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Filter</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Aktiv
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Löschen</span>
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? 'Verstecken' : 'Anzeigen'}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Typ
              </label>
              <select
                value={waitlistFilters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Alle</option>
                <option value="new">Neue Produkte</option>
                <option value="update">Updates</option>
              </select>
            </div>

            {/* Reason Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grund
              </label>
              <select
                value={waitlistFilters.reason}
                onChange={(e) => handleFilterChange('reason', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alle Gründe</option>
                <option value="new_product">Neues Produkt</option>
                <option value="price_change">Preisänderung</option>
                <option value="variant_change">Variantenänderung</option>
                <option value="name_change">Namensänderung</option>
                <option value="image_change">Bildänderung</option>
                <option value="sku_change">SKU-Änderung</option>
                <option value="multiple_changes">Mehrere Änderungen</option>
              </select>
            </div>

            {/* Manual Review Filter */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresReview"
                checked={waitlistFilters.requiresReview}
                onChange={(e) => handleFilterChange('requiresReview', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requiresReview" className="text-sm font-medium text-gray-700">
                Manuelle Überprüfung erforderlich
              </label>
            </div>

            {/* Invalid Discount Filter */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasInvalidDiscount"
                checked={waitlistFilters.hasInvalidDiscount}
                onChange={(e) => handleFilterChange('hasInvalidDiscount', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hasInvalidDiscount" className="text-sm font-medium text-gray-700">
                Ungültiger Rabatt
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
