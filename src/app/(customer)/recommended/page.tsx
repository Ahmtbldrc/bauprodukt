'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useBrands } from '@/hooks/useBrands'
import { formatPrice } from '@/lib/url-utils'
import { ProductWithRelations } from '@/types/database'
import { Brand, Category } from '@/types/product'

export default function RecommendedProductsPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [sortBy, setSortBy] = useState('')

  // Fetch all data
  const { data: productsResponse, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts({
    limit: 100, // Get more products for recommendations
    search: search || undefined,
    category: selectedCategory || undefined,
    brand: selectedBrand || undefined
  })

  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories()
  const { data: brandsResponse, isLoading: brandsLoading } = useBrands()

  // Shuffle function to randomize products
  const shuffleArray = (array: ProductWithRelations[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Process products for recommendations (randomize them)
  let products: ProductWithRelations[] = (productsResponse?.data as ProductWithRelations[]) || []
  
  // Sort products if sortBy is selected
  if (sortBy === 'price_asc') {
    products = [...products].sort((a, b) => {
      const priceA = (a.discount_price ?? a.price)
      const priceB = (b.discount_price ?? b.price)
      return priceA - priceB
    }).slice(0, 4)
  } else if (sortBy === 'price_desc') {
    products = [...products].sort((a, b) => {
      const priceA = (a.discount_price ?? a.price)
      const priceB = (b.discount_price ?? b.price)
      return priceB - priceA
    }).slice(0, 4)
  } else {
    products = shuffleArray(products).slice(0, 4)
  }

  const hasDiscount = (product: ProductWithRelations) => {
    return product.discount_price !== null && product.discount_price < product.price
  }

  const generateProductURL = (product: ProductWithRelations) => {
    if (product.brand?.slug && product.category?.slug) {
      return `/${product.brand.slug}/${product.category.slug}/${product.slug}`
    }
    return `/products/${product.slug}`
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Unsere Empfehlungen für Sie</h1>
            <p className="text-gray-600 mt-2">Für Sie empfohlene Produkte ({products.length} Produkte)</p>
          </div>
          
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              disabled={categoriesLoading}
            >
              <option value="">Alle Kategorien</option>
              {categoriesResponse?.data?.map((category: Category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              disabled={brandsLoading}
            >
              <option value="">Alle Marken</option>
              {brandsResponse?.data?.map((brand: Brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Empfohlene Sortierung</option>
              <option value="price_asc">Preis: Aufsteigend</option>
              <option value="price_desc">Preis: Absteigend</option>
            </select>
            
            <input 
              type="search" 
              placeholder="In empfohlenen Produkten suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg flex-1 min-w-[200px]"
            />
          </div>
          
          {/* Recommendation Badge */}
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                ⭐ Empfohlen
              </span>
              <p className="text-gray-700">Speziell für Sie ausgewählte Produkte ({products.length} Produkte)</p>
            </div>
          </div>

          {/* Loading State */}
          {productsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {productsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Produkte konnten nicht geladen werden
              </h3>
              <p className="text-red-600 mb-4">
                Beim Laden der empfohlenen Produkte ist ein Fehler aufgetreten.
              </p>
              <button
                onClick={() => refetchProducts()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* No Products State */}
          {!productsLoading && !productsError && products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Keine Produkte entsprechen Ihren Kriterien.</p>
              <button
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('')
                  setSelectedBrand('')
                  setSortBy('')
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
          
          {/* Products Grid */}
          {!productsLoading && !productsError && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={generateProductURL(product)}>
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
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
                          <span className="text-gray-500 text-sm">Produktbild</span>
                        </div>
                      </div>
                      
                      {/* Divider Line */}
                      <div className="h-px bg-gray-200"></div>
                      
                      {/* Recommended Badge - Top Right */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-xs rounded font-medium" style={{backgroundColor: '#F39236', color: '#F2F2F2'}}>
                          Empfohlen
                        </span>
                      </div>
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
                      {product.category && (
                        <p className="text-xs text-gray-500 mb-3">
                          {product.category.name}
                        </p>
                      )}
                      
                      {/* Price */}
                      <div className="flex items-center gap-2">
                        {hasDiscount(product) && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                        <span className="text-lg font-bold" style={{color: '#F39236'}}>
                          {formatPrice(hasDiscount(product) ? product.discount_price! : product.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* No pagination needed for recommended products as it's curated list */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Diese Produkte wurden speziell für Sie ausgewählt. 
              <Link href="/products" className="text-blue-600 hover:underline ml-1">
                Alle Produkte anzeigen
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 