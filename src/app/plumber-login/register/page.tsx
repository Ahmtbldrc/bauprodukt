import { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Home } from 'lucide-react'
import { PlumberRegisterForm } from '@/components/auth'
import { PlumberAuthProvider } from '@/contexts/PlumberAuthContext'

export const metadata: Metadata = {
  title: 'Installateur Registrierung | Bauprodukt',
  description: 'Installateur-Konto erstellen'
}

export default function PlumberRegisterPage() {
  return (
    <PlumberAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 relative overflow-hidden">
        <div className="absolute top-6 left-6 z-10">
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-gray-600 hover:text-[#F39236] hover:border-[#F39236] transition-all duration-200 shadow-sm hover:shadow-md">
            <Home className="h-4 w-4 mr-2" />
            Zur Startseite
          </Link>
        </div>
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-lg">
            <Suspense fallback={null}>
              <PlumberRegisterForm />
            </Suspense>
          </div>
        </div>
      </div>
    </PlumberAuthProvider>
  )
}


