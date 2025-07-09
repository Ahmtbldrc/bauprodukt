import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Ana Sayfa</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/categories" className="text-gray-500 hover:text-gray-700">Kategoriler</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 capitalize">{params.slug}</span>
          </nav>
          
          {/* Category Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 capitalize">
              {params.slug.replace('-', ' ')}
            </h1>
            <p className="text-gray-600">Bu kategorideki tüm ürünleri keşfedin</p>
          </div>
          
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Tüm Markalar</option>
              <option>Marka 1</option>
              <option>Marka 2</option>
              <option>Marka 3</option>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <Link key={i} href={`/products/urun-${i}`}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Ürün {i}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Marka {(i % 3) + 1}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      ₺{i * 120}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 