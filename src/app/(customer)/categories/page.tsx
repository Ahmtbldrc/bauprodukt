'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { useAllCategories } from '@/hooks/useCategories'
import { generateCategoryURL } from '@/lib/url-utils'

export default function CategoriesPage() {
  const { data: categoriesResponse, isLoading, error } = useAllCategories()

  const categories = categoriesResponse?.data || []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Kategorien</h1>
            <p className="text-gray-600 mt-2">
              {isLoading ? (
                'Kategorien werden geladen...'
              ) : error ? (
                'Fehler beim Laden der Kategorien'
              ) : (
                `Entdecken Sie unsere Produktkategorien (${categories.length} Kategorien)`
              )}
            </p>
          </div>
          
          {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-32 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-semibold mb-2">Kategorien konnten nicht geladen werden</h2>
                <p className="text-gray-600 mb-4">Beim Laden der Kategorien ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.</p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Seite neu laden
              </button>
            </div>
          )}

          {!isLoading && !error && categories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h2 className="text-xl font-semibold mb-2">Noch keine Kategorien vorhanden</h2>
                <p className="text-gray-600">Bald werden Kategorien hinzugefügt. Bitte schauen Sie später noch einmal vorbei.</p>
              </div>
            </div>
          )}
          
          {!isLoading && !error && categories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
              <Link key={category.id} href={generateCategoryURL(category.slug)}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                    <div className="h-32 flex items-center justify-center transition-all" style={{background: 'linear-gradient(to bottom right, #F3923620, #F3923640)'}}>
                      <div className="text-center">
                        {category.icon_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={category.icon_url} alt={category.name} className="h-10 w-10 inline" />
                        ) : (
                          <span className="text-4xl" style={{color: '#F39236'}}>
                            {category.emoji || '🔧'}
                          </span>
                        )}
                      </div>
                  </div>
                  <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 transition-colors group-hover:text-gray-800">
                      {category.name}
                    </h3>
                    <p className="text-gray-600">
                        {category.description || 'In dieser Kategorie finden Sie verschiedene Produkte.'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 