import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { getRecommendedProducts, mockBrands, mockCategories } from '@/lib/mock-data'
import { generateProductURLFromObject, formatPrice } from '@/lib/url-utils'

export default function RecommendedProductsPage() {
  // Get recommended products
  const products = getRecommendedProducts()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Senin İçin Seçtiklerimiz</h1>
            <p className="text-gray-600 mt-2">Size özel önerilen ürünler ({products.length} ürün)</p>
          </div>
          
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Tüm Kategoriler</option>
              {mockCategories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Tüm Markalar</option>
              {mockBrands.map((brand) => (
                <option key={brand.id} value={brand.slug}>
                  {brand.name}
                </option>
              ))}
            </select>
            
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Fiyat Sıralaması</option>
              <option>Düşükten Yükseğe</option>
              <option>Yüksekten Düşüğe</option>
            </select>
            
            <input 
              type="search" 
              placeholder="Önerilen ürünlerde ara..."
              className="px-4 py-2 border border-gray-300 rounded-lg flex-1 min-w-[200px]"
            />
          </div>
          
          {/* Recommendation Badge */}
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                ⭐ Önerilen
              </span>
              <p className="text-gray-700">Alışveriş geçmişinize ve tercihlerinize göre seçilmiş ürünler</p>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={generateProductURLFromObject(product)}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                    <span className="text-gray-500 text-sm">Ürün Görseli</span>
                    <span className="absolute top-2 left-2 inline-block px-2 py-1 bg-orange-500 text-white text-xs rounded">
                      ÖNERİLEN
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {product.brand.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {product.category.name}
                    </p>
                    <p className="text-lg font-bold text-blue-600 mb-2">
                      {formatPrice(product.price)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {!product.inStock && (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          Stokta Yok
                        </span>
                      )}
                      {product.featured && (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Öne Çıkan
                        </span>
                      )}
                      {product.bestseller && (
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          Bestseller
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* No pagination needed for recommended products as it's curated list */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Bu ürünler sizin için özel olarak seçilmiştir. 
              <Link href="/products" className="text-blue-600 hover:underline ml-1">
                Tüm ürünleri görüntüle
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 