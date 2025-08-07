'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import type { LoginCredentials } from '@/types/auth'
import { Eye, EyeOff, Mail, Lock, Loader2, Check, Shield, Settings } from 'lucide-react'

export function AdminLoginForm() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuth()

  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Load remembered credentials on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('bauprodukt_admin_remember_email')
    const rememberedPassword = localStorage.getItem('bauprodukt_admin_remember_password')
    
    if (rememberedEmail && rememberedPassword) {
      setFormData({
        email: rememberedEmail,
        password: rememberedPassword
      })
      setRememberMe(true)
    }
  }, [])

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.email.trim()) {
      errors.email = 'E-Mail-Adresse ist erforderlich'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    }

    if (!formData.password.trim()) {
      errors.password = 'Passwort ist erforderlich'
    } else if (formData.password.length < 6) {
      errors.password = 'Passwort muss mindestens 6 Zeichen haben'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle input change
  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Clear general error
    if (error) {
      clearError()
    }
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await login(formData)
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('bauprodukt_admin_remember_email', formData.email)
        localStorage.setItem('bauprodukt_admin_remember_password', formData.password)
      } else {
        localStorage.removeItem('bauprodukt_admin_remember_email')
        localStorage.removeItem('bauprodukt_admin_remember_password')
      }
      
      // Add a small delay to ensure the auth state is updated
      setTimeout(() => {
        router.replace('/admin') // Use replace instead of push to avoid navigation issues
      }, 1000)
    } catch (error) {
      // Error is handled by the context
      console.log('Admin login failed:', error)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#F39236] p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Anmelden</h1>
          <p className="text-gray-600">Zugriff auf das Admin-Panel</p>
        </div>

        {/* General Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail-Adresse
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  validationErrors.email 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white'
                }`}
                style={{
                  '--tw-ring-color': '#F3923620',
                  borderColor: validationErrors.email ? undefined : undefined,
                } as React.CSSProperties}
                onFocus={(e) => !validationErrors.email && (e.target.style.borderColor = '#F39236')}
                onBlur={(e) => !validationErrors.email && (e.target.style.borderColor = '#d1d5db')}
                placeholder="admin@bauprodukt.com"
                disabled={isLoading}
              />
            </div>
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Passwort
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  validationErrors.password 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white'
                }`}
                style={{
                  '--tw-ring-color': '#F3923620',
                } as React.CSSProperties}
                onFocus={(e) => !validationErrors.password && (e.target.style.borderColor = '#F39236')}
                onBlur={(e) => !validationErrors.password && (e.target.style.borderColor = '#d1d5db')}
                placeholder="Geben Sie Ihr Admin-Passwort ein"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between">
            <label className="group flex items-center space-x-3 cursor-pointer py-2">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                  disabled={isLoading}
                />
                <div 
                  className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all duration-300 group-hover:shadow-md transform group-hover:scale-105 ${
                    rememberMe 
                      ? 'shadow-lg' 
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: rememberMe ? '#F39236' : 'transparent',
                    borderColor: rememberMe ? '#F39236' : undefined,
                    boxShadow: rememberMe ? '0 4px 12px rgba(243, 146, 54, 0.3)' : undefined
                  }}
                >
                  {rememberMe && (
                    <Check className="w-4 h-4 text-white animate-in zoom-in duration-200" />
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  Angemeldet bleiben
                </span>
                <span className="text-xs text-gray-500">
                  Ihre Admin-Anmeldedaten werden sicher gespeichert
                </span>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{
              backgroundColor: '#F39236',
              '--tw-ring-color': '#F3923620',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#E8832B'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#F39236'
              }
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Anmelden...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Shield className="h-5 w-5 mr-2" />
                Admin Anmelden
              </div>
            )}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <Link 
              href="/login" 
              className="font-medium transition-colors text-sm"
              style={{ color: '#F39236' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#E8832B'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#F39236'}
            >
              Kunden-Login
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              href="/admin" 
              className="font-medium transition-colors text-sm flex items-center"
              style={{ color: '#F39236' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#E8832B'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#F39236'}
            >
              <Settings className="h-4 w-4 mr-1" />
              Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
