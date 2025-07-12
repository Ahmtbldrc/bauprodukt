'use client'

import Link from 'next/link'
import { useAllCategories } from '@/hooks/useCategories'
import { generateCategoryURL } from '@/lib/url-utils'

export function CategoriesSection() {
  const { data: categoriesResponse, isLoading, error } = useAllCategories()

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategorien</h2>
              <p className="text-gray-600">Entdecken Sie alle Kategorien, die Sie benötigen</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse flex flex-col h-64">
                <div className="h-32 bg-gray-200 flex items-center justify-center"></div>
                <div className="p-4 text-center flex-1 flex flex-col justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategorien</h2>
              <p className="text-gray-600">Entdecken Sie alle Kategorien, die Sie benötigen</p>
            </div>
          </div>
          
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Fehler beim Laden der Kategorien</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Nochmals versuchen
            </button>
          </div>
        </div>
      </section>
    )
  }

  const categories = categoriesResponse?.data || []

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
          {categories.slice(0, 5).map((category) => (
              <Link key={category.id} href={generateCategoryURL(category.slug)}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group flex flex-col h-64">
                  <div className="h-32 flex items-center justify-center transition-all" style={{background: 'linear-gradient(to bottom right, #F3923620, #F3923640)'}}>
                    <div className="text-center">
                      <span className="text-4xl" style={{color: '#F39236'}}>
                        {category.emoji || '🔧'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 text-center flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 transition-colors group-hover:text-gray-800">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                    <div className="text-sm font-medium" style={{color: '#F39236'}}>
                      Produkte entdecken
                    </div>
                  </div>
                </div>
              </Link>
          ))}
        </div>
      </div>
    </section>
  )
} 