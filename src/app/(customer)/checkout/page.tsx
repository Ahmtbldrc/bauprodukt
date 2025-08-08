'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { ArrowLeft, Check, CreditCard, User, MapPin } from 'lucide-react'

interface CheckoutFormData {
  // Customer Information
  customerName: string
  customerEmail: string
  customerPhone: string
  
  // Shipping Address
  shippingProvince: string
  shippingDistrict: string
  shippingPostalCode: string
  shippingAddress: string
  
  // Billing Address (optional)
  useSameAddress: boolean
  billingProvince: string
  billingDistrict: string
  billingPostalCode: string
  billingAddress: string
  
  // Order Notes
  notes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getTotalAmount, clearCart, isLoading } = useCart()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingProvince: '',
    shippingDistrict: '',
    shippingPostalCode: '',
    shippingAddress: '',
    useSameAddress: true,
    billingProvince: '',
    billingDistrict: '',
    billingPostalCode: '',
    billingAddress: '',
    notes: ''
  })

  const totalAmount = getTotalAmount()

  // Redirect if cart is empty
  React.useEffect(() => {
    if (!isLoading && (!cart || cart.items.length === 0)) {
      router.push('/cart')
    }
  }, [cart, isLoading, router])

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmitOrder = async () => {
    if (!cart || cart.items.length === 0) return
    
    setIsSubmitting(true)
    
    try {
      const orderData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        shippingProvince: formData.shippingProvince,
        shippingDistrict: formData.shippingDistrict,
        shippingPostalCode: formData.shippingPostalCode,
        shippingAddress: formData.shippingAddress,
        billingProvince: formData.useSameAddress ? formData.shippingProvince : formData.billingProvince,
        billingDistrict: formData.useSameAddress ? formData.shippingDistrict : formData.billingDistrict,
        billingPostalCode: formData.useSameAddress ? formData.shippingPostalCode : formData.billingPostalCode,
        billingAddress: formData.useSameAddress ? formData.shippingAddress : formData.billingAddress,
        notes: formData.notes,
        totalAmount: totalAmount,
        items: cart.items
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const result = await response.json()
        setOrderNumber(result.orderNumber)
        setOrderSuccess(true)
        await clearCart() // Clear cart after successful order
      } else {
        throw new Error('Failed to create order')
      }
    } catch (error) {
      console.error('Order submission error:', error)
      alert('Fehler beim Erstellen der Bestellung. Bitte versuchen Sie es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{borderBottomColor: '#F39236'}}
            ></div>
            <p className="text-gray-600">Wird geladen...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Ihr Warenkorb ist leer</p>
          <Link href="/cart" className="hover:underline" style={{color: '#F39236'}}>
            Zum Warenkorb
          </Link>
        </div>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Bestellung erfolgreich!
            </h1>
            <p className="text-gray-600 mb-6">
              Vielen Dank für Ihre Bestellung. Ihre Bestellnummer ist:
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-2xl font-bold" style={{color: '#F39236'}}>
                {orderNumber}
              </p>
            </div>
            <p className="text-gray-600 mb-8">
              Sie erhalten eine Bestätigungs-E-Mail mit weiteren Details zu Ihrer Bestellung.
            </p>
          </div>
          
          <div className="space-x-4">
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 text-white font-medium rounded-md transition-colors hover:opacity-90"
              style={{backgroundColor: '#F39236'}}
            >
              Zur Startseite
            </Link>
            <Link 
              href="/products" 
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Weiter einkaufen
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/cart" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Zurück zum Warenkorb
        </Link>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'text-white' : 'text-gray-500'
            }`} style={{
              backgroundColor: currentStep >= 1 ? '#F39236' : '#f3f4f6'
            }}>
              1
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 1 ? 'text-gray-900' : 'text-gray-500'
            }`}>
              Kundeninformationen
            </span>
          </div>
          
          <div className="flex-1 h-px mx-4" style={{backgroundColor: currentStep >= 2 ? '#F39236' : '#e5e7eb'}}></div>
          
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'text-white' : 'text-gray-500'
            }`} style={{
              backgroundColor: currentStep >= 2 ? '#F39236' : '#f3f4f6'
            }}>
              2
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 2 ? 'text-gray-900' : 'text-gray-500'
            }`}>
              Lieferadresse
            </span>
          </div>
          
          <div className="flex-1 h-px mx-4" style={{backgroundColor: currentStep >= 3 ? '#F39236' : '#e5e7eb'}}></div>
          
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 3 ? 'text-white' : 'text-gray-500'
            }`} style={{
              backgroundColor: currentStep >= 3 ? '#F39236' : '#f3f4f6'
            }}>
              3
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 3 ? 'text-gray-900' : 'text-gray-500'
            }`}>
              Bestätigung
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {currentStep === 1 && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <User className="h-6 w-6" style={{color: '#F39236'}} />
                  <h2 className="text-xl font-semibold text-gray-900">Kundeninformationen</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vollständiger Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-Mail-Adresse *
                    </label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefonnummer *
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="h-6 w-6" style={{color: '#F39236'}} />
                  <h2 className="text-xl font-semibold text-gray-900">Lieferadresse</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kanton/Provinz *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingProvince}
                        onChange={(e) => handleInputChange('shippingProvince', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                        style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bezirk/Distrikt *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingDistrict}
                        onChange={(e) => handleInputChange('shippingDistrict', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                        style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postleitzahl *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingPostalCode}
                      onChange={(e) => handleInputChange('shippingPostalCode', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Straße und Hausnummer *
                    </label>
                    <textarea
                      value={formData.shippingAddress}
                      onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      required
                    />
                  </div>
                  
                  <div className="pt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.useSameAddress}
                        onChange={(e) => handleInputChange('useSameAddress', e.target.checked)}
                        className="rounded border-gray-300 text-[#F39236] focus:ring-[#F39236]"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Rechnungsadresse ist identisch mit Lieferadresse
                      </span>
                    </label>
                  </div>
                  
                  {!formData.useSameAddress && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Rechnungsadresse</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kanton/Provinz
                          </label>
                          <input
                            type="text"
                            value={formData.billingProvince}
                            onChange={(e) => handleInputChange('billingProvince', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bezirk/Distrikt
                          </label>
                          <input
                            type="text"
                            value={formData.billingDistrict}
                            onChange={(e) => handleInputChange('billingDistrict', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postleitzahl
                        </label>
                        <input
                          type="text"
                          value={formData.billingPostalCode}
                          onChange={(e) => handleInputChange('billingPostalCode', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                          style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Straße und Hausnummer
                        </label>
                        <textarea
                          value={formData.billingAddress}
                          onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                          style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="h-6 w-6" style={{color: '#F39236'}} />
                  <h2 className="text-xl font-semibold text-gray-900">Bestellübersicht</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Customer Information Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Kundeninformationen</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Name:</strong> {formData.customerName}</p>
                      <p><strong>E-Mail:</strong> {formData.customerEmail}</p>
                      <p><strong>Telefon:</strong> {formData.customerPhone}</p>
                    </div>
                  </div>
                  
                  {/* Shipping Address Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Lieferadresse</h3>
                    <div className="text-sm text-gray-600">
                      <p>{formData.shippingAddress}</p>
                      <p>{formData.shippingPostalCode} {formData.shippingDistrict}</p>
                      <p>{formData.shippingProvince}</p>
                    </div>
                  </div>
                  
                  {/* Order Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bestellnotizen (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      placeholder="Spezielle Anweisungen oder Kommentare zu Ihrer Bestellung..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Zurück
                  </button>
                )}
                
                <div className="ml-auto">
                  {currentStep < 3 ? (
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-2 text-white font-medium rounded-md transition-colors hover:opacity-90"
                      style={{backgroundColor: '#F39236'}}
                    >
                      Weiter
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting}
                      className="px-6 py-2 text-white font-medium rounded-md transition-colors hover:opacity-90 disabled:opacity-50"
                      style={{backgroundColor: '#F39236'}}
                    >
                      {isSubmitting ? 'Wird verarbeitet...' : 'Bestellung aufgeben'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bestellübersicht</h3>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Menge: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      CHF {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <hr className="border-gray-200 mb-4" />
              
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Zwischensumme:</span>
                  <span className="font-medium">CHF {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Versand:</span>
                  <span className="font-medium text-green-600">Kostenlos</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Gesamtsumme:</span>
                  <span>CHF {totalAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-6 text-sm text-gray-500">
                <p>• Kostenloser Versand</p>
                <p>• 15 Tage Rückgaberecht</p>
                <p>• Sichere Bezahlung</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
