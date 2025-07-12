'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { FavoriteProduct, FavoritesContextType, FavoritesAction } from '@/types/favorites'

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
  switch (action.type) {
    case 'SET_FAVORITES':
      return action.payload || []
    case 'ADD_FAVORITE': {
      const { product } = action.payload;
      // Check if already in favorites
      if (state.some(fav => fav.id === product.id)) {
        return state;
      }
      const favoriteProduct: FavoriteProduct = {
        ...product,
        addedAt: new Date().toISOString()
      };
      const newFavorites = [...state, favoriteProduct];
      saveFavoritesToStorage(newFavorites);
      return newFavorites;
    }
    case 'REMOVE_FAVORITE': {
      const { productId } = action.payload
      const newFavorites = state.filter(fav => fav.id !== productId)
      saveFavoritesToStorage(newFavorites)
      return newFavorites
    }
    case 'CLEAR_FAVORITES': {
      saveFavoritesToStorage([])
      return []
    }
    default:
      return state
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

  // Load favorites from localStorage on mount
  useEffect(() => {
    setIsClient(true)
    const storedFavorites = getFavoritesFromStorage()
    dispatch({ type: 'SET_FAVORITES', payload: storedFavorites })
  }, [])

  // Refresh favorites (reload from localStorage)
  const refreshFavorites = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const storedFavorites = getFavoritesFromStorage()
      dispatch({ type: 'SET_FAVORITES', payload: storedFavorites })
    } catch (err) {
      console.error('Failed to refresh favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh favorites')
    } finally {
      setIsLoading(false)
    }
  }

  // Add item to favorites
  const addToFavorites = async (product: FavoriteProduct) => {
    try {
      setIsLoading(true)
      setError(null)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))
      dispatch({ 
        type: 'ADD_FAVORITE', 
        payload: { product } 
      })
    } catch (err) {
      console.error('Failed to add to favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to add to favorites')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Remove item from favorites
  const removeFromFavorites = async (productId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))

      dispatch({ 
        type: 'REMOVE_FAVORITE', 
        payload: { productId } 
      })
    } catch (err) {
      console.error('Failed to remove from favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove from favorites')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Clear all favorites
  const clearFavorites = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))

      dispatch({ type: 'CLEAR_FAVORITES' })
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
    return favorites.some(fav => fav.id === productId)
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