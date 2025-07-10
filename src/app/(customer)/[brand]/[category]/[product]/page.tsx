import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { getProductByBrandCategorySlug, getProductsByBrand } from '@/lib/mock-data'
import { generateProductURLFromObject, formatPrice, generateBrandURL, generateCategoryURL } from '@/lib/url-utils'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface DynamicProductPageProps {
  params: {
    brand: string
    category: string
    product: string
  }
}

export async function generateMetadata({ params }: DynamicProductPageProps): Promise<Metadata> {
  const product = getProductByBrandCategorySlug(params.brand, params.category, params.product)
  
  if (!product) {
    return {
      title: 'Ürün Bulunamadı'
    }
  }

  const canonicalURL = `/${params.brand}/${params.category}/${params.product}`
  
  return {
    title: `${product.name} - ${product.brand.name} | Bauprodukt Demo`,
    description: product.description,
    alternates: {
      canonical: canonicalURL
    },
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'website',
      url: canonicalURL
    }
  }
}

export default function DynamicProductPage({ params }: DynamicProductPageProps) {
  const product = getProductByBrandCategorySlug(params.brand, params.category, params.product)
  
  if (!product) {
    notFound()
  }

  // Get related products from same brand (excluding current product)
  const relatedProducts = getProductsByBrand(params.brand)
    .filter(p => p.id !== product.id)
    .slice(0, 4)
  
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
            <Link href={generateBrandURL(product.brand.slug)} className="text-gray-500 hover:text-gray-700">
              {product.brand.name}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href={generateCategoryURL(product.category.slug)} className="text-gray-500 hover:text-gray-700">
              {product.category.name}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Product Images */}
            <div>
              <div className="aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500">Ana Ürün Görseli</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded cursor-pointer flex items-center justify-center">
                    <span className="text-xs text-gray-400">{i}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              <div className="mb-4">
                <Link href={generateBrandURL(product.brand.slug)} className="text-blue-600 hover:underline">
                  {product.brand.name}
                </Link>
                <span className="mx-2 text-gray-400">•</span>
                <Link href={generateCategoryURL(product.category.slug)} className="text-blue-600 hover:underline">
                  {product.category.name}
                </Link>
              </div>
              
              <p className="text-3xl font-bold text-blue-600 mb-6">{formatPrice(product.price)}</p>
              
              <div className="mb-6">
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Teknik Özellikler:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Premium kalite malzeme</li>
                  <li>Uzun ömürlü tasarım</li>
                  <li>Kolay kurulum</li>
                  <li>2 yıl garanti</li>
                  <li>CE sertifikası</li>
                </ul>
              </div>
              
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                {product.inStock ? (
                  <>
                    <p className="text-green-700 font-semibold flex items-center">
                      <span className="mr-2">✓</span>
                      Stokta mevcut - Hemen kargo
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Bugün sipariş verirseniz yarın kargoda
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-red-700 font-semibold flex items-center">
                      <span className="mr-2">✗</span>
                      Stokta yok
                    </p>
                    <p className="text-red-600 text-sm mt-1">
                      Tedarikçi ile iletişime geçiyoruz
                    </p>
                  </>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button 
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    product.inStock 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!product.inStock}
                >
                  {product.inStock ? 'Sepete Ekle' : 'Stokta Yok'}
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  ♡ Favorilere Ekle
                </button>
              </div>
            </div>
          </div>
          
          {/* Product Tabs */}
          <div className="mb-12">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button className="border-b-2 border-blue-600 text-blue-600 py-2 px-1 text-sm font-medium">
                  Ürün Detayları
                </button>
                <button className="text-gray-500 hover:text-gray-700 py-2 px-1 text-sm font-medium">
                  Teknik Özellikler
                </button>
                <button className="text-gray-500 hover:text-gray-700 py-2 px-1 text-sm font-medium">
                  Yorumlar
                </button>
              </nav>
            </div>
            
            <div className="py-6">
              <div className="prose max-w-none">
                <h3>Ürün Açıklaması</h3>
                <p>
                  Bu ürün, {product.brand.name} markasının en yeni teknolojileri ile üretilmiştir. 
                  {product.category.name} kategorisinde lider konumda olan bu ürün, 
                  kullanıcı deneyimini ön planda tutarak tasarlanmıştır.
                </p>
                
                <h4>Kullanım Alanları</h4>
                <ul>
                  <li>Profesyonel kullanım</li>
                  <li>Ev ve ofis uygulamaları</li>
                  <li>Endüstriyel projeler</li>
                  <li>Dekoratif amaçlar</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {product.brand.name} - Diğer Ürünler
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Link key={relatedProduct.id} href={generateProductURLFromObject(relatedProduct)}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Ürün Görseli</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {relatedProduct.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {relatedProduct.category.name}
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatPrice(relatedProduct.price)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 