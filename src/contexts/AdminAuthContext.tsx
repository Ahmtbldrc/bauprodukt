'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { 
  AuthState, 
  AuthContextType, 
  LoginCredentials, 
  User
} from '@/types/auth'

// Admin Auth actions
type AdminAuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

// Admin Auth reducer
const adminAuthReducer = (state: AuthState, action: AdminAuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    
    case 'LOGIN_ERROR':
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

// Admin Auth context
const AdminAuthContext = createContext<AuthContextType | undefined>(undefined)

// Admin Auth provider props
interface AdminAuthProviderProps {
  children: React.ReactNode
}

// Local storage keys for admin
const ADMIN_STORAGE_KEYS = {
  USER: 'bauprodukt_admin_auth_user',
  TOKEN: 'bauprodukt_admin_auth_token'
}

// Admin Auth provider component
export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(adminAuthReducer, initialState)

  // Check for stored admin auth on mount
  useEffect(() => {
    const checkStoredAdminAuth = async () => {
      // Skip during SSR
      if (typeof window === 'undefined') {
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }

      try {
        // Check if admin session exists in localStorage
        const storedAdminUser = localStorage.getItem(ADMIN_STORAGE_KEYS.USER)
        
        if (storedAdminUser) {
          const user = JSON.parse(storedAdminUser)
          
          // Verify the user is still valid by checking Supabase session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error || !session?.user || session.user.id !== user.id) {
            // Clear invalid admin session
            localStorage.removeItem(ADMIN_STORAGE_KEYS.USER)
            localStorage.removeItem(ADMIN_STORAGE_KEYS.TOKEN)
            dispatch({ type: 'SET_LOADING', payload: false })
            return
          }

          // Verify user is still admin
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select(`
              *,
              role:roles(*)
            `)
            .eq('user_id', session.user.id)
            .single()

          if (profileError || profileData?.role?.slug !== 'admin') {
            // User is no longer admin, clear session
            localStorage.removeItem(ADMIN_STORAGE_KEYS.USER)
            localStorage.removeItem(ADMIN_STORAGE_KEYS.TOKEN)
            dispatch({ type: 'SET_LOADING', payload: false })
            return
          }

          // Update user data with latest profile info
          const updatedUser: User = {
            ...user,
            firstName: profileData?.first_name || user.firstName,
            lastName: profileData?.last_name || user.lastName,
            fullName: profileData ? `${profileData.first_name} ${profileData.last_name}` : user.fullName,
            role: 'admin',
            phone: profileData?.phone || user.phone,
            avatar: profileData?.avatar_url || user.avatar,
            supabaseUser: session.user,
            profile: profileData,
            roleData: profileData?.role,
          }

          dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser })
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Admin auth check error:', error)
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    checkStoredAdminAuth()
  }, [])

  // Admin Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      // Supabase Auth ile giriş
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error('Anmeldung fehlgeschlagen')
      }

      // Kullanıcı profilini al ve admin kontrolü yap
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('user_id', data.user.id)
        .single()

      if (profileError) {
        throw new Error('Benutzerprofil nicht gefunden')
      }

      // Admin kontrolü
      if (profileData?.role?.slug !== 'admin') {
        throw new Error('Zugriff verweigert. Nur Administratoren können sich anmelden.')
      }

      // User objesini oluştur
      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        firstName: profileData?.first_name || data.user.user_metadata?.first_name || '',
        lastName: profileData?.last_name || data.user.user_metadata?.last_name || '',
        fullName: profileData ? `${profileData.first_name} ${profileData.last_name}` : data.user.user_metadata?.full_name || '',
        role: 'admin',
        phone: profileData?.phone || '',
        avatar: profileData?.avatar_url || data.user.user_metadata?.avatar_url,
        createdAt: new Date(data.user.created_at),
        supabaseUser: data.user,
        profile: profileData,
        roleData: profileData?.role,
      }

      // Store admin auth data separately
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_STORAGE_KEYS.USER, JSON.stringify(user))
      }
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Beim Anmelden ist ein Fehler aufgetreten'
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage })
      throw error
    }
  }

  // Admin Logout function
  const logout = async (): Promise<void> => {
    try {
      // Supabase Auth ile çıkış
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Admin logout error:', error)
      }
    } catch (error) {
      console.error('Admin logout error:', error)
    } finally {
      // Clear stored admin auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ADMIN_STORAGE_KEYS.USER)
        localStorage.removeItem(ADMIN_STORAGE_KEYS.TOKEN)
      }
      
      dispatch({ type: 'LOGOUT' })
    }
  }

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  // Dummy register function for type compatibility
  const register = async (): Promise<void> => {
    throw new Error('Admin registration not supported')
  }

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout: logout as () => void,
    clearError
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

// Custom hook
export const useAdminAuth = (): AuthContextType => {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
