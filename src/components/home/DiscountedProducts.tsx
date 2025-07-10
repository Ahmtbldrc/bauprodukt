import Link from 'next/link'
import { getDiscountedProducts } from '@/lib/mock-data'
import { generateProductURLFromObject, formatPrice, hasDiscount } from '@/lib/url-utils'

export function DiscountedProducts() {
  const products = getDiscountedProducts()

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reduzierte Produkte</h2>
            <p className="text-gray-600">Spezielle Angebote für ausgewählte Produkte</p>
          </div>
          <Link 
            href="/products?filter=sale" 
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Alle anzeigen
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={generateProductURLFromObject(product)}>
              <div className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                <div className="relative">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Produktbild</span>
                  </div>
                  
                  {/* Simple discount badge */}
                  {product.discountPercentage && (
                    <div className="absolute top-3 left-3">
                                             <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                         %{product.discountPercentage} Rabatt
                       </span>
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 leading-5">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-3">
                    {product.brand.name}
                  </p>
                  
                  {/* Clean price section */}
                  <div className="space-y-1 mb-4">
                    {product.originalPrice && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                                                 <span className="text-xs text-red-600 font-medium">
                           {formatPrice(product.originalPrice - product.price)} Ersparnis
                         </span>
                      </div>
                    )}
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                  </div>
                  
                  {/* Stock status */}
                  <div className="flex items-center justify-between">
                                         {!product.inStock ? (
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
          ))}
        </div>
      </div>
    </section>
  )
} 