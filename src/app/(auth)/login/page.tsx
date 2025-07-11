import { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth'
import { Home } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Anmelden | Bauprodukt',
  description: 'Melden Sie sich bei Ihrem Bauprodukt-Konto an'
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 relative overflow-hidden">


      {/* Ana Sayfaya Dön Butonu - Sol Üst Köşe */}
      <div className="absolute top-6 left-6 z-10">
        <Link 
          href="/" 
          className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-gray-600 hover:text-[#F39236] hover:border-[#F39236] transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Home className="h-4 w-4 mr-2" />
          Zur Startseite
        </Link>
      </div>

      {/* Login Form */}
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
} 