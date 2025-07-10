import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { getBrandBySlug, getProductsByBrand } from '@/lib/mock-data'
import { generateProductURLFromObject, formatPrice } from '@/lib/url-utils'
import { notFound } from 'next/navigation'

interface BrandPageProps {
  params: {
    slug: string
  }
}

export default function BrandPage({ params }: BrandPageProps) {
  const brand = getBrandBySlug(params.slug)
  
  if (!brand) {
    notFound()
  }

  const products = getProductsByBrand(params.slug)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Ana Sayfa</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/brands" className="text-gray-500 hover:text-gray-700">Markalar</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">{brand.name}</span>
          </nav>
          
          {/* Brand Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">{brand.name}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {brand.name}
                </h1>
                <p className="text-gray-600">{brand.description}</p>
              </div>
            </div>
          </div>
          
          {/* Products */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {brand.name} Ürünleri ({products.length})
            </h2>
            
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link key={product.id} href={generateProductURLFromObject(product)}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Ürün Görseli</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {product.category.name}
                        </p>
                        <p className="text-lg font-bold text-blue-600 mb-2">
                          {formatPrice(product.price)}
                        </p>
                        {!product.inStock && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            Stokta Yok
                          </span>
                        )}
                        {product.featured && (
                          <span className="inline-block ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Öne Çıkan
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Bu marka için henüz ürün bulunmamaktadır.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 