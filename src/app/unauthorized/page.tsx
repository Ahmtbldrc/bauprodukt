import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Lock, Home, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Zugriff verweigert | Bauprodukt',
  description: 'Sie haben keine Berechtigung für diese Seite'
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <Lock className="h-12 w-12 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Zugriff verweigert
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            Sie haben keine Berechtigung für diese Seite. 
            Nur Administratoren können auf das Admin-Panel zugreifen.
          </p>

          {/* Actions */}
          <div className="space-y-4">
            <Link 
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#F39236] text-white font-medium rounded-lg hover:bg-[#E8832B] transition-colors duration-200"
            >
              <Home className="h-5 w-5 mr-2" />
              Zur Startseite
            </Link>

            <Link 
              href="/admin-login"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <Shield className="h-5 w-5 mr-2" />
              Admin Anmelden
            </Link>

            <Link 
              href="/login"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Zurück zum Login
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-700">
              <strong>Hinweis:</strong> Falls Sie glauben, dass Sie Zugriff haben sollten, 
              wenden Sie sich an den Administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
