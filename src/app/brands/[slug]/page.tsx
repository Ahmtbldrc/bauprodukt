import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

interface BrandPageProps {
  params: {
    slug: string
  }
}

export default function BrandPage({ params }: BrandPageProps) {
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
            <span className="text-gray-900 capitalize">{params.slug}</span>
          </nav>
          
          {/* Brand Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 capitalize">
                  {params.slug.replace('-', ' ')}
                </h1>
                <p className="text-gray-600">Marka açıklaması ve bilgileri</p>
              </div>
            </div>
          </div>
          
          {/* Products */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ürünler</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Link key={i} href={`/products/urun-${i}`}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Ürün {i}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Ürün açıklaması...
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        ₺{i * 150}
                      </p>
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