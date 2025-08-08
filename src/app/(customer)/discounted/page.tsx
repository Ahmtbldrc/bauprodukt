"use client"
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { useProducts } from '@/hooks/useProducts'
import { useBrands } from '@/hooks/useBrands'
import { useCategories } from '@/hooks/useCategories'
import { formatPrice } from '@/lib/url-utils'
import { useState } from 'react'

export default function DiscountedProductsPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [sortBy, setSortBy] = useState('')

  // Fetch all data
  const { data: productsResponse, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts({
    limit: 100,
    search: search || undefined,
    category: selectedCategory || undefined,
    brand: selectedBrand || undefined
  })
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories()
  const { data: brandsResponse, isLoading: brandsLoading } = useBrands()

  let products = productsResponse?.data
    ? productsResponse.data.filter(
        (product) => (product.discount_price ?? product.price) < product.price && product.brand && product.category
      )
    : []
  // Optionally, sort by price
  if (sortBy === 'price_asc') {
    products = [...products].sort((a, b) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price))
  } else if (sortBy === 'price_desc') {
    products = [...products].sort((a, b) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price))
  }
  products = products.slice(0, 4)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Reduzierte Produkte</h1>
            <p className="text-gray-600 mt-2">Profitieren Sie von Sonderpreisen ({products.length} Produkte)</p>
          </div>
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">Alle Kategorien</option>
              {categoriesResponse?.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg" value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
              <option value="">Alle Marken</option>
              {brandsResponse?.data?.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="">Preis sortieren</option>
              <option value="price_asc">Preis: aufsteigend</option>
              <option value="price_desc">Preis: absteigend</option>
            </select>
            <input 
              type="search" 
              placeholder="In reduzierten Produkten suchen..."
              className="px-4 py-2 border border-gray-300 rounded-lg flex-1 min-w-[200px]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Sale Badge */}
          <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                🔥 Aktion
              </span>
              <p className="text-gray-700">Nur für kurze Zeit! Exklusive Angebote zu Sonderpreisen</p>
            </div>
          </div>
          {/* Loading state */}
          {(productsLoading || categoriesLoading || brandsLoading) && (
            <div className="text-center py-12 text-gray-500">Produkte werden geladen...</div>
          )}
          {/* Error state */}
          {productsError && (
            <div className="text-center py-12 text-red-600">
              Fehler beim Laden der Produkte. <button className="underline" onClick={() => refetchProducts()}>Erneut versuchen</button>
            </div>
          )}
          {/* Empty state */}
          {!productsLoading && !productsError && products.length === 0 && (
            <div className="text-center py-12 text-gray-500">Keine reduzierten Produkte gefunden.</div>
          )}
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              return (
                <Link key={product.id} href={`/${product.brand?.slug || 'marke'}/${product.category?.slug || 'kategorie'}/${product.slug}`}>
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative">
                    <div className="relative">
                      {/* Product Image */}
                      <div className="h-48 bg-white overflow-hidden">
                        {product.image_url ? (
                          <Image 
                            src={product.image_url} 
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
                      {typeof product.discount_price === 'number' && product.discount_price < product.price && (
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
                        {product.discount_price != null && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                        <span className="text-lg font-bold" style={{color: '#F39236'}}>
                          {formatPrice(product.discount_price != null ? product.discount_price : product.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          {/* Pagination (static, for demo) */}
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Zurück
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg">
                1
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                2
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Weiter
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 