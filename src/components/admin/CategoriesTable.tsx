'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCategories } from '@/hooks/useCategories'
import { useAdminSearch } from '@/contexts/AdminSearchContext'
import { Edit, Trash2, Search } from 'lucide-react'
import Link from 'next/link'

interface CategoriesTableProps {
  onDeleteCategory?: (categoryId: string) => void
  onEditCategory?: (category: {
    id: string
    name: string
    slug: string
    description?: string
    emoji?: string | null
    parent?: {
      id: string
      name: string
    } | null
    created_at: string
  }) => void
  categoryType?: 'main' | 'sub'
}

export function CategoriesTable({ onDeleteCategory, onEditCategory, categoryType }: CategoriesTableProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(8)
  const { searchQuery } = useAdminSearch()
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data: categoriesResponse, isLoading, error } = useCategories({
    page,
    limit,
    search: '', // API'de arama yapmıyoruz, client-side arama yapacağız
    category_type: categoryType,
  })

  

  const allCategories = useMemo(() => {
    return categoriesResponse?.data ?? []
  }, [categoriesResponse?.data])
  const pagination = categoriesResponse?.pagination

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // Arama değiştiğinde ilk sayfaya dön
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Client-side arama
  const filteredCategories = useMemo(() => {
    return allCategories.filter(category => 
      category.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
      category.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  }, [allCategories, debouncedSearch])

  // API'den gelen tüm kategori sayısına göre pagination
  const totalCategories = pagination?.total || 0
  const totalPages = Math.ceil(totalCategories / limit)
  
  // Eğer arama yapılıyorsa client-side filtreleme, yoksa API pagination
  let categories
  let totalFiltered
  
  if (debouncedSearch) {
    // Arama yapılıyorsa client-side filtreleme ve pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    categories = filteredCategories.slice(startIndex, endIndex)
    totalFiltered = filteredCategories.length
  } else {
    // Arama yapılmıyorsa API'den gelen veriyi kullan
    categories = allCategories
    totalFiltered = totalCategories
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#F39237' }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Fehler beim Laden der Kategorien: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Icon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                {categoryType !== 'sub' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Übergeordnete Kategorie
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={categoryType === 'sub' ? 5 : 6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF0E2' }}>
                        <Search className="h-6 w-6" style={{ color: '#F39237' }} />
                      </div>
                      <p>
                        {debouncedSearch ? 'Keine Kategorien gefunden, die Ihren Suchkriterien entsprechen' : 'Noch keine Kategorien vorhanden'}
                      </p>
                      {debouncedSearch && (
                        <p className="text-sm text-gray-500">Versuchen Sie, Ihre Suchkriterien zu ändern</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(category as any).icon_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={(category as any).icon_url} alt={category.name} className="h-6 w-6" />
                        ) : (category.emoji ? (
                          <span className="text-2xl">{category.emoji}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {category.slug}
                      </div>
                    </td>
                    {categoryType !== 'sub' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {category.parent ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: '#FFF0E2', color: '#F39237' }}>
                              {category.parent.name}
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Hauptkategorie
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(category.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {onEditCategory ? (
                          <button
                            onClick={() => onEditCategory({
                              id: category.id,
                              name: category.name,
                              slug: category.slug,
                              description: (category as any).description,
                              emoji: (category as any).emoji ?? null,
                              parent: category.parent ? { id: (category.parent as any).id, name: (category.parent as any).name } : null,
                              created_at: category.created_at,
                            })}
                            className="text-gray-700 p-1 rounded hover:bg-gray-100"
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        ) : (
                          <Link
                            href={`/admin/categories/${category.id}`}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => onDeleteCategory?.(category.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
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
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="border border-gray-300 rounded-full px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: 'var(--font-blinker)' }}
              >
                <option value={8}>8</option>
                <option value={16}>16</option>
                <option value={24}>24</option>
                <option value={32}>32</option>
              </select>
              <span className="text-sm text-gray-700">
                {totalFiltered > 0 ? ((page - 1) * limit) + 1 : 0} - {Math.min(page * limit, totalFiltered)} / {totalFiltered} Kategorien
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
                style={{ fontFamily: 'var(--font-blinker)' }}
              >
                Zurück
              </button>
            
              {totalPages > 0 ? (
                Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    // 5 veya daha az sayfa varsa hepsini göster
                    pageNum = i + 1
                  } else {
                    // 5'ten fazla sayfa varsa akıllı sayfa gösterimi
                    if (page <= 3) {
                      // İlk sayfalardaysak 1,2,3,4,5 göster
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      // Son sayfalardaysak son 5 sayfayı göster
                      pageNum = totalPages - 4 + i
                    } else {
                      // Ortada bir yerdeysek page-2, page-1, page, page+1, page+2 göster
                      pageNum = page - 2 + i
                    }
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                        pageNum === page
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                      style={{ fontFamily: 'var(--font-blinker)' }}
                    >
                      {pageNum}
                    </button>
                  )
                })
              ) : (
                <span className="px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-full">1</span>
              )}
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || totalPages === 0}
                className="px-4 py-2 text-sm font-medium rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
                style={{ fontFamily: 'var(--font-blinker)' }}
              >
                Weiter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
