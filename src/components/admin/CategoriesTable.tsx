'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import { useCategories, useMainCategories } from '@/hooks/useCategories'
import { useAdminSearch } from '@/contexts/AdminSearchContext'
import { Edit, Trash2, Search, GripVertical, ChevronRight, ChevronDown } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

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
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(8)
  const { searchQuery } = useAdminSearch()
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [expandedParents, setExpandedParents] = useState<{ [key: string]: boolean }>({})
  const [childrenMap, setChildrenMap] = useState<{ [parentId: string]: { category_id: string; order_index: number; category: any }[] }>({})
  const [loadingChildren, setLoadingChildren] = useState<{ [key: string]: boolean }>({})
  const [childDrag, setChildDrag] = useState<{ parentId: string | null; categoryId: string | null }>({ parentId: null, categoryId: null })

  const { data: categoriesResponse, isLoading, error } = useCategories({
    page,
    limit,
    search: '', // API'de arama yapmıyoruz, client-side arama yapacağız
    category_type: categoryType,
  })
  // Full main categories list for global reordering (only used when categoryType === 'main')
  const { data: mainCatsResponse } = useMainCategories()
  const globalMain = useMemo(() => (mainCatsResponse?.data ?? []), [mainCatsResponse?.data])
  const [isChildDeleteOpen, setIsChildDeleteOpen] = useState(false)
  const [childToDelete, setChildToDelete] = useState<{ parentId: string; childId: string; name?: string } | null>(null)

  const saveNewOrder = async (newOrderIds: string[]) => {
    try {
      setIsSavingOrder(true)
      const orders = newOrderIds.map((id, index) => ({ id, order_index: index }))
      const res = await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Reihenfolge konnte nicht gespeichert werden')
      }
      toast.success('Reihenfolge gespeichert')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    } catch (e: any) {
      toast.error(e?.message || 'Sıralama kaydedilemedi')
    } finally {
      setIsSavingOrder(false)
    }
  }

  const handleDropReorder = async (targetId: string) => {
    if (!dragId || dragId === targetId || isSavingOrder) return
    // Build new global order using globalMain (already ordered by order_index)
    const current = globalMain.map((c: any) => c.id)
    const from = current.indexOf(dragId)
    const to = current.indexOf(targetId)
    if (from === -1 || to === -1) return
    const next = [...current]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setDragId(null)
    await saveNewOrder(next)
  }

  const toggleExpand = async (parentId: string) => {
    const next = { ...expandedParents, [parentId]: !expandedParents[parentId] }
    setExpandedParents(next)
    if (!next[parentId]) return
    if (childrenMap[parentId]) return
    setLoadingChildren((prev) => ({ ...prev, [parentId]: true }))
    try {
      const res = await fetch(`/api/categories/${parentId}/children`)
      if (!res.ok) throw new Error('Unterkategorien konnten nicht geladen werden')
      const json = await res.json()
      setChildrenMap((prev) => ({ ...prev, [parentId]: json.data || [] }))
    } catch {
      toast.error('Unterkategorien konnten nicht geladen werden')
    } finally {
      setLoadingChildren((prev) => ({ ...prev, [parentId]: false }))
    }
  }

  // Listen external updates to refresh children lists without full page reload
  useEffect(() => {
    const handler = () => {
      // Invalidate root categories
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      // Refresh any expanded parent's children list
      Object.keys(expandedParents).forEach(async (pid) => {
        if (expandedParents[pid]) {
          try {
            const res = await fetch(`/api/categories/${pid}/children`)
            if (res.ok) {
              const json = await res.json()
              setChildrenMap(prev => ({ ...prev, [pid]: json.data || [] }))
            }
          } catch {}
        }
      })
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('categories-updated', handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('categories-updated', handler as EventListener)
      }
    }
  }, [expandedParents, queryClient])

  const saveChildrenOrder = async (parentId: string, list: { category_id: string; order_index: number; category: any }[]) => {
    try {
      const body = list.map((item, index) => ({ category_id: item.category_id, order_index: index }))
      const res = await fetch(`/api/categories/${parentId}/children/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Reihenfolge der Unterkategorien konnte nicht gespeichert werden')
      }
      toast.success('Reihenfolge der Unterkategorien gespeichert')
    } catch (e: any) {
      toast.error(e?.message || 'Reihenfolge der Unterkategorien konnte nicht gespeichert werden')
    }
  }

  

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
                {categoryType === 'main' && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    
                  </th>
                )}
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
                  <td colSpan={categoryType === 'sub' ? 5 : 7} className="px-6 py-12 text-center text-gray-500">
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
                  <Fragment key={category.id}>
                  <tr
                    className={`hover:bg-gray-50 ${categoryType === 'main' ? 'cursor-move' : ''}`}
                    draggable={categoryType === 'main' && !isSavingOrder}
                    onDragStart={() => { if (categoryType === 'main') setDragId(category.id) }}
                    onDragOver={(e) => { if (categoryType === 'main') e.preventDefault() }}
                    onDrop={async () => { if (categoryType === 'main') await handleDropReorder(category.id) }}
                    onDragEnd={() => setDragId(null)}
                  >
                    {categoryType === 'main' && (
                      <td className="px-3 py-4 whitespace-nowrap align-middle">
                        <button
                          type="button"
                          aria-label={expandedParents[category.id] ? 'Unterkategorien ausblenden' : 'Unterkategorien anzeigen'}
                          className="text-gray-500 hover:text-gray-700 mr-1"
                          onClick={(e) => { e.stopPropagation(); toggleExpand(category.id) }}
                          title="Unterkategorien anzeigen/ausblenden"
                        >
                          {expandedParents[category.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <GripVertical className="h-4 w-4 inline text-gray-400 ml-1" />
                      </td>
                    )}
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
                  {categoryType === 'main' && expandedParents[category.id] && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50">
                        <div className="p-3">
                          {loadingChildren[category.id] ? (
                            <div className="text-sm text-gray-500">Wird geladen...</div>
                          ) : (
                            <div className="space-y-1">
                              {(childrenMap[category.id] || []).map((child, idx) => (
                                <div
                                  key={child.category_id}
                                  className="flex items-center justify-between bg-white border rounded px-3 py-2"
                                  draggable={!isSavingOrder}
                                  onDragStart={() => setChildDrag({ parentId: category.id, categoryId: child.category_id })}
                                  onDragOver={(e) => { e.preventDefault() }}
                                  onDrop={async () => {
                                    if (!childDrag.parentId || childDrag.parentId !== category.id) return
                                    if (!childDrag.categoryId || childDrag.categoryId === child.category_id) return
                                    const list = [...(childrenMap[category.id] || [])]
                                    const from = list.findIndex(i => i.category_id === childDrag.categoryId)
                                    const to = list.findIndex(i => i.category_id === child.category_id)
                                    if (from === -1 || to === -1) return
                                    const [moved] = list.splice(from, 1)
                                    list.splice(to, 0, moved)
                                    setChildrenMap(prev => ({ ...prev, [category.id]: list }))
                                    setChildDrag({ parentId: null, categoryId: null })
                                    await saveChildrenOrder(category.id, list)
                                  }}
                                  onDragEnd={() => setChildDrag({ parentId: null, categoryId: null })}
                                  style={{ cursor: 'move' }}
                                >
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-800">{idx + 1}. {child.category?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">{child.category?.slug}</span>
                                    <button
                                      className="p-1 rounded hover:bg-red-50 text-red-600"
                                      title="Unterkategorie entfernen"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setChildToDelete({ parentId: category.id, childId: child.category_id, name: child.category?.name })
                                        setIsChildDeleteOpen(true)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {(!childrenMap[category.id] || childrenMap[category.id].length === 0) && (
                                <div className="text-sm text-gray-500">Dieser Hauptkategorie sind keine Unterkategorien zugeordnet.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
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
      {isChildDeleteOpen && childToDelete && (
        <ConfirmDialog
          isOpen={isChildDeleteOpen}
          onClose={() => setIsChildDeleteOpen(false)}
          onConfirm={async () => {
            if (!childToDelete) return
            try {
              const res = await fetch(`/api/categories/${childToDelete.parentId}/children/${childToDelete.childId}`, { method: 'DELETE' })
              if (!res.ok) throw new Error('Entfernen fehlgeschlagen')
              setChildrenMap(prev => ({
                ...prev,
                [childToDelete.parentId]: (prev[childToDelete.parentId] || []).filter(c => c.category_id !== childToDelete.childId)
              }))
              toast.success('Unterkategorie wurde entfernt')
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('categories-updated'))
              }
            } catch (e: any) {
              toast.error(e?.message || 'Unterkategorie konnte nicht entfernt werden')
            } finally {
              setIsChildDeleteOpen(false)
              setChildToDelete(null)
            }
          }}
          title="Unterkategorie entfernen?"
          message={`"${childToDelete.name || ''}" wird aus dieser Hauptkategorie entfernt.`}
          confirmText="Entfernen"
          cancelText="Abbrechen"
          isLoading={false}
          variant="danger"
        />
      )}
    </div>
  )
} 

// Confirm dialog for removing child relation
export function CategoriesTableConfirmDialogs() {
  return null
}
