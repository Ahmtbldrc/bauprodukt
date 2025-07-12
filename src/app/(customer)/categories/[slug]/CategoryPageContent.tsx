'use client'

import Link from 'next/link'
import { useCategoryBySlug, useProductsByCategory } from '@/hooks'
import { formatPrice } from '@/lib/url-utils'
import { notFound } from 'next/navigation'

interface CategoryPageContentProps {
  slug: string
}

export function CategoryPageContent({ slug }: CategoryPageContentProps) {
  const { data: category, isLoading: categoryLoading, error: categoryError, isFound } = useCategoryBySlug(slug)
  
  const { 
    data: productsResponse, 
    isLoading: productsLoading, 
    error: productsError 
  } = useProductsByCategory(category?.id || '', {
    page: 1,
    limit: 100
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
            <h2 className="text-xl font-semibold mb-2">Kategori Yüklenemedi</h2>
            <p className="text-gray-600 mb-4">Kategori bilgileri yüklenirken bir hata oluştu.</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-700">Ana Sayfa</Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link href="/categories" className="text-gray-500 hover:text-gray-700">Kategoriler</Link>
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
      <div className="mb-6 flex flex-wrap gap-4">
        <select className="px-4 py-2 border border-gray-300 rounded-lg">
          <option>Tüm Markalar</option>
          <option>Bosch</option>
          <option>Makita</option>
          <option>DeWalt</option>
          <option>Karcher</option>
          <option>Hilti</option>
        </select>
        
        <select className="px-4 py-2 border border-gray-300 rounded-lg">
          <option>Fiyat Sıralaması</option>
          <option>Düşükten Yükseğe</option>
          <option>Yüksekten Düşüğe</option>
        </select>
        
        <select className="px-4 py-2 border border-gray-300 rounded-lg">
          <option>Stok Durumu</option>
          <option>Stokta Var</option>
          <option>Stokta Yok</option>
        </select>
      </div>
      
      {/* Products */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {category?.name} Ürünleri ({products.length})
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
            <p className="text-red-600 mb-4">Ürünler yüklenirken hata oluştu.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        )}
        
        {!productsLoading && !productsError && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {product.product_images && product.product_images.length > 0 ? (
                      <img 
                        src={product.product_images[0].image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">Ürün Görseli</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {product.brand?.name || 'Marka Belirtilmemiş'}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      {product.discount_price ? (
                        <>
                          <p className="text-lg font-bold text-red-600">
                            {formatPrice(product.discount_price)}
                          </p>
                          <p className="text-sm text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-blue-600">
                          {formatPrice(product.price)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {product.stock <= 0 && (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          Stokta Yok
                        </span>
                      )}
                      {product.stock > 0 && product.stock <= 5 && (
                        <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Son {product.stock} Adet
                        </span>
                      )}
                      {product.discount_price && (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          İndirimli
                        </span>
                      )}
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
              <h3 className="text-lg font-semibold mb-2">Bu kategoride henüz ürün bulunmuyor</h3>
              <p className="text-gray-600">Yakında bu kategoriye ürünler eklenecek.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 