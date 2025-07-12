'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFavorites } from '@/contexts/FavoritesContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Heart, ArrowLeft, Trash2, ShoppingBag } from 'lucide-react'
import { formatPrice } from '@/lib/url-utils'
import { ConfirmDialog } from '@/components/ui'
import { FavoriteProductCard } from '@/components/favorites/FavoriteProductCard'

export default function FavoritesPage() {
  const { favorites, isLoading: favoritesLoading, error, removeFromFavorites, clearFavorites } = useFavorites()
  const [localLoading, setLocalLoading] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // No more useProductById here; handled in FavoriteProductCard

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRemoveFromFavorites = async (productId: string) => {
    try {
      setLocalLoading(productId)
      await removeFromFavorites(productId)
    } catch (error) {
      console.error('Failed to remove from favorites:', error)
    } finally {
      setLocalLoading(null)
    }
  }

  const handleClearAll = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmClearAll = async () => {
    try {
      setLocalLoading('clear-all')
      await clearFavorites()
      setShowConfirmDialog(false)
    } catch (error) {
      console.error('Failed to clear favorites:', error)
    } finally {
      setLocalLoading(null)
    }
  }

  if (!mounted || (favoritesLoading && favorites.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div 
                  className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                  style={{borderBottomColor: '#F39236'}}
                ></div>
                <p className="text-gray-600">Favoriten werden geladen...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Fehler beim Laden der Favoriten: {String(error || '')}</p>
              <Link href="/" className="hover:underline" style={{color: '#F39236'}}>
                Zur Startseite
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const isEmpty = favorites.length === 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Weiter einkaufen
            </Link>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8" style={{color: '#F39236'}} />
              <h1 className="text-3xl font-bold text-gray-900">Meine Favoriten</h1>
              {mounted && !isEmpty && (
                <span className="px-3 py-1 rounded-full text-sm font-medium" style={{backgroundColor: '#F3923620', color: '#F39236'}}>
                  {favorites.length} {favorites.length === 1 ? 'Produkt' : 'Produkte'}
                </span>
              )}
            </div>
            
                        {mounted && !isEmpty && (
              <button
                onClick={handleClearAll}
                disabled={localLoading === 'clear-all'}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {localLoading === 'clear-all' ? 'Wird gelöscht...' : 'Alle löschen'}
              </button>
            )}
          </div>

          {isEmpty ? (
            /* Empty Favorites */
                         <div className="text-center py-16">
               <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
               <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                 Sie haben noch keine Favoriten
               </h2>
               <p className="text-gray-600 mb-8 max-w-md mx-auto">
                 Fügen Sie Ihre Lieblingsprodukte zu den Favoriten hinzu, um sie später leicht zu finden.
               </p>
               <div className="space-x-4">
                 <Link 
                   href="/products" 
                   className="inline-flex items-center px-6 py-3 text-white font-medium rounded-md transition-colors hover:opacity-90"
                   style={{backgroundColor: '#F39236'}}
                 >
                   Produkte entdecken
                 </Link>
                 <Link 
                   href="/categories" 
                   className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                 >
                   Kategorien
                 </Link>
               </div>
             </div>
          ) : (
            /* Favorites Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {favorites.map(fav => (
                <FavoriteProductCard
                  key={fav.id}
                  productId={fav.id}
                  onRemove={handleRemoveFromFavorites}
                  localLoading={localLoading}
                />
              ))}
            </div>
          )}

          {/* Info Section */}
                     {mounted && !isEmpty && (
             <div className="mt-12 bg-gray-50 rounded-lg p-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">
                 💡 Über Favoriten
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                 <div>
                   <p>• Ihre Favoriten werden auf Ihrem Gerät gespeichert</p>
                   <p>• Sie können Favoriten jederzeit entfernen</p>
                 </div>
                 <div>
                   <p>• Bleiben Sie über Preisänderungen informiert</p>
                   <p>• Nutzen Sie Favoriten für schnellen Zugriff</p>
                 </div>
               </div>
             </div>
           )}
        </div>
      </main>

      <Footer />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmClearAll}
        title="Alle Favoriten löschen"
        message="Sind Sie sicher, dass Sie alle Ihre Favoriten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Alle löschen"
        cancelText="Abbrechen"
        isLoading={localLoading === 'clear-all'}
        variant="danger"
      />
    </div>
  )
} 