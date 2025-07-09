import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Ana Sayfa</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/products" className="text-gray-500 hover:text-gray-700">Ürünler</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 capitalize">{params.slug}</span>
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
                {params.slug.replace('-', ' ')}
              </h1>
              
              <div className="mb-4">
                <Link href="/brands/marka-1" className="text-blue-600 hover:underline">
                  Marka 1
                </Link>
                <span className="mx-2 text-gray-400">•</span>
                <Link href="/categories/kategori-1" className="text-blue-600 hover:underline">
                  Kategori 1
                </Link>
              </div>
              
              <p className="text-3xl font-bold text-blue-600 mb-6">₺1,299</p>
              
              <div className="mb-6">
                <p className="text-gray-600 leading-relaxed">
                  Bu ürün hakkında detaylı açıklama buraya gelecek. Ürünün özellikleri, 
                  kullanım alanları ve avantajları hakkında bilgiler yer alacak.
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Özellikler:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Yüksek kalite malzeme</li>
                  <li>Dayanıklı yapı</li>
                  <li>Kolay montaj</li>
                  <li>Garanti kapsamında</li>
                </ul>
              </div>
              
              <div className="mb-6">
                <p className="text-green-600 font-semibold">✓ Stokta var</p>
                <p className="text-gray-600 text-sm">Kargo: 1-3 iş günü</p>
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
          
          {/* Related Products */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Benzer Ürünler</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Link key={i} href={`/products/benzer-urun-${i}`}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Benzer Ürün {i}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">Marka 1</p>
                      <p className="text-lg font-bold text-blue-600">₺{999 + i * 100}</p>
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