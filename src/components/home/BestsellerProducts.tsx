'use client'

import Link from 'next/link'
import { useProducts } from '@/hooks/useProducts'
import { formatPrice } from '@/lib/url-utils'
import { ProductWithRelations as DBProduct } from '@/types/database'
import { Product as UIProduct } from '@/types/product'

function mapDBProductToUIProduct(product: DBProduct): UIProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    price: product.price,
    originalPrice: product.discount_price ?? undefined,
    image: product.image_url ?? undefined,
    brand: product.brand && typeof product.brand === 'object' && 'id' in product.brand ? {
      id: product.brand?.id ?? '',
      name: product.brand?.name ?? '',
      slug: product.brand?.slug ?? '',
      description: undefined,
      logo: undefined,
    } : {
      id: '',
      name: '',
      slug: '',
      description: undefined,
      logo: undefined,
    },
    category: product.category && typeof product.category === 'object' && 'id' in product.category ? {
      id: product.category?.id ?? '',
      name: product.category?.name ?? '',
      slug: product.category?.slug ?? '',
      description: undefined,
      image: undefined,
      parent_id: undefined,
      emoji: undefined,
    } : {
      id: '',
      name: '',
      slug: '',
      description: undefined,
      image: undefined,
      parent_id: undefined,
      emoji: undefined,
    },
    inStock: typeof product.stock === 'number' ? product.stock > 0 : false,
    featured: false,
    bestseller: false,
    onSale: !!product.discount_price,
    discountPercentage: undefined,
  }
}

export function BestsellerProducts() {
  const { data: productsResponse, isLoading, error, refetch } = useProducts({ 
    limit: 50 // Fetch more products to have variety for random selection
  })

  // Shuffle function to randomize products
  const shuffleArray = (array: UIProduct[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Get random 4 products from API response
  const products = productsResponse?.data ? 
    shuffleArray((productsResponse.data as DBProduct[]).map(mapDBProductToUIProduct)).slice(0, 4) : 
    []

  const hasDiscount = (product: UIProduct) => {
    return product.originalPrice && product.originalPrice < product.price
  }

  const getDiscountPercentage = (product: UIProduct) => {
    if (!hasDiscount(product)) return 0
    const discount = ((product.price - (product.originalPrice ?? product.price)) / product.price) * 100
    return Math.round(discount)
  }

  const generateProductURL = (product: UIProduct) => {
    if (product.brand?.slug && product.category?.slug) {
      return `/${product.brand.slug}/${product.category.slug}/${product.slug}`
    }
    return `/products/${product.slug}`
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Bestseller</h2>
              <p className="text-gray-600">Meistverkaufte und Kundenfavoriten</p>
            </div>
          </div>
          
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
        </div>
      </section>
    )
  }

  // Error state
  if (error) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Bestseller</h2>
              <p className="text-gray-600">Meistverkaufte und Kundenfavoriten</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Bestseller-Produkte konnten nicht geladen werden
            </h3>
            <p className="text-red-600 mb-4">
              Beim Laden der Bestseller-Produkte ist ein Fehler aufgetreten.
            </p>
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

  // No products state
  if (!products || products.length === 0) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Bestseller</h2>
              <p className="text-gray-600">Meistverkaufte und Kundenfavoriten</p>
            </div>
          </div>
          
          <div className="text-center py-12">
            <p className="text-gray-500">Es sind noch keine Bestseller-Produkte vorhanden.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Bestseller</h2>
            <p className="text-gray-600">Meistverkaufte und Kundenfavoriten ({products.length} Produkte)</p>
          </div>
          <Link 
            href="/bestsellers" 
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
          {products.map((product: UIProduct) => (
            <Link key={product.id} href={generateProductURL(product)}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative">
                <div className="relative">
                  {/* Product Image */}
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${product.image ? 'hidden' : ''}`}>
                      <span className="text-gray-500 text-sm">Produktbild</span>
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded font-semibold">
                      BESTSELLER
                    </span>
                    {hasDiscount(product) && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-semibold">
                        {getDiscountPercentage(product)}% RABATT
                      </span>
                    )}
                    {/* product.inStock is used for stock status, but if you want to show low stock, you need to map stock value as well. For now, just show 'Auf Lager' or 'Nicht auf Lager' */}
                    {product.inStock ? (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Auf Lager
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        Nicht auf Lager
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
                    {product.name}
                  </h3>
                  {product.brand && (
                    <p className="text-sm text-gray-600 mb-1">
                      {product.brand.name}
                    </p>
                  )}
                  {product.category && (
                    <p className="text-xs text-gray-500 mb-3">
                      {product.category.name}
                    </p>
                  )}
                  {/* Stock code is not mapped, so skip this for now or add to UIProduct if needed */}
                  
                  <div className="flex items-center gap-2 mb-2">
                    {hasDiscount(product) && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.price)}
                      </span>
                    )}
                    <span className="text-lg font-bold" style={{color: '#F39236'}}>
                      {formatPrice(hasDiscount(product) ? product.originalPrice! : product.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {!product.inStock ? (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          Nicht auf Lager
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Auf Lager
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