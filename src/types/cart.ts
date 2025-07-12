export interface CartProduct {
  id: string
  name: string
  slug: string
  image_url: string | null
  stock: number
}

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  price: number
  total_price: number
  product: CartProduct
}

export interface Cart {
  cart_id: string | null
  session_id: string
  items: CartItem[]
  total_amount: number
  total_items: number
  cart_created_at: string | null
  cart_updated_at: string | null
  expires_at: string | null
}

export interface AddToCartRequest {
  product_id: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CartContextType {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  
  // Actions
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateCartItem: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  
  // Utils
  getItemQuantity: (productId: string) => number
  getTotalItems: () => number
  getTotalAmount: () => number
}

export type CartActionType = 
  | 'SET_LOADING'
  | 'SET_ERROR'
  | 'SET_CART'
  | 'ADD_ITEM'
  | 'UPDATE_ITEM'
  | 'REMOVE_ITEM'
  | 'CLEAR_CART'

export interface CartAction {
  type: CartActionType
  payload?: unknown
} 