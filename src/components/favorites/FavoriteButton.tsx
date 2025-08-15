'use client'

import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useFavorites } from '@/contexts/FavoritesContext'
import { FavoriteProduct } from '@/types/favorites'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface FavoriteButtonProps {
  product: FavoriteProduct
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

export function FavoriteButton({ 
  product, 
  className = '', 
  size = 'md', 
  showText = false 
}: FavoriteButtonProps) {
  const { isFavorite, addToFavorites, removeFromFavorites, isLoading } = useFavorites()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const favorite = isFavorite(product.id)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if used within a link
    e.stopPropagation()

    try {
      // If not logged in, store pending favorite and redirect to login
      if (!isAuthenticated) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('pending_favorite_product_id', product.id)
        }
        const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
        return
      }

      if (favorite) {
        await removeFromFavorites(product.id)
      } else {
        await addToFavorites(product)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  }

  // Prevent hydration mismatch by not rendering interactive state on server
  if (!mounted) {
    return (
      <button
        className={`
          ${buttonSizeClasses[size]}
          rounded-full 
          transition-all 
          duration-200 
          hover:bg-gray-100 
          text-gray-400 hover:text-red-500
          ${showText ? 'flex items-center gap-2 px-3 py-2' : ''}
          ${className}
        `}
        disabled
      >
        <Heart className={`${sizeClasses[size]}`} />
        {showText && (
          <span className="text-sm font-medium">
            Favorilere Ekle
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`
        ${buttonSizeClasses[size]}
        rounded-full 
        transition-all 
        duration-200 
        hover:bg-gray-100 
        disabled:opacity-50 
        disabled:cursor-not-allowed
        ${showText ? 'flex items-center gap-2 px-3 py-2' : ''}
        ${favorite 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500'
        }
        ${className}
      `}
      title={favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
    >
      {isLoading ? (
        <div 
          className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]}`}
          style={{borderBottomColor: '#F39236'}}
        />
      ) : (
        <Heart 
          className={`${sizeClasses[size]} ${favorite ? 'fill-current' : ''}`} 
        />
      )}
      {showText && (
        <span className="text-sm font-medium">
          {favorite ? 'In Favoriten' : 'Zu Favoriten hinzufügen'}
        </span>
      )}
    </button>
  )
} 