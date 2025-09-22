'use client'

import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { supabasePlumberClient } from '@/lib/supabase'
import type { AuthContextType, AuthState, LoginCredentials, User } from '@/types/auth'

type PlumberAuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

const reducer = (state: AuthState, action: PlumberAuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false, error: null }
    case 'LOGIN_ERROR':
      return { ...state, user: null, isAuthenticated: false, isLoading: false, error: action.payload }
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, isLoading: false, error: null }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

const PlumberAuthContext = createContext<AuthContextType | undefined>(undefined)

interface PlumberAuthProviderProps { children: React.ReactNode }

const STORAGE_KEYS = {
  USER: 'bauprodukt_plumber_auth_user',
  TOKEN: 'bauprodukt_plumber_auth_token',
}

export const PlumberAuthProvider: React.FC<PlumberAuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const checkStoredAuth = async () => {
      if (typeof window === 'undefined') {
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }

      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
        if (!storedUser) {
          dispatch({ type: 'SET_LOADING', payload: false })
          return
        }

        const { data: { session }, error } = await supabasePlumberClient.auth.getSession()
        if (error || !session?.user) {
          localStorage.removeItem(STORAGE_KEYS.USER)
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          dispatch({ type: 'SET_LOADING', payload: false })
          return
        }

        // Get profile and ensure role is plumber
        const { data: profileData, error: profileError } = await (supabasePlumberClient as any)
          .from('profiles')
          .select(`*, role:roles(*)`)
          .eq('user_id', session.user.id)
          .single()

        if (profileError || profileData?.role?.slug !== 'plumber') {
          localStorage.removeItem(STORAGE_KEYS.USER)
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          dispatch({ type: 'SET_LOADING', payload: false })
          return
        }

        const parsed = JSON.parse(storedUser)
        const updatedUser: User = {
          ...parsed,
          firstName: profileData?.first_name || parsed.firstName,
          lastName: profileData?.last_name || parsed.lastName,
          fullName: profileData ? `${profileData.first_name} ${profileData.last_name}` : parsed.fullName,
          role: 'plumber' as any,
          phone: profileData?.phone || parsed.phone,
          avatar: profileData?.avatar_url || parsed.avatar,
          supabaseUser: session.user,
          profile: profileData,
          roleData: profileData?.role,
        }

        dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser })
      } catch (e) {
        console.error('Plumber auth check error:', e)
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    checkStoredAuth()
  }, [])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const { data, error } = await supabasePlumberClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })
      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('Anmeldung fehlgeschlagen')

      const { data: profileData, error: profileError } = await (supabasePlumberClient as any)
        .from('profiles')
        .select(`*, role:roles(*)`)
        .eq('user_id', data.user.id)
        .single()

      if (profileError || profileData?.role?.slug !== 'plumber') {
        throw new Error('Zugriff verweigert. Nur Installateure können sich anmelden.')
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        firstName: profileData?.first_name || data.user.user_metadata?.first_name || '',
        lastName: profileData?.last_name || data.user.user_metadata?.last_name || '',
        fullName: profileData ? `${profileData.first_name} ${profileData.last_name}` : data.user.user_metadata?.full_name || '',
        role: 'plumber' as any,
        phone: profileData?.phone || '',
        avatar: profileData?.avatar_url || data.user.user_metadata?.avatar_url,
        createdAt: new Date(data.user.created_at),
        supabaseUser: data.user,
        profile: profileData,
        roleData: profileData?.role,
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
      }

      dispatch({ type: 'LOGIN_SUCCESS', payload: user })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Beim Anmelden ist ein Fehler aufgetreten'
      dispatch({ type: 'LOGIN_ERROR', payload: message })
      throw e
    }
  }

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabasePlumberClient.auth.signOut()
      if (error) console.error('Plumber logout error:', error)
    } catch (e) {
      console.error('Plumber logout error:', e)
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.USER)
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
      }
      dispatch({ type: 'LOGOUT' })
    }
  }

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const register = async (): Promise<void> => {
    throw new Error('Plumber registration not supported')
  }

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout: logout as () => void,
    clearError,
  }

  return <PlumberAuthContext.Provider value={value}>{children}</PlumberAuthContext.Provider>
}

export const usePlumberAuth = (): AuthContextType => {
  const ctx = useContext(PlumberAuthContext)
  if (ctx === undefined) throw new Error('usePlumberAuth must be used within a PlumberAuthProvider')
  return ctx
}


