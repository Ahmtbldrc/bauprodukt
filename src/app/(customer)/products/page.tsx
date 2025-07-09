import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tüm Ürünler</h1>
            <p className="text-gray-600 mt-2">En geniş ürün yelpazesini keşfedin</p>
          </div>
          
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Tüm Kategoriler</option>
              <option>İnşaat Malzemeleri</option>
              <option>Elektrik Malzemeleri</option>
              <option>Tesisat Malzemeleri</option>
            </select>
            
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
            
            <input 
              type="search" 
              placeholder="Ürün ara..."
              className="px-4 py-2 border border-gray-300 rounded-lg flex-1 min-w-[200px]"
            />
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
              <Link key={i} href={`/products/urun-${i}`}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Ürün {i}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Marka {(i % 4) + 1}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      Kategori {(i % 3) + 1}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      ₺{i * 89}
                    </p>
                    {i % 5 === 0 && (
                      <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        Stok Az
                      </span>
                    )}
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
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                1
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                2
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                3
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