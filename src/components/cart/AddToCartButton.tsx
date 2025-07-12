'use client'

import React, { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { Minus, Plus, ShoppingCart } from 'lucide-react'

// Simple Button component
const Button: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm'
  className?: string
}> = ({ children, onClick, disabled, variant = 'default', size = 'default', className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100'
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
    >
      {children}
    </button>
  )
}

interface AddToCartButtonProps {
  productId: string
  productStock: number
  className?: string
  disabled?: boolean
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  productId,
  productStock,
  className,
  disabled = false
}) => {
  const { addToCart, isLoading } = useCart()
  const [actionLoading, setActionLoading] = useState(false)
  const [localQuantity, setLocalQuantity] = useState(1) // Local counter starts at 1
  
  const maxQuantity = Math.min(productStock, 999)

  const handleAddToCart = async () => {
    if (disabled || actionLoading || productStock === 0) return

    try {
      setActionLoading(true)
      await addToCart(productId, localQuantity) // Add current local quantity
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
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          disabled={loading || localQuantity <= 1}
          onClick={() => handleLocalQuantityChange(localQuantity - 1)}
          className="h-12 w-10 p-0 rounded-none border-0 hover:bg-gray-100"
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <div className="w-12 h-12 flex items-center justify-center bg-white font-semibold text-gray-900 border-x">
          {localQuantity}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          disabled={loading || localQuantity >= maxQuantity}
          onClick={() => handleLocalQuantityChange(localQuantity + 1)}
          className="h-12 w-10 p-0 rounded-none border-0 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Add To Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={disabled || loading || productStock === 0}
        className="h-12 px-4 text-white font-semibold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: productStock === 0 ? '#d1d5db' : '#F39236' }}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            <span>{productStock === 0 ? 'Ausverkauft' : 'In den Warenkorb'}</span>
          </>
        )}
      </button>
    </div>
  )
} 