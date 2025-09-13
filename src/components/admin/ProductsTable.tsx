'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatPriceAdmin } from '@/lib/url-utils'
import { useProducts } from '@/hooks/useProducts'
import { useAdminSearch } from '@/contexts/AdminSearchContext'
import { Edit, Trash2, Eye, Search, ArrowUpDown, ArrowUp, ArrowDown, Copy } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import Image from 'next/image'
import Link from 'next/link'

interface ProductsTableProps {
  onDeleteProduct?: (productId: string) => Promise<void> | void
}

export function ProductsTable({ onDeleteProduct }: ProductsTableProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(8)
  const { searchQuery, productFilters } = useAdminSearch()
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null)
  const [selectedDeleteName, setSelectedDeleteName] = useState<string | null>(null)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)

  type SortKey = 'name' | 'brand' | 'category' | 'price' | 'stock' | 'date'
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')


  const { data: productsResponse, isLoading, error, refetch } = useProducts({
    page,
    limit,
    search: debouncedSearch || undefined,
    brand: productFilters.brandId || undefined,
    category: productFilters.categoryId || undefined,
    sortBy: sortKey || undefined,
    sortOrder
  })

  const allProducts = useMemo(() => {
    return productsResponse?.data ?? []
  }, [productsResponse?.data])
  const pagination = productsResponse?.pagination

  // Debug için log ekleyelim
  console.log('Products Response:', productsResponse)
  console.log('All Products:', allProducts)
  console.log('Pagination:', pagination)

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // Arama değiştiğinde ilk sayfaya dön
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Ensure fresh data on mount and when window regains focus (e.g., navigating back)
  useEffect(() => {
    refetch()
    const onFocus = () => refetch()
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refetch()
      }
    }
    const onPageShow = () => refetch()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('focus', onFocus)
  }, [refetch])

  // Reset pagination on brand/category filter change
  useEffect(() => {
    setPage(1)
  }, [productFilters.brandId, productFilters.categoryId])

  const getEffectivePrice = (product: any) => {
    if (typeof product?.discount_price === 'number' && !Number.isNaN(product.discount_price)) return product.discount_price
    return typeof product?.price === 'number' ? product.price : 0
  }

  const getComparableValue = (product: any, key: SortKey): string | number => {
    switch (key) {
      case 'name':
        return (product?.name ?? '').toString().toLowerCase()
      case 'brand':
        return (product?.brand?.name ?? '').toString().toLowerCase()
      case 'category':
        return (product?.category?.name ?? '').toString().toLowerCase()
      case 'price':
        return getEffectivePrice(product)
      case 'stock':
        return typeof product?.stock === 'number' ? product.stock : 0
      case 'date': {
        const ts = new Date(product?.created_at ?? 0).getTime()
        return Number.isFinite(ts) ? ts : 0
      }
    }
  }

 

  const sortedAllProducts = useMemo(() => {
    if (!sortKey) return allProducts
    const direction = sortOrder === 'asc' ? 1 : -1
    return [...allProducts].sort((a, b) => {
      const va = getComparableValue(a, sortKey)
      const vb = getComparableValue(b, sortKey)
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * direction
      }
      return va.toString().localeCompare(vb.toString()) * direction
    })
  }, [allProducts, sortKey, sortOrder])

  // API'den gelen tüm ürün sayısına göre pagination
  const totalProducts = pagination?.total || 0
  const totalPages = Math.ceil(totalProducts / limit)
  
  // API pagination ve filtre toplamları server-side hesaplanır
  const products = sortedAllProducts
  const totalFiltered = totalProducts
  const displayTotalPages = totalPages

  // Debug için log ekleyelim
  console.log('=== DEBUG INFO ===')
  console.log('Products Response:', productsResponse)
  console.log('Pagination Object:', pagination)
  console.log('API Total Products:', pagination?.total)
  console.log('API Total Pages:', pagination?.totalPages)
  console.log('All Products Length:', allProducts.length)
  console.log('Total Filtered:', totalFiltered)
  console.log('Total Products for Pagination:', totalProducts)
  console.log('Calculated Total Pages:', totalPages)
  console.log('Current Page:', page)
  console.log('Current Limit:', limit)
  console.log('Is Search Active:', !!debouncedSearch)
  console.log('Filter Brand:', productFilters.brandId)
  console.log('Filter Category:', productFilters.categoryId)
  console.log('Sort Key:', sortKey)
  console.log('Sort Order:', sortOrder)
  console.log('Display Total Pages:', displayTotalPages)
  console.log('==================')



  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const formatPrice = (price: number) => formatPriceAdmin(price)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH')
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const HeaderButton = ({ label, active, order }: { label: string; active: boolean; order: 'asc' | 'desc' }) => (
    <div className="inline-flex items-center gap-1 select-none">
      <span>{label}</span>
      {active ? (
        order === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 text-gray-400" />
      )}
    </div>
  )

  const handleDuplicate = async (productId: string) => {
    try {
      setDuplicatingId(productId)
      const res = await fetch(`/api/products/${productId}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Kopyalama başarısız')
      }
      await refetch()
    } catch (e: any) {
      alert(e?.message || 'Ürün kopyalanırken bir hata oluştu')
    } finally {
      setDuplicatingId(null)
    }
  }

  const openDeleteModal = (productId: string, productName: string) => {
    setSelectedDeleteId(productId)
    setSelectedDeleteName(productName)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedDeleteId) return
    try {
      setIsDeleteLoading(true)
      setDeletingId(selectedDeleteId)
      const result = onDeleteProduct?.(selectedDeleteId)
      if (result && typeof (result as any).then === 'function') {
        await (result as Promise<void>)
      }
      setDeleteModalOpen(false)
      setSelectedDeleteId(null)
      setSelectedDeleteName(null)
      await refetch()
    } catch (e: any) {
      alert(e?.message || 'Ürün silinirken bir hata oluştu')
    } finally {
      setIsDeleteLoading(false)
      setDeletingId(null)
    }
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
        <p className="text-red-800">Fehler beim Laden der Produkte: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">


      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">


        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <HeaderButton label="Produkt" active={sortKey === 'name'} order={sortOrder} />
                </th>
                <th
                  onClick={() => handleSort('brand')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <HeaderButton label="Marke" active={sortKey === 'brand'} order={sortOrder} />
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <HeaderButton label="Kategorie" active={sortKey === 'category'} order={sortOrder} />
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <HeaderButton label="Preis" active={sortKey === 'price'} order={sortOrder} />
                </th>
                <th
                  onClick={() => handleSort('stock')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <HeaderButton label="Lagerbestand" active={sortKey === 'stock'} order={sortOrder} />
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <HeaderButton label="Datum" active={sortKey === 'date'} order={sortOrder} />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <p>
                        {debouncedSearch ? 'Keine Produkte gefunden, die Ihren Suchkriterien entsprechen' : 'Noch keine Produkte vorhanden'}
                      </p>
                      {debouncedSearch && (
                        <p className="text-sm text-gray-500">Versuchen Sie, Ihre Suchkriterien zu ändern</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 relative">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Resim</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                                                     <div className="text-sm text-gray-500">
                             {product.stock_code || 'Kein Code'}
                           </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.brand?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.category?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.discount_price ? (
                          <div>
                            <span className="line-through text-gray-400">
                              {formatPrice(product.price)}
                            </span>
                            <br />
                            <span className="font-medium" style={{ color: '#F39237' }}>
                              {formatPrice(product.discount_price)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium" style={{ color: '#F39237' }}>{formatPrice(product.price)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full" style={{
                          backgroundColor: product.stock > 10 
                            ? '#E9EDD0' 
                            : product.stock > 0 
                            ? '#FFF0E2' 
                            : '#E0BEBB',
                          color: product.stock > 10 
                            ? '#AAB560' 
                            : product.stock > 0 
                            ? '#F39237' 
                            : '#A63F35'
                        }}>
                          {product.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const status = (product as any).status || 'active'
                        const isActive = status === 'active'
                        const bg = isActive ? '#E6F6EA' : '#FDE2E1'
                        const fg = isActive ? '#15803D' : '#B91C1C'
                        const label = isActive ? 'Aktiv' : 'Passiv'
                        return (
                          <span
                            className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full"
                            style={{ backgroundColor: bg, color: fg }}
                          >
                            {label}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={product.brand && product.category ? `/${product.brand.slug}/${product.category.slug}/${product.slug}` : '#'}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Anzeigen"
                          target="_blank"
                          onClick={(e) => {
                            if (!product.brand || !product.category) {
                              e.preventDefault()
                              alert('Marka veya kategori bilgisi eksik')
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(product.id)}
                          className={`p-1 rounded ${duplicatingId === product.id ? 'opacity-60 cursor-wait' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
                          title={duplicatingId === product.id ? 'Kopyalanıyor...' : 'Kopyala'}
                          disabled={duplicatingId === product.id}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                          title="Bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(product.id, product.name)}
                          className={`p-1 rounded ${deletingId === product.id ? 'opacity-60 cursor-wait' : 'text-red-600 hover:text-red-900 hover:bg-red-50'}`}
                          title={deletingId === product.id ? 'Wird gelöscht...' : 'Löschen'}
                          disabled={deletingId === product.id}
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
                  {totalFiltered > 0 ? ((page - 1) * limit) + 1 : 0} - {Math.min(page * limit, totalFiltered)} / {totalFiltered} Produkte
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => {
          if (isDeleteLoading) return
          setDeleteModalOpen(false)
          setSelectedDeleteId(null)
          setSelectedDeleteName(null)
        }}
        onConfirm={confirmDelete}
        title="Produkt löschen"
        message={`Sind Sie sicher, dass Sie das Produkt "${selectedDeleteName || ''}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Ja, löschen"
        cancelText="Abbrechen"
        isLoading={isDeleteLoading}
        variant="danger"
      />
    </div>
  )
}
