'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Cart, CartContextType, CartAction, CartItem } from '@/types/cart'
import { mockProducts } from '@/lib/mock-data'

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

// Get cart from localStorage
const getCartFromStorage = (): Cart => {
  if (typeof window === 'undefined') {
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
  }

  try {
    const stored = localStorage.getItem('cart_data')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error)
  }

  return {
    cart_id: `cart_${Date.now()}`,
    session_id: getSessionId(),
    items: [],
    total_amount: 0,
    total_items: 0,
    cart_created_at: new Date().toISOString(),
    cart_updated_at: new Date().toISOString(),
    expires_at: null
  }
}

// Save cart to localStorage
const saveCartToStorage = (cart: Cart) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart_data', JSON.stringify(cart))
  }
}

// Calculate totals
const calculateTotals = (items: CartItem[]) => {
  const total_items = items.reduce((sum, item) => sum + item.quantity, 0)
  const total_amount = items.reduce((sum, item) => sum + item.total_price, 0)
  return { total_items, total_amount }
}

// Cart reducer
const cartReducer = (state: Cart | null, action: CartAction): Cart | null => {
  switch (action.type) {
    case 'SET_CART':
      return action.payload
    case 'ADD_ITEM': {
      if (!state) return state
      
      const { productId, quantity } = action.payload
      const product = mockProducts.find(p => p.id === productId)
      if (!product) return state

             const effectivePrice = product.price
      const existingItemIndex = state.items.findIndex(item => item.product_id === productId)

      let newItems: CartItem[]
      
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...state.items]
        const existingItem = newItems[existingItemIndex]
        const newQuantity = existingItem.quantity + quantity
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total_price: newQuantity * effectivePrice
        }
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          product_id: productId,
          quantity: quantity,
          price: effectivePrice,
          total_price: quantity * effectivePrice,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            image_url: product.image || null,
            stock: product.inStock ? 10 : 0 // Mock stock
          }
        }
        newItems = [...state.items, newItem]
      }

      const { total_items, total_amount } = calculateTotals(newItems)
      const updatedCart = {
        ...state,
        items: newItems,
        total_items,
        total_amount,
        cart_updated_at: new Date().toISOString()
      }

      saveCartToStorage(updatedCart)
      return updatedCart
    }
    case 'UPDATE_ITEM': {
      if (!state) return state
      
      const { itemId, quantity } = action.payload
      const newItems = state.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: quantity,
            total_price: quantity * item.price
          }
        }
        return item
      })

      const { total_items, total_amount } = calculateTotals(newItems)
      const updatedCart = {
        ...state,
        items: newItems,
        total_items,
        total_amount,
        cart_updated_at: new Date().toISOString()
      }

      saveCartToStorage(updatedCart)
      return updatedCart
    }
    case 'REMOVE_ITEM': {
      if (!state) return state
      
      const { itemId } = action.payload
      const newItems = state.items.filter(item => item.id !== itemId)
      
      const { total_items, total_amount } = calculateTotals(newItems)
      const updatedCart = {
        ...state,
        items: newItems,
        total_items,
        total_amount,
        cart_updated_at: new Date().toISOString()
      }

      saveCartToStorage(updatedCart)
      return updatedCart
    }
    case 'CLEAR_CART': {
      const clearedCart = {
        cart_id: state?.cart_id || `cart_${Date.now()}`,
        session_id: getSessionId(),
        items: [],
        total_amount: 0,
        total_items: 0,
        cart_created_at: state?.cart_created_at || new Date().toISOString(),
        cart_updated_at: new Date().toISOString(),
        expires_at: null
      }

      saveCartToStorage(clearedCart)
      return clearedCart
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
  const [cart, dispatch] = useReducer(cartReducer, null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = getCartFromStorage()
    dispatch({ type: 'SET_CART', payload: storedCart })
  }, [])

  // Refresh cart (reload from localStorage)
  const refreshCart = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const storedCart = getCartFromStorage()
      dispatch({ type: 'SET_CART', payload: storedCart })
    } catch (err) {
      console.error('Failed to refresh cart:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh cart')
    } finally {
      setIsLoading(false)
    }
  }

  // Add item to cart
  const addToCart = async (productId: string, quantity = 1) => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if product exists
      const product = mockProducts.find(p => p.id === productId)
      if (!product) {
        throw new Error('Product not found')
      }

      // Check stock (mock check)
      if (!product.inStock) {
        throw new Error('Product is out of stock')
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      dispatch({ 
        type: 'ADD_ITEM', 
        payload: { productId, quantity } 
      })
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

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))

      dispatch({ 
        type: 'UPDATE_ITEM', 
        payload: { itemId, quantity } 
      })
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

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))

      dispatch({ 
        type: 'REMOVE_ITEM', 
        payload: { itemId } 
      })
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

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))

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