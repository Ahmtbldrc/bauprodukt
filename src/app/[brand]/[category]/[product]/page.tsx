import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

interface DynamicProductPageProps {
  params: {
    brand: string
    category: string
    product: string
  }
}

export default function DynamicProductPage({ params }: DynamicProductPageProps) {
  const { brand, category, product } = params
  
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
            <Link href={`/brands/${brand}`} className="text-gray-500 hover:text-gray-700 capitalize">
              {brand.replace('-', ' ')}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href={`/categories/${category}`} className="text-gray-500 hover:text-gray-700 capitalize">
              {category.replace('-', ' ')}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 capitalize">{product.replace('-', ' ')}</span>
          </nav>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Product Images */}
            <div>
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded cursor-pointer"></div>
                ))}
              </div>
            </div>
            
            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4 capitalize">
                {product.replace('-', ' ')}
              </h1>
              
              <div className="mb-4">
                <Link href={`/brands/${brand}`} className="text-blue-600 hover:underline capitalize">
                  {brand.replace('-', ' ')}
                </Link>
                <span className="mx-2 text-gray-400">•</span>
                <Link href={`/categories/${category}`} className="text-blue-600 hover:underline capitalize">
                  {category.replace('-', ' ')}
                </Link>
              </div>
              
              <p className="text-3xl font-bold text-blue-600 mb-6">₺2,499</p>
              
              <div className="mb-6">
                <p className="text-gray-600 leading-relaxed">
                  {brand.replace('-', ' ')} markasının {category.replace('-', ' ')} kategorisindeki 
                  bu ürün, yüksek kalitesi ve dayanıklılığı ile öne çıkıyor. Modern tasarımı ve 
                  işlevselliği bir arada sunuyor.
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
                <p className="text-green-700 font-semibold flex items-center">
                  <span className="mr-2">✓</span>
                  Stokta mevcut - Hemen kargo
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Bugün sipariş verirseniz yarın kargoda
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Sepete Ekle
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
                  Bu ürün, {brand.replace('-', ' ')} markasının en yeni teknolojileri ile üretilmiştir. 
                  {category.replace('-', ' ')} kategorisinde lider konumda olan bu ürün, 
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {brand.replace('-', ' ')} - Diğer Ürünler
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Link key={i} href={`/${brand}/diger-kategori/diger-urun-${i}`}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Diğer Ürün {i}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 capitalize">
                        {brand.replace('-', ' ')}
                      </p>
                      <p className="text-lg font-bold text-blue-600">₺{1999 + i * 200}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 