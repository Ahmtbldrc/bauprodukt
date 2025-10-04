'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePlumberAuth } from '@/contexts/PlumberAuthContext'
import type { RegisterData } from '@/types/auth'
import { Wrench, Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle, Loader2 } from 'lucide-react'

export function PlumberRegisterForm() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = usePlumberAuth()

  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    acceptTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.firstName.trim()) errors.firstName = 'Vorname ist erforderlich'
    else if (formData.firstName.length < 2) errors.firstName = 'Vorname muss mindestens 2 Zeichen haben'
    if (!formData.lastName.trim()) errors.lastName = 'Nachname ist erforderlich'
    else if (formData.lastName.length < 2) errors.lastName = 'Nachname muss mindestens 2 Zeichen haben'
    if (!formData.email.trim()) errors.email = 'E-Mail-Adresse ist erforderlich'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    if (!formData.password.trim()) errors.password = 'Passwort ist erforderlich'
    else if (formData.password.length < 6) errors.password = 'Passwort muss mindestens 6 Zeichen haben'
    if (!formData.confirmPassword.trim()) errors.confirmPassword = 'Passwort-Bestätigung ist erforderlich'
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwörter stimmen nicht überein'
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^(\+41|0041|0)[0-9]{9}$/
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) errors.phone = 'Bitte geben Sie eine gültige Schweizer Telefonnummer ein'
    }
    if (!formData.acceptTerms) errors.acceptTerms = 'Sie müssen die Nutzungsbedingungen akzeptieren'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof RegisterData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors[field]) setValidationErrors(prev => ({ ...prev, [field]: '' }))
    if (error) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      await register(formData)
      router.push('/plumber')
    } catch {}
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#F39236] p-3 rounded-full"><Wrench className="h-8 w-8 text-white" /></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Installateur Registrierung</h1>
          <p className="text-gray-600">Installateur-Konto erstellen</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">Vorname</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input id="firstName" type="text" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationErrors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`} style={{ '--tw-ring-color': '#F3923620' } as React.CSSProperties} placeholder="Ihr Vorname" disabled={isLoading} />
              </div>
              {validationErrors.firstName && <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Nachname</label>
              <input id="lastName" type="text" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationErrors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`} style={{ '--tw-ring-color': '#F3923620' } as React.CSSProperties} placeholder="Ihr Nachname" disabled={isLoading} />
              {validationErrors.lastName && <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">E-Mail-Adresse</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
              <input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`} style={{ '--tw-ring-color': '#F3923620' } as React.CSSProperties} placeholder="plumber@email.com" disabled={isLoading} />
            </div>
            {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Telefonnummer <span className="text-gray-500">(Optional)</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-400" /></div>
              <input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`} style={{ '--tw-ring-color': '#F3923620' } as React.CSSProperties} placeholder="+41 79 123 45 67" disabled={isLoading} />
            </div>
            {validationErrors.phone && <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`} style={{ '--tw-ring-color': '#F3923620' } as React.CSSProperties} placeholder="Mindestens 6 Zeichen" disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center" disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                </button>
              </div>
              {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text sm font-medium text-gray-700 mb-2">Passwort bestätigen</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`} style={{ '--tw-ring-color': '#F3923620' } as React.CSSProperties} placeholder="Passwort wiederholen" disabled={isLoading} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center" disabled={isLoading}>
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                </button>
              </div>
              {validationErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>}
            </div>
          </div>

          <div>
            <label className="flex items-start space-x-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={formData.acceptTerms} onChange={(e) => handleInputChange('acceptTerms', e.target.checked)} className="sr-only" disabled={isLoading} />
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${formData.acceptTerms ? '' : validationErrors.acceptTerms ? 'border-red-300' : 'border-gray-300'}`} style={{ backgroundColor: formData.acceptTerms ? '#F39236' : 'transparent', borderColor: formData.acceptTerms ? '#F39236' : undefined }}>
                  {formData.acceptTerms && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div className="flex-1 text-sm text-gray-700">
                Ich habe die <Link href="/terms" className="font-medium" style={{ color: '#F39236' }}>Nutzungsbedingungen</Link> und die <Link href="/privacy" className="font-medium" style={{ color: '#F39236' }}>Datenschutzerklärung</Link> gelesen und akzeptiert.
              </div>
            </label>
            {validationErrors.acceptTerms && <p className="mt-1 text-sm text-red-600">{validationErrors.acceptTerms}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="w-full text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#F39236', '--tw-ring-color': '#F3923620' } as React.CSSProperties}>
            {isLoading ? (<div className="flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5 mr-2" /> Registrieren...</div>) : (<div className="flex items-center justify-center"><Wrench className="h-5 w-5 mr-2" /> Installateur registrieren</div>)}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <Link href="/plumber-login" className="font-medium transition-colors text-sm" style={{ color: '#F39236' }}>Installateur Login</Link>
        </div>
      </div>
    </div>
  )
}


