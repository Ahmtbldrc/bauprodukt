'use client'

import { useState } from 'react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
    setIsSubmitted(true)
    setEmail('')
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
    }, 3000)
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl p-8 lg:p-16 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Sol taraf - Başlık ve açıklama */}
              <div className="text-left space-y-8">
                <div>
                  <div className="inline-flex items-center px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-sm font-medium mb-4" style={{color: '#F39236'}}>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Newsletter-Abonnement
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                    Seien Sie der Erste, der von exklusiven Angeboten erfährt
                  </h2>
                  
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
                    Treten Sie unserem Newsletter bei, den Tausende von Kunden bevorzugen, und erfahren Sie von neuen Produkten und Sonderaktionen. Verpassen Sie keine exklusiven Rabatte und Angebote!
                  </p>
                </div>

                {/* Sosyal medya ve güvenlik */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 font-medium">Folgen Sie uns:</span>
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center cursor-pointer hover:from-purple-700 hover:to-pink-600 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>DSGVO-konform • Sichere Anmeldung • Jederzeit kündbar</span>
                  </div>
                </div>
              </div>

              {/* Sağ taraf - Form ve özellikler */}
              <div className="space-y-8">
                {isSubmitted ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 py-8 px-6 rounded-xl">
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-7 h-7 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold text-lg leading-relaxed">
                        Vielen Dank! Ihre Newsletter-Anmeldung wurde erfolgreich abgeschlossen.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Geben Sie Ihre E-Mail-Adresse ein"
                        required
                        className="flex-1 px-6 py-4 rounded-xl text-gray-900 text-lg border-2 border-gray-200 focus:outline-none transition-all"
                        style={{
                          borderColor: '#F39236',
                          boxShadow: 'inset 0 0 0 1px #F39236'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#F39236'
                          e.target.style.boxShadow = '0 0 0 4px #F3923625, inset 0 0 0 2px #F39236'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#F39236'
                          e.target.style.boxShadow = 'inset 0 0 0 1px #F39236'
                        }}
                      />
                      <button
                        type="submit"
                        className="text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 whitespace-nowrap shadow-md"
                        style={{backgroundColor: '#F39236'}}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E8832D')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F39236')}
                      >
                        Abonnieren
                      </button>
                    </form>
                    
                    <div className="grid grid-cols-1 gap-4 text-gray-600 text-sm">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#F39236" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium leading-relaxed">Wöchentliche Aktionen</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#F39236" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        <span className="font-medium leading-relaxed">Exklusive Rabatte</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#F39236" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-medium leading-relaxed">Neue Produktankündigungen</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    🔒 Wir teilen Ihre E-Mail-Adresse mit niemandem. Sie können sich jederzeit abmelden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 