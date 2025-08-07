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
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative">
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
        <div className="relative">
          {/* Product Image */}
          <div className="h-48 bg-white overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-500 text-sm">Produktbild</span>
              </div>
            )}
          </div>
          
          {/* Divider Line */}
          <div className="h-px bg-gray-200"></div>
          
          {/* Discount Badge - Top Right */}
          {product.discount_price && product.discount_price < product.price && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 text-xs rounded font-medium" style={{backgroundColor: '#F39236', color: '#F2F2F2'}}>
                Sale
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          {/* Stock Status Icon */}
          <div className="flex items-center mb-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center mr-2`} style={{
              background: product.stock <= 0 ? '#E0BEBB' : product.stock <= 5 ? '#FFF0E2' : '#E9EDD0',
              border: product.stock <= 0 ? '1px solid #A63F35' : product.stock <= 5 ? '1px solid #F39237' : '1px solid #AAB560',
              borderRadius: '5px'
            }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
                color: product.stock <= 0 ? '#A63F35' : product.stock <= 5 ? '#F39237' : '#AAB560'
              }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          
          {/* Product Name */}
          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 h-12 text-sm">
            {product.name}
          </h3>
          
          {/* Category Description */}
          <p className="text-xs text-gray-500 mb-3">
            {product.category?.name}
          </p>
          
          {/* Price */}
          <div className="flex items-center gap-2">
            {product.discount_price != null && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.price)}
              </span>
            )}
            <span className="text-lg font-bold" style={{color: '#F39236'}}>
              {formatPrice(product.discount_price != null ? product.discount_price : product.price)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
} 