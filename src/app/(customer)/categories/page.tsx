import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

export default function CategoriesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Kategoriler</h1>
            <p className="text-gray-600 mt-2">Tüm kategorilerimizi keşfedin</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'İnşaat Malzemeleri',
              'Elektrik Malzemeleri', 
              'Tesisat Malzemeleri',
              'Bahçe ve Peyzaj',
              'Güvenlik Sistemleri',
              'Isıtma ve Soğutma'
            ].map((category, i) => (
              <Link key={i} href={`/categories/kategori-${i + 1}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {category}
                  </h3>
                  <p className="text-gray-600">
                    {(i + 1) * 25} ürün
                  </p>
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