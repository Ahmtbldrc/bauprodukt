'use client'

import React, { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Minus, Plus, Heart } from 'lucide-react'


interface AddToCartButtonProps {
  productId: string
  productStock: number
  className?: string
  disabled?: boolean
  variantId?: string
  product?: {
    id: string
    name: string
    slug: string
    description: string
    price: number
    originalPrice?: number
    image?: string
    brand: {
      id: string
      name: string
      slug: string
    }
    category: {
      id: string
      name: string
      slug: string
    }
    inStock: boolean
    onSale: boolean
    discountPercentage?: number
    addedAt: string
  }
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  productId,
  productStock,
  className,
  disabled = false,
  variantId,
  product
}) => {
  const { addToCart, isLoading } = useCart()
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [actionLoading, setActionLoading] = useState(false)
  const [localQuantity, setLocalQuantity] = useState(1) // Local counter starts at 1
  
  const maxQuantity = Math.min(productStock, 999)

  const handleAddToCart = async () => {
    if (disabled || actionLoading || productStock === 0) return

    try {
      setActionLoading(true)
      await addToCart(productId, localQuantity, variantId) // Add current local quantity with variant
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLocalQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setLocalQuantity(newQuantity)
    }
  }

  const loading = isLoading || actionLoading

  // Always show quantity controls and add to cart button
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Quantity Controls */}
      <div className="flex items-center" style={{
        width: '90px',
        height: '30px',
        background: '#FFFFFF 0% 0% no-repeat padding-box',
        border: '1px solid #F2F2F2',
        borderRadius: '5px',
        opacity: 1
      }}>
        <button
          disabled={loading || localQuantity <= 1}
          onClick={() => handleLocalQuantityChange(localQuantity - 1)}
          className="w-8 h-full flex items-center justify-center hover:bg-gray-50 border-r"
          style={{color: '#A3A3A3', borderColor: '#F2F2F2'}}
        >
          <Minus className="h-3 w-3" />
        </button>
        
        <div className="w-8 h-full flex items-center justify-center text-sm" style={{color: '#A3A3A3'}}>
          {localQuantity}
        </div>
        
        <button
          disabled={loading || localQuantity >= maxQuantity}
          onClick={() => handleLocalQuantityChange(localQuantity + 1)}
          className="w-8 h-full flex items-center justify-center hover:bg-gray-50 border-l"
          style={{color: '#A3A3A3', borderColor: '#F2F2F2'}}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      
      {/* Add To Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={disabled || loading || productStock === 0}
        className="font-medium rounded-sm transition-all duration-200 text-white flex items-center justify-center px-6"
        style={{
          fontWeight: '500',
          fontSize: '12px',
          lineHeight: '16px',
          letterSpacing: '0px',
          backgroundColor: productStock === 0 ? '#d1d5db' : '#F39236',
          color: '#FFFFFF',
          width: '120px',
          height: '30px'
        }}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <span className="whitespace-nowrap">
            {productStock === 0 ? 'Ausverkauft' : 'In den Warenkorb'}
          </span>
        )}
      </button>
      
      {/* Favorite Button */}
      <button
        onClick={async () => {
          if (!product) return
          try {
            if (!isAuthenticated) {
              if (typeof window !== 'undefined') {
                localStorage.setItem('pending_favorite_product_id', product.id)
                // Also store the current page URL for better redirect experience
                const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
                localStorage.setItem('pending_favorite_redirect_url', currentUrl)
              }
              const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
              router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
              return
            }
            if (isFavorite(product.id)) {
              await removeFromFavorites(product.id)
            } else {
              await addToFavorites(product)
            }
          } catch (err) {
            console.error('Favorite toggle failed:', err)
          }
        }}
        className={`border border-gray-200 rounded-sm hover:border-gray-300 transition-all duration-200 flex items-center justify-center ${
          product && isFavorite(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
        }`}
        style={{ width: '30px', height: '30px' }}
      >
        <Heart className={`h-4 w-4 ${product && isFavorite(product.id) ? 'fill-current' : ''}`} />
      </button>
      
      {/* Edit Button */}
      <button
        className="text-gray-400 border border-gray-200 rounded-sm hover:border-gray-300 hover:text-gray-900 transition-all duration-200 flex items-center justify-center"
        style={{ width: '30px', height: '30px' }}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  )
} 