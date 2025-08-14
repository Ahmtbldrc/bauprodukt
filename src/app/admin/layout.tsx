'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext'
import { AdminSearchProvider } from '@/contexts/AdminSearchContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface AdminRootLayoutProps {
  children: ReactNode
}

function AdminLayoutWrapper({ children }: AdminRootLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/admin-login')
      } else if (user?.role !== 'admin') {
        router.replace('/unauthorized')
      }
    }
  }, [isAuthenticated, user, isLoading, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Überprüfung der Berechtigung...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Weiterleitung...</p>
        </div>
      </div>
    )
  }

  // Render admin layout if user is authenticated and is admin
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  )
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return (
    <AdminAuthProvider>
      <AdminSearchProvider>
        <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
      </AdminSearchProvider>
    </AdminAuthProvider>
  )
} 