'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { CartItem as CartItemType } from '@/types/cart'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useProductById } from '@/hooks'

// Simple Button component
const Button: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm'
  className?: string
}> = ({ children, onClick, disabled, variant = 'default', size = 'default', className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variantClasses = {
    default: 'text-white transition-colors hover:opacity-90',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  }
  
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={variant === 'default' ? {backgroundColor: '#F39236'} : {}}
    >
      {children}
    </button>
  )
}

interface CartItemProps {
  item: CartItemType
  onQuantityChange?: (itemId: string, quantity: number) => void
  onRemove?: (itemId: string) => void
}

export const CartItem: React.FC<CartItemProps> = ({ 
  item, 
  onQuantityChange, 
  onRemove 
}) => {
  const { updateCartItem, removeFromCart, isLoading } = useCart()
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch full product details for dynamic routing
  const { data: fullProduct } = useProductById(item.product.id)

  // Create fallback URL structure when brand/category data is not available
  // The API view includes brand_slug and category_slug fields
  const productUrl = (fullProduct as { brand_slug?: string; category_slug?: string; slug?: string })?.brand_slug && (fullProduct as { brand_slug?: string; category_slug?: string; slug?: string })?.category_slug 
    ? `/${(fullProduct as { brand_slug?: string; category_slug?: string; slug?: string }).brand_slug}/${(fullProduct as { brand_slug?: string; category_slug?: string; slug?: string }).category_slug}/${fullProduct?.slug || item.product.slug}`
    : `/products/${fullProduct?.slug || item.product.slug}`

  const loading = isLoading || actionLoading

  const handleQuantityChange = async (newQuantity: number) => {
    if (loading || newQuantity < 1) return

    try {
      setActionLoading(true)
      await updateCartItem(item.id, newQuantity)
      onQuantityChange?.(item.id, newQuantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemove = async () => {
    if (loading) return

    try {
      setActionLoading(true)
      await removeFromCart(item.id)
      onRemove?.(item.id)
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const maxQuantity = Math.min(item.product.stock, 999)

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-200">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <Link href={productUrl}>
          <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
            {item.product.image_url ? (
              <Image
                src={item.product.image_url}
                alt={item.product.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-500 text-xs">Kein Bild</span>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex-grow">
        <Link href={productUrl}>
          <h3 
            className="font-medium text-gray-900 transition-colors hover:opacity-80"
            onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#F39236'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#111827'}
          >
            {item.product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mt-1">
          CHF {item.price.toFixed(2)} / Stück
        </p>
        {item.product.stock < 10 && (
          <p className="text-sm text-orange-600 mt-1">
            Nur noch {item.product.stock} Stück verfügbar
          </p>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={loading || item.quantity <= 1}
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className="h-10 w-10 p-0"
        >
          <Minus className="h-5 w-5" />
        </Button>
        
        <span className="min-w-[2rem] text-center font-medium">
          {item.quantity}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          disabled={loading || item.quantity >= maxQuantity}
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className="h-10 w-10 p-0"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Total Price */}
      <div className="text-right min-w-[80px]">
        <p className="font-semibold text-gray-900">
          CHF {item.total_price.toFixed(2)}
        </p>
      </div>

      {/* Remove Button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={handleRemove}
          className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
} 