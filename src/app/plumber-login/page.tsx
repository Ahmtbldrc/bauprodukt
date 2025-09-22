import { Metadata } from 'next'
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
            <PlumberLoginForm />
          </div>
        </div>
      </div>
    </PlumberAuthProvider>
  )
}


