"use client"

import Link from 'next/link'
import { useProducts } from '@/hooks/useProducts'
import { formatPrice } from '@/lib/url-utils'
import type { ProductWithRelations } from '@/types/database'

export function DiscountedProducts() {
  // Fetch products (get more to ensure we have at least 4 discounted)
  const { data: productsResponse, isLoading, error, refetch } = useProducts({ limit: 24 })

  // Defensive: cast to ProductWithRelations[] for downstream usage
  const products: ProductWithRelations[] = (productsResponse?.data as ProductWithRelations[]) || []
  const discountedProducts = products
    .filter((product) => product.discount_price !== null && product.discount_price < product.price && product.brand && product.category)
    .slice(0, 4)

  // Helper for product URL
  const generateProductURL = (product: ProductWithRelations) => {
    if (product.brand?.slug && product.category?.slug) {
      return `/${product.brand.slug}/${product.category.slug}/${product.slug}`
    }
    return `/products/${product.slug}`
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Reduzierte Produkte</h2>
              <p className="text-gray-600">Spezielle Angebote für ausgewählte Produkte</p>
            </div>
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 h-64 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Error state
  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Reduzierte Produkte</h2>
              <p className="text-gray-600">Spezielle Angebote für ausgewählte Produkte</p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Fehler beim Laden der Produkte</h3>
            <p className="text-red-600 mb-4">Beim Laden der reduzierten Produkte ist ein Fehler aufgetreten.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </section>
    )
  }

  // Empty state
  if (!discountedProducts || discountedProducts.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Reduzierte Produkte</h2>
              <p className="text-gray-600">Spezielle Angebote für ausgewählte Produkte</p>
            </div>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">Zurzeit sind keine reduzierten Produkte verfügbar.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reduzierte Produkte</h2>
            <p className="text-gray-600">Spezielle Angebote für ausgewählte Produkte</p>
          </div>
          <Link 
            href="/discounted" 
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Alle anzeigen
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {discountedProducts.map((product) => {
            const discountPercent = product.discount_price !== null ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0
            return (
              <Link key={product.id} href={generateProductURL(product)}>
                <div className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex flex-col h-[540px]">
                  <div className="relative w-full h-72 flex-shrink-0">
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.product_images && product.product_images.length > 0 ? (
                        <img
                          src={product.product_images[0].image_url}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          style={{ maxHeight: '260px', minHeight: '160px' }}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">Produktbild</span>
                      )}
                    </div>
                    {/* Discount badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        %{discountPercent} Rabatt
                      </span>
                    </div>
                  </div>
                  <div className="py-6 px-5 pb-8 flex flex-col flex-1 min-h-[240px] gap-3">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 leading-5 min-h-[40px]">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3 min-h-[20px]">
                      {product.brand?.name}
                    </p>
                    {/* Price section */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-xs text-red-600 font-medium">
                          {formatPrice(product.discount_price !== null ? product.price - product.discount_price : 0)} Ersparnis
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(product.discount_price !== null ? product.discount_price : product.price)}
                      </div>
                    </div>
                    {/* Stock status */}
                    <div className="flex items-center justify-between mt-0 mb-4">
                      {product.stock <= 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          Nicht auf Lager
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                          Auf Lager
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
} 