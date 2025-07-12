import { useProductById } from '@/hooks/useProducts'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { formatPrice } from '@/lib/url-utils'
import React from 'react'

export function FavoriteProductCard({ productId, onRemove, localLoading }: {
  productId: string
  onRemove: (id: string) => void
  localLoading: string | null
}) {
  const { data: product, isLoading, error } = useProductById(productId)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md h-96 flex items-center justify-center text-gray-400 animate-pulse">
        Lädt...
      </div>
    )
  }
  if (error || !product) return null

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Remove from favorites button */}
      <button
        onClick={() => onRemove(product.id)}
        disabled={localLoading === product.id}
        className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        title="Aus Favoriten entfernen"
      >
        {localLoading === product.id ? (
          <div 
            className="animate-spin rounded-full h-4 w-4 border-b-2"
            style={{borderBottomColor: '#F39236'}}
          ></div>
        ) : (
          <Heart className="h-4 w-4 text-red-500 fill-current" />
        )}
      </button>
      <Link href={`/${product.brand?.slug || 'marke'}/${product.category?.slug || 'kategorie'}/${product.slug}`}>
        <div className="h-48 bg-gray-200 flex items-center justify-center relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-gray-500 text-sm">Produktbild</span>
          )}
          {product.discount_price && product.discount_price < product.price && (
            <span className="absolute top-2 left-2 inline-block px-2 py-1 bg-red-500 text-white text-xs rounded">
              {Math.round(((product.price - product.discount_price) / product.price) * 100)}% RABATT
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1 justify-between">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            {product.brand?.name}
          </p>
          <p className="text-xs text-gray-500 mb-2">
            {product.category?.name}
          </p>
          <div className="mb-2">
            <p className="text-lg font-bold text-red-600">
              {formatPrice(product.discount_price != null ? product.discount_price : product.price)}
            </p>
            {product.discount_price != null && (
              <p className="text-sm text-gray-500 line-through">
                {formatPrice(product.price)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {product.stock <= 0 && (
              <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                Nicht auf Lager
              </span>
            )}
            {('featured' in product && product.featured) ? (
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Vorgestellt
              </span>
            ) : null}
            {('bestseller' in product && product.bestseller) ? (
              <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                Bestseller
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </div>
  )
} 