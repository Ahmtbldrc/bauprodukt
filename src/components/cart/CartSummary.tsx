'use client'

import React from 'react'
import { useCart } from '@/contexts/MockCartContext'

// Simple Button component
const Button: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'outline'
  size?: 'default' | 'lg'
  className?: string
}> = ({ children, onClick, disabled, variant = 'default', size = 'default', className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variantClasses = {
    default: 'text-white transition-colors hover:opacity-90',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50'
  }
  
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 py-3 text-lg'
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

interface CartSummaryProps {
  onCheckout?: () => void
  className?: string
}

export const CartSummary: React.FC<CartSummaryProps> = ({ 
  onCheckout, 
  className = '' 
}) => {
  const { cart, getTotalItems, getTotalAmount, clearCart, isLoading } = useCart()

  const totalItems = getTotalItems()
  const totalAmount = getTotalAmount()

  const handleClearCart = async () => {
    if (isLoading || !cart || cart.items.length === 0) return
    
    try {
      await clearCart()
    } catch (error) {
      console.error('Failed to clear cart:', error)
    }
  }

  const handleCheckout = () => {
    if (totalItems === 0) return
    onCheckout?.()
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Warenkorb-Übersicht</h3>
        <p className="text-gray-500 text-center py-8">Ihr Warenkorb ist leer</p>
      </div>
    )
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Warenkorb-Übersicht</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Artikel gesamt:</span>
          <span className="font-medium">{totalItems} Stück</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Zwischensumme:</span>
          <span className="font-medium">₺{totalAmount.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Versand:</span>
          <span className="font-medium">Kostenlos</span>
        </div>
        
        <hr className="border-gray-200" />
        
        <div className="flex justify-between text-lg font-semibold">
          <span>Gesamtsumme:</span>
          <span>₺{totalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="mt-6 space-y-3">
        <Button
          onClick={handleCheckout}
          disabled={isLoading || totalItems === 0}
          size="lg"
          className="w-full"
        >
          Zur Kasse
        </Button>
        
        <Button
          onClick={handleClearCart}
          disabled={isLoading || totalItems === 0}
          variant="outline"
          className="w-full"
        >
          Warenkorb leeren
        </Button>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        • Kostenloser Versand
        • 15 Tage Rückgaberecht
        • Sichere Bezahlung
      </div>
    </div>
  )
} 