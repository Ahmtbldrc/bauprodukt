'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { CartProvider } from '@/contexts/CartContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1F2937',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10B981',
                    border: '1px solid #059669',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#10B981',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#EF4444',
                    border: '1px solid #DC2626',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#EF4444',
                  },
                },
              }}
            />
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
} 