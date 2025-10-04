import { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { PlumberLoginForm } from '@/components/auth/PlumberLoginForm'
import { PlumberAuthProvider } from '@/contexts/PlumberAuthContext'

export const metadata: Metadata = {
  title: 'Plumber Anmelden | Bauprodukt',
  description: 'Installateur Panel Anmeldung'
}

export default function PlumberLoginPage() {
  return (
    <PlumberAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 relative overflow-hidden">
        {/* Login Form */}
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md">
            <Suspense fallback={null}>
              <PlumberLoginForm />
            </Suspense>
            <div className="mt-6 text-center">
              <Link 
                href="/plumber-login/register" 
                className="font-medium transition-colors text-sm"
                style={{ color: '#F39236' }}
              >
                Installateur registrieren
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PlumberAuthProvider>
  )
}


