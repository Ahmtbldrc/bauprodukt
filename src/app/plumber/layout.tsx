'use client'

import React from 'react'
import { PlumberAuthProvider, usePlumberAuth } from '@/contexts/PlumberAuthContext'
import { PlumberSidebar } from '@/components/plumber/PlumberSidebar'
import { PlumberHeader } from '@/components/plumber/PlumberHeader'
import { useRouter, usePathname } from 'next/navigation'

function PlumberLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = usePlumberAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const redirect = encodeURIComponent(pathname || '/plumber')
        router.replace(`/plumber-login?redirect=${redirect}`)
      } else {
        const roleSlug = (user as any)?.roleData?.slug
        if (roleSlug !== 'plumber' && roleSlug !== 'admin') {
          router.replace('/unauthorized')
        }
      }
    }
  }, [isLoading, isAuthenticated, router, user, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Lade...</p>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex min-h-screen bg-[#eeeeee]">
      <PlumberSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <PlumberHeader />
        <main className="flex-1 pl-12 pr-6 py-6 overflow-auto">
          <div className="max-w-10xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function PlumberRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlumberAuthProvider>
      <PlumberLayoutInner>{children}</PlumberLayoutInner>
    </PlumberAuthProvider>
  )
}


