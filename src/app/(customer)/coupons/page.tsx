import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { getCouponProducts, mockBrands, mockCategories } from '@/lib/mock-data'
import { generateProductURLFromObject, formatPrice } from '@/lib/url-utils'

export default function CouponProductsPage() {
  // Get products that can be used with coupons
  const products = getCouponProducts()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Kuponlu Ürünler</h1>
            <p className="text-gray-600 mt-2">Kupon kodlarınızla ekstra indirim kazanın ({products.length} ürün)</p>
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
              <option>Kupon Türü</option>
              <option>%10 İndirim Kuponu</option>
              <option>%15 İndirim Kuponu</option>
              <option>%20 İndirim Kuponu</option>
              <option>Ücretsiz Kargo</option>
            </select>
            
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Fiyat Sıralaması</option>
              <option>Düşükten Yükseğe</option>
              <option>Yüksekten Düşüğe</option>
            </select>
            
            <input 
              type="search" 
              placeholder="Kuponlu ürünlerde ara..."
              className="px-4 py-2 border border-gray-300 rounded-lg flex-1 min-w-[200px]"
            />
          </div>
          
          {/* Coupon Info */}
          <div className="mb-6 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                🎟️ Kupon Fırsatı
              </span>
              <p className="text-gray-700">Bu ürünlerde kupon kodlarınızı kullanarak ekstra indirim kazanın!</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">YENI10</code>
                <p className="text-xs text-gray-600 mt-1">Yeni müşterilere %10 indirim</p>
              </div>
              <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">KARGO</code>
                <p className="text-xs text-gray-600 mt-1">500₺ üzeri ücretsiz kargo</p>
              </div>
              <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">MEGA20</code>
                <p className="text-xs text-gray-600 mt-1">2000₺ üzeri %20 indirim</p>
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={generateProductURLFromObject(product)}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                    <span className="text-gray-500 text-sm">Ürün Görseli</span>
                    <span className="absolute top-2 left-2 inline-block px-2 py-1 bg-green-500 text-white text-xs rounded">
                      KUPON GEÇERLİ
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
                    <div className="mb-2">
                      <p className="text-xs text-green-600 font-medium">
                        🎟️ Kupon kodlarınızla ekstra indirim!
                      </p>
                    </div>
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
          
          {/* Pagination */}
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Önceki
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg">
                1
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                2
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Sonraki
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 