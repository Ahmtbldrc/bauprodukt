'use client'

import Link from 'next/link'
import { getBestsellerProducts } from '@/lib/mock-data'
import { generateProductURLFromObject, formatPrice, hasDiscount } from '@/lib/url-utils'

export function BestsellerProducts() {
  const products = getBestsellerProducts()

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Bestseller</h2>
            <p className="text-gray-600">Meistverkaufte und Kundenfavoriten</p>
          </div>
          <Link 
            href="/products?filter=bestsellers" 
            className="flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-80 border-2"
            style={{color: '#F39236', borderColor: '#F39236'}}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3923615')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span>Alle anzeigen</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <Link key={product.id} href={generateProductURLFromObject(product)}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative">
                <div className="relative">
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Produktbild</span>
                  </div>
                  
                  {/* Sale Badge */}
                  {hasDiscount(product) && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-semibold">
                        {product.discountPercentage}% RABATT
                      </span>
                    </div>
                  )}
                  
                  {/* Bestseller Label */}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded font-semibold">
                      BESTSELLER
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {product.brand.name}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    {product.category.name}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {hasDiscount(product) && product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                    <span className="text-lg font-bold" style={{color: '#F39236'}}>
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {!product.inStock ? (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          Nicht vorrätig
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Vorrätig
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
} 