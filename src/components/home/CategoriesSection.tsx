'use client'

import Link from 'next/link'
import { mockCategories, getProductsByCategory } from '@/lib/mock-data'
import { generateCategoryURL } from '@/lib/url-utils'

export function CategoriesSection() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategorien</h2>
            <p className="text-gray-600">Entdecken Sie alle Kategorien, die Sie benötigen</p>
          </div>
          <Link 
            href="/categories" 
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {mockCategories.map((category) => {
            const productCount = getProductsByCategory(category.slug).length
            return (
              <Link key={category.id} href={generateCategoryURL(category.slug)}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                  <div className="h-32 flex items-center justify-center transition-all" style={{background: 'linear-gradient(to bottom right, #F3923620, #F3923640)'}}>
                    <div className="text-center">
                      <span className="text-4xl" style={{color: '#F39236'}}>🔧</span>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-semibold text-gray-900 mb-2 transition-colors group-hover:text-gray-800">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="text-sm font-medium" style={{color: '#F39236'}}>
                      {productCount} Produkte
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        

      </div>
    </section>
  )
} 