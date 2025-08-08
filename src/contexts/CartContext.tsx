'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { Cart, CartContextType, CartAction } from '@/types/cart'

// Generate a unique session ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return generateSessionId()
  
  let sessionId = localStorage.getItem('cart_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem('cart_session_id', sessionId)
  }
  return sessionId
}

// Initial state
const initialState: Cart | null = null

// Cart reducer
const cartReducer = (state: Cart | null, action: CartAction): Cart | null => {
  switch (action.type) {
    case 'SET_CART':
      return action.payload
    case 'CLEAR_CART':
      return {
        cart_id: null,
        session_id: getSessionId(),
        items: [],
        total_amount: 0,
        total_items: 0,
        cart_created_at: null,
        cart_updated_at: null,
        expires_at: null
      }
    default:
      return state
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: React.ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const sessionId = getSessionId()

  // API call helper
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Fetch cart from API
  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const cartData = await apiCall(`/api/cart/${sessionId}`)
      dispatch({ type: 'SET_CART', payload: cartData })
    } catch (err) {
      console.error('Failed to fetch cart:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch cart')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // Add item to cart
  const addToCart = async (productId: string, quantity = 1, variantId?: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const payload: { product_id: string; quantity: number; variant_id?: string } = { product_id: productId, quantity }
      if (variantId) {
        payload.variant_id = variantId
      }

      await apiCall(`/api/cart/${sessionId}/items`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      // Refresh cart after adding item
      await refreshCart()
    } catch (err) {
      console.error('Failed to add to cart:', err)
      setError(err instanceof Error ? err.message : 'Failed to add to cart')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Update cart item quantity
  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      setIsLoading(true)
      setError(null)

      await apiCall(`/api/cart/${sessionId}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      })

      // Refresh cart after updating item
      await refreshCart()
    } catch (err) {
      console.error('Failed to update cart item:', err)
      setError(err instanceof Error ? err.message : 'Failed to update cart item')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      await apiCall(`/api/cart/${sessionId}/items/${itemId}`, {
        method: 'DELETE',
      })

      // Refresh cart after removing item
      await refreshCart()
    } catch (err) {
      console.error('Failed to remove from cart:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove from cart')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Clear entire cart
  const clearCart = async () => {
    try {
      setIsLoading(true)
      setError(null)

      await apiCall(`/api/cart/${sessionId}`, {
        method: 'DELETE',
      })

      dispatch({ type: 'CLEAR_CART' })
    } catch (err) {
      console.error('Failed to clear cart:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear cart')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Utility functions
  const getItemQuantity = (productId: string): number => {
    if (!cart) return 0
    const item = cart.items.find(item => item.product_id === productId)
    return item ? item.quantity : 0
  }

  const getTotalItems = (): number => {
    return cart ? cart.total_items : 0
  }

  const getTotalAmount = (): number => {
    return cart ? cart.total_amount : 0
  }

  // Load cart on mount
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const value: CartContextType = {
    cart,
    isLoading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    getItemQuantity,
    getTotalItems,
    getTotalAmount,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
} 