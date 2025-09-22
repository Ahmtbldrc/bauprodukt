'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePlumberAuth } from '@/contexts/PlumberAuthContext'
import type { LoginCredentials } from '@/types/auth'
import { Wrench, Eye, EyeOff, Mail, Lock, Loader2, Check } from 'lucide-react'
import Link from 'next/link'

export function PlumberLoginForm() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = usePlumberAuth()

  const [formData, setFormData] = useState<LoginCredentials>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('bauprodukt_plumber_remember_email')
    const rememberedPassword = localStorage.getItem('bauprodukt_plumber_remember_password')
    if (rememberedEmail && rememberedPassword) {
      setFormData({ email: rememberedEmail, password: rememberedPassword })
      setRememberMe(true)
    }
  }, [])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.email.trim()) errors.email = 'E-Mail-Adresse ist erforderlich'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    if (!formData.password.trim()) errors.password = 'Passwort ist erforderlich'
    else if (formData.password.length < 6) errors.password = 'Passwort muss mindestens 6 Zeichen haben'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors[field]) setValidationErrors(prev => ({ ...prev, [field]: '' }))
    if (error) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      await login(formData)
      if (rememberMe) {
        localStorage.setItem('bauprodukt_plumber_remember_email', formData.email)
        localStorage.setItem('bauprodukt_plumber_remember_password', formData.password)
      } else {
        localStorage.removeItem('bauprodukt_plumber_remember_email')
        localStorage.removeItem('bauprodukt_plumber_remember_password')
      }
      setTimeout(() => router.replace('/plumber'), 1000)
    } catch {
      // handled by context
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#F39236] p-3 rounded-full">
              <Wrench className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Installateur Login</h1>
          <p className="text-gray-600">Plumber paneline giriş</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">E-Mail-Adresse</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
                style={{ '--tw-ring-color': '#F3923620' } as React.CSSProperties}
                placeholder="plumber@bauprodukt.com"
                disabled={isLoading}
              />
            </div>
            {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
                style={{ '--tw-ring-color': '#F3923620' } as React.CSSProperties}
                placeholder="Passwort eingeben"
                disabled={isLoading}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center" disabled={isLoading}>
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
              </button>
            </div>
            {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
          </div>

          <div className="flex items-center justify-start">
            <label className="group flex items-center space-x-3 cursor-pointer py-2">
              <div className="relative">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only" disabled={isLoading} />
                <div
                  className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all duration-300 group-hover:shadow-md transform group-hover:scale-105 ${rememberMe ? 'shadow-lg' : 'border-gray-300 group-hover:border-gray-400'}`}
                  style={{ backgroundColor: rememberMe ? '#F39236' : 'transparent', borderColor: rememberMe ? '#F39236' : undefined, boxShadow: rememberMe ? '0 4px 12px rgba(243, 146, 54, 0.3)' : undefined }}
                >
                  {rememberMe && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
              <span className="text-sm text-gray-700">Angemeldet bleiben</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#F39236', '--tw-ring-color': '#F3923620' } as React.CSSProperties}
          >
            {isLoading ? (
              <div className="flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5 mr-2" /> Anmelden...</div>
            ) : (
              <div className="flex items-center justify-center"><Wrench className="h-5 w-5 mr-2" /> Installateur Anmelden</div>
            )}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="font-medium transition-colors text-sm"
            style={{ color: '#F39236' }}
          >
            Kunden-Login
          </Link>
        </div>
      </div>
    </div>
  )
}


