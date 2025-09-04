'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCategoryBySlug } from '@/hooks'
import { useProducts } from '@/hooks/useProducts'
import { formatPrice } from '@/lib/url-utils'
import { notFound } from 'next/navigation'

interface CategoryPageContentProps {
  slug: string
}

export function CategoryPageContent({ slug }: CategoryPageContentProps) {
  const { data: category, isLoading: categoryLoading, error: categoryError, isFound } = useCategoryBySlug(slug)
  const [subCategories, setSubCategories] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [selectedSubId, setSelectedSubId] = useState<string>('')
  const searchParams = useSearchParams()

  // Load subcategories of the current category (if it's a main category)
  useEffect(() => {
    const loadChildren = async () => {
      if (!category?.id) return
      try {
        const res = await fetch(`/api/categories/${category.id}/children`)
        if (res.ok) {
          const json = await res.json()
          const children = (json.data || []).map((r: any) => ({
            id: r.category?.id,
            name: r.category?.name,
            slug: r.category?.slug
          })).filter((c: any) => c.id && c.name)
          setSubCategories(children)
        } else {
          setSubCategories([])
        }
      } catch {
        setSubCategories([])
      }
    }
    loadChildren()
  }, [category?.id])

  // Initialize selected subcategory from query param (?sub=<id>)
  useEffect(() => {
    const subParam = searchParams?.get('sub') || ''
    if (subParam) {
      setSelectedSubId(subParam)
    }
  }, [searchParams])
  
  // Compute category ids for product query
  const categoryIds = useMemo(() => {
    if (!category?.id) return [] as string[]
    if (selectedSubId) return [selectedSubId]
    if (subCategories.length > 0) return subCategories.map((s) => s.id)
    return [category.id]
  }, [category?.id, selectedSubId, subCategories])
  // Note: subcategories loaded server-side via category_parents children endpoint would be better;
  // here we fetch products for the selected category only, relying on product.category_id being subcategory in most cases.
  const { 
    data: productsResponse, 
    isLoading: productsLoading, 
    error: productsError 
  } = useProducts({
    page: 1,
    limit: 100,
    categories: categoryIds
  })

  const products = productsResponse?.data || []

  // Show loading state while category is loading
  if (categoryLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show 404 if category not found
  if (!categoryLoading && (!category || !isFound)) {
    notFound()
  }

  // Show error state
  if (categoryError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Kategorie konnte nicht geladen werden</h2>
            <p className="text-gray-600 mb-4">Beim Laden der Kategoriedaten ist ein Fehler aufgetreten.</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-700">Startseite</Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link href="/categories" className="text-gray-500 hover:text-gray-700">Kategorien</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900">{category?.name}</span>
      </nav>
      
      {/* Category Header */}
      <div className="mb-8">
        <div className="h-32 flex items-center justify-center transition-all rounded-lg mb-4" style={{background: 'linear-gradient(to bottom right, #F3923620, #F3923640)'}}>
          <span className="text-4xl" style={{color: '#F39236'}}>
            {category?.emoji || '🔧'}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {category?.name}
        </h1>
        <p className="text-gray-600">{category?.description}</p>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {subCategories.length > 0 && (
          <select
            value={selectedSubId}
            onChange={(e) => setSelectedSubId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Alle Unterkategorien</option>
            {subCategories.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        )}
        <select className="px-4 py-2 border border-gray-300 rounded-lg">
          <option>Alle Marken</option>
          <option>Bosch</option>
          <option>Makita</option>
          <option>DeWalt</option>
          <option>Karcher</option>
          <option>Hilti</option>
        </select>
        <select className="px-4 py-2 border border-gray-300 rounded-lg">
          <option>Preis sortieren</option>
          <option>Preis: aufsteigend</option>
          <option>Preis: absteigend</option>
        </select>
        <select className="px-4 py-2 border border-gray-300 rounded-lg">
          <option>Lagerstatus</option>
          <option>Auf Lager</option>
          <option>Nicht auf Lager</option>
        </select>
      </div>
      
      {/* Products */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {category?.name} Produkte ({products.length})
        </h2>
        
        {productsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {productsError && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Fehler beim Laden der Produkte.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        )}
        
        {!productsLoading && !productsError && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/${product.brand?.slug}/${product.category?.slug}/${product.slug}`}>
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative">
                  <div className="relative">
                    {/* Product Image */}
                    <div className="h-48 bg-white overflow-hidden">
                      {product.product_images && product.product_images.length > 0 ? (
                        <Image 
                          src={product.product_images[0].image_url} 
                          alt={product.name}
                          width={300}
                          height={192}
                          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Produktbild</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Divider Line */}
                    <div className="h-px bg-gray-200"></div>
                    
                    {/* Sale Badge - Top Right */}
                    {product.discount_price && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-xs rounded font-medium" style={{backgroundColor: '#F39236', color: '#F2F2F2'}}>
                          Sale
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    {/* Stock Status Icon */}
                    <div className="flex items-center mb-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center mr-2`} style={{
                        background: product.stock <= 0 ? '#E0BEBB' : product.stock <= 5 ? '#FFF0E2' : '#E9EDD0',
                        border: product.stock <= 0 ? '1px solid #A63F35' : product.stock <= 5 ? '1px solid #F39237' : '1px solid #AAB560',
                        borderRadius: '5px'
                      }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
                          color: product.stock <= 0 ? '#A63F35' : product.stock <= 5 ? '#F39237' : '#AAB560'
                        }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Product Name */}
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 h-12 text-sm">
                      {product.name}
                    </h3>
                    
                    {/* Category Description */}
                    <p className="text-xs text-gray-500 mb-3">
                      {product.category?.name}
                    </p>
                    
                    {/* Price */}
                    <div className="flex items-center gap-2">
                      {product.discount_price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                      <span className="text-lg font-bold" style={{color: '#F39236'}}>
                        {formatPrice(product.discount_price || product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!productsLoading && !productsError && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-semibold mb-2">In dieser Kategorie sind noch keine Produkte vorhanden</h3>
              <p className="text-gray-600">Bald werden Produkte zu dieser Kategorie hinzugefügt.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 