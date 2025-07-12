"use client"
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
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
              let discountPercent = 0;
              if (typeof product.discount_price === 'number' && product.discount_price < product.price) {
                discountPercent = Math.round(((product.price - product.discount_price) / product.price) * 100);
              }
              return (
                <Link key={product.id} href={`/${product.brand?.slug || 'marke'}/${product.category?.slug || 'kategorie'}/${product.slug}`}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-96">
                    <div className="h-48 bg-gray-200 flex items-center justify-center relative flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-gray-500 text-sm">Produktbild</span>
                      )}
                      {typeof product.discount_price === 'number' && product.discount_price < product.price && (
                        <span className="absolute top-2 left-2 inline-block px-2 py-1 bg-red-500 text-white text-xs rounded">
                          %{discountPercent} RABATT
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1 justify-between">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {product.brand?.name}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {product.category?.name}
                      </p>
                      <div className="mb-2">
                        <p className="text-lg font-bold text-red-600">
                          {formatPrice(product.discount_price != null ? product.discount_price : product.price)}
                        </p>
                        {product.discount_price != null && (
                          <p className="text-sm text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {product.stock <= 0 && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            Nicht auf Lager
                          </span>
                        )}
                        {('featured' in product && product.featured) ? (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Vorgestellt
                          </span>
                        ) : null}
                        {('bestseller' in product && product.bestseller) ? (
                          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            Bestseller
                          </span>
                        ) : null}
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