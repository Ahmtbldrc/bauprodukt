'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useWaitlist } from '@/hooks/useWaitlist'
import { WaitlistEntry } from '@/types/waitlist'
import { useAdminSearch } from '@/contexts/AdminSearchContext'
import { ProductDetailView } from './ProductDetailView'
import { Clock, AlertTriangle, CheckCircle, XCircle, Check, X, Package, Edit } from 'lucide-react'

export function WaitlistTable() {
  const { waitlistFilters } = useAdminSearch()
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentLimit, setCurrentLimit] = useState(7)
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [showProductDialog, setShowProductDialog] = useState(false)

  const {
    data: entries,
    pagination,
    isLoading,
    error,
    approveEntry,
    rejectEntry,
    bulkApprove,
    setPage,
    setLimit
  } = useWaitlist({
    type: waitlistFilters.type,
    requiresReview: waitlistFilters.requiresReview,
    hasInvalidDiscount: waitlistFilters.hasInvalidDiscount,
    reason: waitlistFilters.reason
  })

  // Pagination state'ini hook'tan gelen değerlerle senkronize et
  useEffect(() => {
    if (pagination.page !== currentPage) {
      setCurrentPage(pagination.page)
    }
    if (pagination.limit !== currentLimit) {
      setCurrentLimit(pagination.limit)
    }
  }, [pagination.page, pagination.limit, currentPage, currentLimit])

  const handleSelectEntry = (id: string) => {
    setSelectedEntries(prev => 
      prev.includes(id) 
        ? prev.filter(entryId => entryId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedEntries.length === (entries || []).length) {
      setSelectedEntries([])
    } else {
      setSelectedEntries((entries || []).map(entry => entry.id))
    }
  }

  const handleProductClick = (entry: WaitlistEntry) => {
    setSelectedEntry(entry)
    setShowProductDialog(true)
  }

  const closeProductDialog = () => {
    setShowProductDialog(false)
    setSelectedEntry(null)
  }

  const handleApprove = async (id: string) => {
    setIsProcessing(true)
    try {
      const result = await approveEntry(id)
      if (result !== null) {
        setSelectedEntries(prev => prev.filter(entryId => entryId !== id))
      }
    } catch (error) {
      console.error('Failed to approve entry:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (id: string, reason: string) => {
    setIsProcessing(true)
    try {
      const result = await rejectEntry(id, reason)
      if (result !== null) {
        setSelectedEntries(prev => prev.filter(entryId => entryId !== id))
      }
    } catch (error) {
      console.error('Failed to reject entry:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedEntries.length === 0) return
    
    setIsProcessing(true)
    try {
      const result = await bulkApprove(selectedEntries)
      if (result !== null) {
        setSelectedEntries([])
      }
    } catch (error) {
      console.error('Failed to bulk approve:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = (entry: WaitlistEntry) => {
    if (entry.requires_manual_review) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
    if (entry.has_invalid_discount) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    return <Clock className="h-4 w-4 text-blue-500" />
  }

  const getStatusText = (entry: WaitlistEntry) => {
    if (entry.requires_manual_review) {
      return 'Manuelle Überprüfung'
    }
    if (entry.has_invalid_discount) {
      return 'Ungültiger Rabatt'
    }
    return 'Ausstehend'
  }



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Fehler beim Laden der Warteliste: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedEntries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {selectedEntries.length} Einträge ausgewählt
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkApprove}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Check className="h-4 w-4 mr-2" />
                Alle genehmigen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedEntries.length === (entries || []).length && (entries || []).length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grund
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(entries || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Clock className="h-12 w-12 text-gray-400" />
                      <p>Keine ausstehenden Einträge in der Warteliste gefunden</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (entries || []).map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() => handleSelectEntry(entry.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    
                                          <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-lg overflow-hidden">
                            {entry.products?.image_url && entry.products.image_url.startsWith('http') ? (
                              <div className="relative h-full w-full">
                                <Image
                                  src={entry.products.image_url}
                                  alt={entry.products.name || entry.product_slug}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                {entry.product_id ? (
                                  <Edit className="h-5 w-5 text-gray-500" />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                            )}
                          </div>
                                                      <div className="ml-4">
                              <div 
                                className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => handleProductClick(entry)}
                              >
                                {entry.products?.name || entry.product_slug}
                              </div>
                              <div className="text-sm text-gray-500">
                                {entry.product_id ? 'Update' : 'Neues Produkt'}
                              </div>
                            </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.product_id 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {entry.product_id ? 'Update' : 'Neu'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.reason?.replace('_', ' ') || 'Unknown'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(entry)}
                        <span className="text-sm text-gray-900">
                          {getStatusText(entry)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString('de-CH')}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(entry.id)}
                          disabled={isProcessing}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                          title="Genehmigen"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleReject(entry.id, 'Admin tarafından reddedildi')}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                          title="Ablehnen"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Pro Seite:
              </span>
              <select
                value={currentLimit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value)
                  setCurrentLimit(newLimit)
                  setCurrentPage(1)
                  setLimit(newLimit)
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              
              <span className="text-sm text-gray-700">
                {pagination.total > 0 ? ((currentPage - 1) * currentLimit) + 1 : 0} - {Math.min(currentPage * currentLimit, pagination.total)} / {pagination.total || 0} Einträge
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const newPage = currentPage - 1
                  setCurrentPage(newPage)
                  setPage(newPage)
                }}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Zurück
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Seite {currentPage} / {pagination.totalPages || 1}
              </span>
              
              <button
                onClick={() => {
                  const newPage = currentPage + 1
                  setCurrentPage(newPage)
                  setPage(newPage)
                }}
                disabled={currentPage === (pagination.totalPages || 1)}
                className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Weiter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Dialog */}
      {showProductDialog && selectedEntry && (
        <ProductDetailView
          entry={selectedEntry}
          onApprove={handleApprove}
          onReject={handleReject}
          isProcessing={isProcessing}
          onClose={closeProductDialog}
        />
      )}
    </div>
  )
}
