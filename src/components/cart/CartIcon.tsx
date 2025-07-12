'use client'

import React from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { ShoppingCart } from 'lucide-react'

interface CartIconProps {
  className?: string
  showBadge?: boolean
}

export const CartIcon: React.FC<CartIconProps> = ({ 
  className = '', 
  showBadge = true 
}) => {
  const { getTotalItems, isLoading } = useCart()
  const itemCount = getTotalItems()

  return (
    <Link href="/cart" className={`relative inline-flex items-center ${className}`}>
      <ShoppingCart className="h-6 w-6" />
      {showBadge && itemCount > 0 && (
        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
      {isLoading && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
      )}
    </Link>
  )
} 