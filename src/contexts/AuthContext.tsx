'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { 
  AuthState, 
  AuthContextType, 
  LoginCredentials, 
  RegisterData, 
  User
} from '@/types/auth'
import { MOCK_USERS } from '@/types/auth'

// Auth actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Başlangıçta loading olsun çünkü localStorage'dan kontrol ediyoruz
  error: null
}

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    
    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      }
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    default:
      return state
  }
}

// Auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode
}

// Local storage keys
const STORAGE_KEYS = {
  USER: 'bauprodukt_auth_user',
  TOKEN: 'bauprodukt_auth_token'
}

// Mock API helper functions
const mockApiDelay = () => new Promise(resolve => setTimeout(resolve, 800)) // Gerçek API gecikme simülasyonu

const findUserByEmail = (email: string): User | undefined => {
  return MOCK_USERS.find(user => user.email.toLowerCase() === email.toLowerCase())
}

const generateNewUser = (data: RegisterData): User => {
  return {
    id: Date.now().toString(), // Basit ID generation
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: `${data.firstName} ${data.lastName}`,
    phone: data.phone,
    createdAt: new Date()
  }
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for stored auth on mount
  useEffect(() => {
    const checkStoredAuth = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
        
        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser)
          // Mock token validation - gerçek uygulamada token'ın geçerliliği kontrol edilir
          dispatch({ type: 'LOGIN_SUCCESS', payload: user })
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Auth check error:', error)
        // Clear invalid stored data
        localStorage.removeItem(STORAGE_KEYS.USER)
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    checkStoredAuth()
  }, [])

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      await mockApiDelay()
      
      // Mock kullanıcı kontrolü
      const user = findUserByEmail(credentials.email)
      
      if (!user) {
        throw new Error('Es wurde kein Benutzer mit dieser E-Mail-Adresse gefunden')
      }
      
      // Mock password kontrolü - gerçek uygulamada backend'de hash kontrolü yapılır
      // Şimdilik sadece "kadir123" şifresi kabul ediliyor
      if (credentials.password !== 'kadir123') {
        throw new Error('E-Mail oder Passwort ist falsch')
      }
      
      // Success - store auth data
      const mockToken = `mock_token_${user.id}_${Date.now()}`
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
      localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken)
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Beim Anmelden ist ein Fehler aufgetreten'
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage })
      throw error
    }
  }

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    dispatch({ type: 'REGISTER_START' })
    
    try {
      await mockApiDelay()
      
      // Email'in daha önce kullanılıp kullanılmadığını kontrol et
      const existingUser = findUserByEmail(data.email)
      if (existingUser) {
        throw new Error('Diese E-Mail-Adresse wird bereits verwendet')
      }
      
      // Password confirmation kontrolü
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwörter stimmen nicht überein')
      }
      
      // Terms acceptance kontrolü
      if (!data.acceptTerms) {
        throw new Error('Sie müssen die Nutzungsbedingungen akzeptieren')
      }
      
      // Create new user
      const newUser = generateNewUser(data)
      
      // Mock API success - store auth data
      const mockToken = `mock_token_${newUser.id}_${Date.now()}`
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser))
      localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken)
      
      // Yeni kullanıcıyı mock verilere ekle (session boyunca)
      MOCK_USERS.push(newUser)
      
      dispatch({ type: 'REGISTER_SUCCESS', payload: newUser })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bei der Registrierung ist ein Fehler aufgetreten'
      dispatch({ type: 'REGISTER_ERROR', payload: errorMessage })
      throw error
    }
  }

  // Logout function
  const logout = (): void => {
    // Clear stored auth data
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    
    dispatch({ type: 'LOGOUT' })
  }

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 