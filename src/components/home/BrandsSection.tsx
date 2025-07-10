'use client'

import Link from 'next/link'
import { mockBrands } from '@/lib/mock-data'
import { generateBrandURL } from '@/lib/url-utils'

export function BrandsSection() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Marken</h2>
            <p className="text-gray-600">Entdecken Sie unsere vertrauenswürdigen und hochwertigen Marken</p>
          </div>
          <Link 
            href="/brands" 
            className="flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-80 border-2"
            style={{color: '#F39236', borderColor: '#F39236'}}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3923615')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span>Alle anzeigen</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {mockBrands.map((brand) => (
            <Link key={brand.id} href={generateBrandURL(brand.slug)}>
              <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4 transition-colors group-hover:bg-gray-100">
                  <span className="text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-800">
                    {brand.name}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-gray-800">
                  {brand.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {brand.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
        

      </div>
    </section>
  )
} 