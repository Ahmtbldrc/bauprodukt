"use client"

import { useAllBrands } from '@/hooks/useBrands'
import Link from 'next/link'
import Image from 'next/image'

export default function BrandsPageContent() {
  const { data: brandsResponse, isLoading, error } = useAllBrands();
  const brands = brandsResponse?.data || [];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Marken</h1>
        <p className="text-gray-600 mt-2">Entdecken Sie unsere vertrauenswürdigen Marken ({brands.length} Marken)</p>
      </div>
      {isLoading && (
        <div className="text-center py-8 text-gray-500">Laden...</div>
      )}
      {error && (
        <div className="text-center py-8 text-red-600">Fehler beim Laden der Marken.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <Link key={brand.id} href={{ pathname: '/products', query: { brand: brand.id } }}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 relative rounded-lg flex items-center justify-center overflow-hidden ${brand.logo ? '' : 'bg-gray-200'}`}>
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">{brand.name}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{brand.name}</h3>
                  <p className="text-sm text-gray-600">{brand.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
} 