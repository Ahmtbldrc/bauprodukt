export interface FavoriteProduct {
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
  onSale?: boolean
  discountPercentage?: number
  addedAt: string
}

export interface FavoritesContextType {
  favorites: FavoriteProduct[]
  isLoading: boolean
  error: string | null
  
  // Actions
  addToFavorites: (product: FavoriteProduct) => Promise<void>
  removeFromFavorites: (productId: string) => Promise<void>
  clearFavorites: () => Promise<void>
  refreshFavorites: () => Promise<void>
  
  // Utils
  isFavorite: (productId: string) => boolean
  getFavoritesCount: () => number
}

export type FavoritesActionType = 
  | 'SET_LOADING'
  | 'SET_ERROR'
  | 'SET_FAVORITES'
  | 'ADD_FAVORITE'
  | 'REMOVE_FAVORITE'
  | 'CLEAR_FAVORITES'

export type FavoritesAction =
  | { type: 'SET_FAVORITES'; payload: FavoriteProduct[] }
  | { type: 'ADD_FAVORITE'; payload: { product: FavoriteProduct } }
  | { type: 'REMOVE_FAVORITE'; payload: { productId: string } }
  | { type: 'CLEAR_FAVORITES' }; 