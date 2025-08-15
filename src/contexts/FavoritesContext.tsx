'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { FavoriteProduct, FavoritesContextType, FavoritesAction } from '@/types/favorites'
import { useAuth } from '@/contexts/AuthContext'

// Get favorites from localStorage
const getFavoritesFromStorage = (): FavoriteProduct[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = localStorage.getItem('favorites_data')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error parsing favorites from localStorage:', error)
  }

  return []
}

// Save favorites to localStorage
const saveFavoritesToStorage = (favorites: FavoriteProduct[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('favorites_data', JSON.stringify(favorites))
  }
}

// Favorites reducer
const favoritesReducer = (state: FavoriteProduct[], action: FavoritesAction): FavoriteProduct[] => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Favorites reducer called with action:', action.type, 'payload:', (action as any).payload)
    console.log('Current state:', state)
  }
  
  let newState: FavoriteProduct[]
  
  switch (action.type) {
    case 'SET_FAVORITES':
      newState = (action as any).payload || []
      if (process.env.NODE_ENV === 'development') {
        console.log('SET_FAVORITES - New state:', newState)
      }
      return newState
    case 'ADD_FAVORITE': {
      const { product } = (action as any).payload;
      // Check if already in favorites
      if (state.some(fav => fav.id === product.id)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('ADD_FAVORITE - Product already in favorites, returning current state')
        }
        return state;
      }
      const favoriteProduct: FavoriteProduct = {
        ...product,
        addedAt: new Date().toISOString()
      };
      newState = [...state, favoriteProduct];
      if (process.env.NODE_ENV === 'development') {
        console.log('ADD_FAVORITE - New state:', newState)
      }
      saveFavoritesToStorage(newState);
      return newState;
    }
    case 'REMOVE_FAVORITE': {
      const { productId } = (action as any).payload
      newState = state.filter(fav => fav.id !== productId)
      if (process.env.NODE_ENV === 'development') {
        console.log('REMOVE_FAVORITE - New state:', newState)
      }
      saveFavoritesToStorage(newState)
      return newState
    }
    case 'CLEAR_FAVORITES': {
      if (process.env.NODE_ENV === 'development') {
        console.log('CLEAR_FAVORITES - Clearing all favorites')
      }
      saveFavoritesToStorage([])
      return []
    }
    default: {
      const actionType = (action as any).type
      if (process.env.NODE_ENV === 'development') {
        console.log('Favorites reducer - Unknown action type:', actionType)
      }
      return state
    }
  }
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

interface FavoritesProviderProps {
  children: React.ReactNode
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, dispatch] = useReducer(favoritesReducer, [])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isClient, setIsClient] = React.useState(false)
  const { isAuthenticated, user } = useAuth()

  // Load favorites depending on auth
  useEffect(() => {
    const load = async () => {
      setIsClient(true)
      try {
        setIsLoading(true)
        setError(null)
        if (isAuthenticated && user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Loading favorites for authenticated user:', user.id)
          }
          // Fetch from API
          const res = await fetch('/api/favorites', { headers: { 'x-user-id': user.id } })
          if (!res.ok) throw new Error('Failed to load favorites')
          const data: Array<{ product_id: string; created_at: string }> = await res.json()
          if (process.env.NODE_ENV === 'development') {
            console.log('Favorites API response:', data)
          }
          // Map to FavoriteProduct placeholders (only id is used elsewhere)
          const mapped: FavoriteProduct[] = data.map(d => ({
            id: d.product_id,
            name: '',
            slug: '',
            description: '',
            price: 0,
            image: undefined,
            brand: { id: '', name: '', slug: '' },
            category: { id: '', name: '', slug: '' },
            inStock: true,
            addedAt: d.created_at
          }))
          if (process.env.NODE_ENV === 'development') {
            console.log('Mapped favorites:', mapped)
          }
          dispatch({ type: 'SET_FAVORITES', payload: mapped })
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('User not authenticated, clearing favorites')
          }
          // Guest users see empty favorites
          dispatch({ type: 'SET_FAVORITES', payload: [] })
        }
      } catch (err) {
        console.error('Failed to load favorites:', err)
        setError(err instanceof Error ? err.message : 'Failed to load favorites')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAuthenticated, user?.id])

  // Debug: Log favorites state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Favorites state changed:', favorites)
    }
  }, [favorites])

  // Refresh favorites (reload from localStorage)
  const refreshFavorites = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting refreshFavorites...')
      }
      setIsLoading(true)
      setError(null)
      if (isAuthenticated && user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Refreshing favorites for user:', user.id)
        }
        const res = await fetch('/api/favorites', { headers: { 'x-user-id': user.id } })
        if (!res.ok) throw new Error('Failed to refresh favorites')
        
        const data: Array<{ product_id: string; created_at: string }> = await res.json()
        if (process.env.NODE_ENV === 'development') {
          console.log('Refresh favorites API response:', data)
        }
        
        // Ensure data is an array and has the expected structure
        if (Array.isArray(data)) {
          const mapped: FavoriteProduct[] = data.map(d => ({
            id: d.product_id,
            name: '', 
            slug: '', 
            description: '', 
            price: 0,
            image: undefined,
            brand: { id: '', name: '', slug: '' },
            category: { id: '', name: '', slug: '' },
            inStock: true,
            addedAt: d.created_at
          }))
          if (process.env.NODE_ENV === 'development') {
            console.log('Mapped refresh favorites:', mapped)
          }
          dispatch({ type: 'SET_FAVORITES', payload: mapped })
          if (process.env.NODE_ENV === 'development') {
            console.log('Favorites refreshed successfully:', mapped.length, 'items')
          }
        } else {
          console.error('Invalid favorites data format:', data)
          dispatch({ type: 'SET_FAVORITES', payload: [] })
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('User not authenticated during refresh, clearing favorites')
        }
        dispatch({ type: 'SET_FAVORITES', payload: [] })
      }
    } catch (err) {
      console.error('Failed to refresh favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh favorites')
      // On error, keep existing favorites instead of clearing them
    } finally {
      setIsLoading(false)
      if (process.env.NODE_ENV === 'development') {
        console.log('refreshFavorites completed')
      }
    }
  }

  // Add item to favorites
  const addToFavorites = async (product: FavoriteProduct) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting addToFavorites for product:', product.id)
      }
      setIsLoading(true)
      setError(null)
      if (isAuthenticated && user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Adding favorite for authenticated user:', user.id)
        }
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
          body: JSON.stringify({ product_id: product.id })
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Favorites API error:', errorData)
          throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`)
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Favorite added successfully via API')
        }
        
        // Immediately add to local state for better UX
        const favoriteProduct: FavoriteProduct = {
          ...product,
          addedAt: new Date().toISOString()
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('Dispatching ADD_FAVORITE action:', favoriteProduct)
        }
        dispatch({ type: 'ADD_FAVORITE', payload: { product: favoriteProduct } })
        
        // Then refresh from server to ensure consistency
        if (process.env.NODE_ENV === 'development') {
          console.log('Refreshing favorites from server...')
        }
        await refreshFavorites()
      } else {
        throw new Error('Bitte melden Sie sich an, um Favoriten zu nutzen')
      }
    } catch (err) {
      console.error('Failed to add to favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to add to favorites')
      throw err
    } finally {
      setIsLoading(false)
      if (process.env.NODE_ENV === 'development') {
        console.log('addToFavorites completed')
      }
    }
  }

  // Remove item from favorites
  const removeFromFavorites = async (productId: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting removeFromFavorites for product:', productId)
      }
      setIsLoading(true)
      setError(null)
      if (isAuthenticated && user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Removing favorite for authenticated user:', user.id)
        }
        const res = await fetch(`/api/favorites/${productId}`, { method: 'DELETE', headers: { 'x-user-id': user.id } })
        if (!res.ok) throw new Error('Failed to remove favorite')
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Favorite removed successfully via API')
        }
        
        // Immediately remove from local state for better UX
        if (process.env.NODE_ENV === 'development') {
          console.log('Dispatching REMOVE_FAVORITE action for product:', productId)
        }
        dispatch({ type: 'REMOVE_FAVORITE', payload: { productId } })
        
        // Then refresh from server to ensure consistency
        if (process.env.NODE_ENV === 'development') {
          console.log('Refreshing favorites from server...')
        }
        await refreshFavorites()
      } else {
        throw new Error('Bitte melden Sie sich an, um Favoriten zu nutzen')
      }
    } catch (err) {
      console.error('Failed to remove from favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove from favorites')
      throw err
    } finally {
      setIsLoading(false)
      if (process.env.NODE_ENV === 'development') {
        console.log('removeFromFavorites completed')
      }
    }
  }

  // Clear all favorites
  const clearFavorites = async () => {
    try {
      setIsLoading(true)
      setError(null)
      if (isAuthenticated && user) {
        // No bulk delete endpoint; delete one by one
        const current = favorites.slice()
        for (const fav of current) {
          await fetch(`/api/favorites/${fav.id}`, { method: 'DELETE', headers: { 'x-user-id': user.id } })
        }
        await refreshFavorites()
      } else {
        throw new Error('Bitte melden Sie sich an, um Favoriten zu nutzen')
      }
    } catch (err) {
      console.error('Failed to clear favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear favorites')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Check if product is in favorites
  const isFavorite = (productId: string): boolean => {
    if (!isClient) return false
    const result = favorites.some(fav => fav.id === productId)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Checking if product ${productId} is favorite:`, result, 'Total favorites:', favorites.length)
    }
    return result
  }

  // Get favorites count
  const getFavoritesCount = (): number => {
    if (!isClient) return 0
    return favorites.length
  }

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    error,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    refreshFavorites,
    isFavorite,
    getFavoritesCount
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
} 