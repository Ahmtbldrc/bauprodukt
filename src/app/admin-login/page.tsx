import { Metadata } from 'next'
import Link from 'next/link'
import { AdminLoginForm } from '@/components/auth/AdminLoginForm'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { Home, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Anmelden | Bauprodukt',
  description: 'Admin-Panel Anmeldung für Bauprodukt'
}

export default function AdminLoginPage() {
  return (
    <AdminAuthProvider>
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

        {/* Admin Panel Link - Sağ Üst Köşe */}
        <div className="absolute top-6 right-6 z-10">
          <Link 
            href="/admin" 
            className="inline-flex items-center px-4 py-2 bg-[#F39236]/80 backdrop-blur-sm border border-[#F39236] rounded-lg text-white hover:bg-[#E8832B] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin Panel
          </Link>
        </div>

        {/* Login Form */}
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md">
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </AdminAuthProvider>
  )
}
