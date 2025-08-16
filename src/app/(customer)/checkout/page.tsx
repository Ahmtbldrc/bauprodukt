'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, CreditCard, User } from 'lucide-react'
import ProviderSelector from '@/components/payment/ProviderSelector'

interface Address {
  id?: string
  type: 'shipping' | 'billing'
  recipientName: string
  email: string
  phone: string
  province: string
  district: string
  postalCode: string
  address: string
  isDefault?: boolean
}


interface CheckoutFormData {
  // Address Selection
  selectedShippingAddress: string | null // 'new' or address ID
  selectedBillingAddress: string | null // 'new' or address ID
  
  // New Address Data (if creating new)
  newAddress: Address
  
  // Order Notes
  notes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getTotalAmount, isLoading } = useCart()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'datatrans' | null>(null)
  
  // Store previous selections to restore if dialog is closed without saving
  const [previousShippingAddress, setPreviousShippingAddress] = useState<string | null>(null)
  
  // Mock data for saved addresses and payment methods
  const [savedAddresses] = useState<Address[]>([
    {
      id: '1',
      type: 'shipping',
      recipientName: 'Max Mustermann',
      email: 'max.mustermann@example.com',
      phone: '+41 79 123 45 67',
      province: 'Zürich',
      district: 'Zürich',
      postalCode: '8001',
      address: 'Bahnhofstrasse 1',
      isDefault: true
    },
    {
      id: '2',
      type: 'shipping',
      recipientName: 'Anna Schmidt',
      email: 'anna.schmidt@example.com',
      phone: '+41 76 987 65 43',
      province: 'Bern',
      district: 'Bern-Mittelland',
      postalCode: '3000',
      address: 'Marktgasse 15',
      isDefault: false
    }
  ])
  
  const [addressesScrollPosition, setAddressesScrollPosition] = useState(0)
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    selectedShippingAddress: '1', // Default to first address
    selectedBillingAddress: null,
    newAddress: {
      type: 'shipping',
      recipientName: '',
      email: '',
      phone: '',
      province: '',
      district: '',
      postalCode: '',
      address: ''
    },
    notes: ''
  })



  const totalAmount = getTotalAmount()

  // Redirect if cart is empty or user is not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/checkout')
      return
    }
    
    if (!isLoading && (!cart || cart.items.length === 0)) {
      router.push('/cart')
    }
  }, [cart, isLoading, authLoading, isAuthenticated, router])

  // Set default selections after authentication check
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && savedAddresses.length > 0) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0]
      if (defaultAddress) {
        setFormData(prev => ({
          ...prev,
          selectedShippingAddress: defaultAddress.id!,
          // Keep newAddress empty for new entries
          newAddress: {
            type: 'shipping',
            recipientName: '',
            email: '',
            phone: '',
            province: '',
            district: '',
            postalCode: '',
            address: ''
          }
        }))
      }
    }
    
  }, [authLoading, isAuthenticated, savedAddresses])

  function handleInputChange(field: 'newAddress', value: Address): void
  function handleInputChange(
    field: 'selectedShippingAddress' | 'selectedBillingAddress',
    value: string | null
  ): void
  function handleInputChange(field: 'notes', value: string): void
  function handleInputChange(field: keyof CheckoutFormData, value: unknown): void {
    setFormData(prev => {
      if (field === 'newAddress') {
        return {
          ...prev,
          newAddress: value as Address
        }
      } else {
        return {
          ...prev,
          [field]: value as string | null
        } as CheckoutFormData
      }
    })
  }

  const handleAddressSelect = (addressId: string) => {
    const selectedAddress = savedAddresses.find(addr => addr.id === addressId)
    if (selectedAddress) {
      setFormData(prev => ({
        ...prev,
        selectedShippingAddress: addressId,
        newAddress: { ...selectedAddress }
      }))
    }
  }

  const handleNewAddressSelect = () => {
    // Store current selection before switching to new
    setPreviousShippingAddress(formData.selectedShippingAddress)
    setFormData(prev => ({
      ...prev,
      selectedShippingAddress: 'new',
      newAddress: {
        type: 'shipping',
        recipientName: '',
        email: '',
        phone: '',
        province: '',
        district: '',
        postalCode: '',
        address: ''
      }
    }))
  }



  const scrollAddresses = (direction: 'left' | 'right') => {
    const container = document.getElementById('addresses-container')
    if (container) {
      const scrollAmount = 200 // Scroll 200px at a time
      const currentScroll = container.scrollLeft
      const newPosition = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount)
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' })
    }
  }


  // Track addresses scroll position for button states
  React.useEffect(() => {
    const container = document.getElementById('addresses-container')
    if (container) {
      const handleScroll = () => {
        setAddressesScrollPosition(container.scrollLeft)
      }
      
      container.addEventListener('scroll', handleScroll)
      
      // Initial check
      handleScroll()
      
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [savedAddresses.length])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Check if a shipping address is selected or new address is filled
    if (!formData.selectedShippingAddress) {
      errors.shippingAddress = 'Bitte wählen Sie eine Lieferadresse aus oder fügen Sie eine neue hinzu'
    } else if (formData.selectedShippingAddress === 'new') {
      // Validate new address fields
      if (!formData.newAddress.recipientName.trim()) {
        errors.recipientName = 'Vollständiger Name ist erforderlich'
      }
      if (!formData.newAddress.email.trim()) {
        errors.email = 'E-Mail-Adresse ist erforderlich'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newAddress.email)) {
        errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
      }
      if (!formData.newAddress.phone.trim()) {
        errors.phone = 'Telefonnummer ist erforderlich'
      }
      if (!formData.newAddress.province.trim()) {
        errors.province = 'Kanton/Provinz ist erforderlich'
      }
      if (!formData.newAddress.district.trim()) {
        errors.district = 'Bezirk/Distrikt ist erforderlich'
      }
      if (!formData.newAddress.postalCode.trim()) {
        errors.postalCode = 'Postleitzahl ist erforderlich'
      }
      if (!formData.newAddress.address.trim()) {
        errors.address = 'Vollständige Adresse ist erforderlich'
      }
    }
    
    // Check if a payment provider is selected
    if (!selectedProvider) {
      errors.paymentProvider = 'Bitte wählen Sie einen Zahlungsanbieter aus'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Check if form is valid for button state
  const isFormValid = (): boolean => {
    // Check if a shipping address is selected
    if (!formData.selectedShippingAddress) {
      return false
    }
    
    // If new address is selected, validate all required fields
    if (formData.selectedShippingAddress === 'new') {
      const addressValid = formData.newAddress.recipientName.trim() !== '' &&
                          formData.newAddress.email.trim() !== '' &&
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newAddress.email) &&
                          formData.newAddress.phone.trim() !== '' &&
                          formData.newAddress.province.trim() !== '' &&
                          formData.newAddress.district.trim() !== '' &&
                          formData.newAddress.postalCode.trim() !== '' &&
                          formData.newAddress.address.trim() !== ''
      
      if (!addressValid) {
        return false
      }
    }
    
    // Check if a payment provider is selected
    if (!selectedProvider) {
      return false
    }
    
    return true
  }

  const handleSubmitOrder = async () => {
    if (!cart || cart.items.length === 0) return
    
    // Form validation
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Get address data based on selection
      let shippingAddress: Address
      if (formData.selectedShippingAddress === 'new') {
        shippingAddress = formData.newAddress
      } else {
        const selectedAddress = savedAddresses.find(addr => addr.id === formData.selectedShippingAddress)
        if (!selectedAddress) {
          throw new Error('Selected address not found')
        }
        shippingAddress = selectedAddress
      }
      
      const billingAddress = formData.selectedBillingAddress === 'new' 
        ? formData.newAddress 
        : shippingAddress // Use same address if not specified
      
      // Transform cart items to match orders API structure
      const orderItems = cart.items.map(item => ({
        product: {
          id: item.product_id,
          name: item.product.name,
          slug: item.product.slug
        },
        quantity: item.quantity,
        price: item.price
      }))
      
      const orderData = {
        customerName: shippingAddress.recipientName,
        customerEmail: shippingAddress.email,
        customerPhone: shippingAddress.phone,
        shippingProvince: shippingAddress.province,
        shippingDistrict: shippingAddress.district,
        shippingPostalCode: shippingAddress.postalCode,
        shippingAddress: shippingAddress.address,
        billingProvince: billingAddress.province,
        billingDistrict: billingAddress.district,
        billingPostalCode: billingAddress.postalCode,
        billingAddress: billingAddress.address,
        notes: formData.notes,
        totalAmount: totalAmount,
        items: orderItems
      }

      console.log('Shipping address:', shippingAddress)
      console.log('Billing address:', billingAddress)
      console.log('Selected provider:', selectedProvider)

      console.log('Submitting order data:', orderData)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Create payment session directly with selected provider
        const paymentResponse = await fetch(`/api/payments/${selectedProvider}/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: result.orderId,
          }),
        })

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json()
          throw new Error(errorData.error || 'Fehler beim Erstellen der Zahlungssitzung')
        }

        const { redirectUrl } = await paymentResponse.json()

        // Redirect to payment provider
        window.location.href = redirectUrl
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Order API error:', errorData)
        console.error('Response status:', response.status)
        console.error('Response headers:', Object.fromEntries(response.headers.entries()))
        throw new Error(errorData.error || `Failed to create order (Status: ${response.status})`)
      }
    } catch (error) {
      console.error('Order submission error:', error)
      alert(`Fehler beim Erstellen der Bestellung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}. Bitte versuchen Sie es erneut.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || authLoading) {
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



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-6 w-6" style={{color: '#F39236'}} />
                <h2 className="text-xl font-semibold text-gray-900">Kundeninformationen & Adresse</h2>
              </div>
                
                {/* Saved Addresses Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Gespeicherte Adressen</h3>
                  
                  {validationErrors.shippingAddress && (
                    <p className="text-sm text-red-600 mb-3">{validationErrors.shippingAddress}</p>
                  )}
                  
                  {/* Saved Addresses */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Gespeicherte Adressen</h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => scrollAddresses('left')}
                            disabled={addressesScrollPosition <= 0}
                            className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollAddresses('right')}
                            disabled={addressesScrollPosition >= (savedAddresses.length * 200 - 500)}
                            className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div 
                        id="addresses-container"
                        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {savedAddresses.map((address) => (
                          <div
                            key={address.id}
                            className={`flex-shrink-0 w-48 p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.selectedShippingAddress === address.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleAddressSelect(address.id!)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <input
                                type="radio"
                                name="shippingAddress"
                                checked={formData.selectedShippingAddress === address.id}
                                onChange={() => handleAddressSelect(address.id!)}
                                className="h-3 w-3 text-red-700 focus:ring-red-700 border-gray-300"
                                style={{accentColor: '#A63F35'}}
                              />
                              {address.isDefault && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: '#F3923620', color: '#F39236'}}>
                                  Standard
                                </span>
                              )}
                            </div>
                            <div className="text-center">
                              <h5 className="font-medium text-gray-900 text-sm mb-1">{address.recipientName}</h5>
                              <p className="text-xs text-gray-600 mb-1">{address.address}</p>
                              <p className="text-xs text-gray-500">{address.postalCode} {address.district}</p>
                              <p className="text-xs text-gray-500">{address.province}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      handleNewAddressSelect()
                      setShowAddressDialog(true)
                    }}
                    className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors hover:opacity-90"
                    style={{backgroundColor: '#F39236'}}
                  >
                    Neue Adresse hinzufügen
                  </button>
                </div>
                

                
                                  
                  {/* Payment Provider Selection */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <CreditCard className="h-6 w-6" style={{color: '#F39236'}} />
                      <h2 className="text-xl font-semibold text-gray-900">Zahlungsanbieter wählen</h2>
                    </div>
                    
                    {validationErrors.paymentProvider && (
                      <p className="text-sm text-red-600 mb-3">{validationErrors.paymentProvider}</p>
                    )}
                    
                    <ProviderSelector
                      selectedProvider={selectedProvider}
                      onProviderSelect={setSelectedProvider}
                      disabled={isSubmitting}
                    />
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
              
              {/* Order Submit Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || !isFormValid()}
                  className="w-full px-6 py-3 text-white font-medium rounded-md transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{backgroundColor: isFormValid() ? '#F39236' : '#d1d5db'}}
                >
                  {isSubmitting ? 'Wird verarbeitet...' : 'Zur Zahlung'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Dialog */}
      {showAddressDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-md bg-gray-900/20 transition-all duration-300 opacity-100"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={() => {
              // Restore previous selection when closing without saving
              if (previousShippingAddress) {
                setFormData(prev => ({
                  ...prev,
                  selectedShippingAddress: previousShippingAddress
                }))
              }
              setShowAddressDialog(false)
            }}
          />
          
          {/* Dialog */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 transform opacity-100 scale-100 translate-y-0 border border-white/20">
            {/* Close Button */}
            <button
              onClick={() => {
                // Restore previous selection when closing without saving
                if (previousShippingAddress) {
                  setFormData(prev => ({
                    ...prev,
                    selectedShippingAddress: previousShippingAddress
                  }))
                }
                setShowAddressDialog(false)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <User className="h-6 w-6" style={{color: '#F39236'}} />
              <h2 className="text-xl font-semibold text-gray-900">Neue Adresse hinzufügen</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vollständiger Name *
                  </label>
                  <input
                    type="text"
                    value={formData.newAddress.recipientName}
                    onChange={(e) => handleInputChange('newAddress', {...formData.newAddress, recipientName: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.recipientName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="Max Mustermann"
                    maxLength={50}
                    minLength={2}
                    pattern="[A-Za-zÄäÖöÜüß\s]+"
                    title="Nur Buchstaben und Leerzeichen erlaubt"
                    required
                  />
                  {validationErrors.recipientName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.recipientName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    value={formData.newAddress.email}
                    onChange={(e) => handleInputChange('newAddress', {...formData.newAddress, email: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="max.mustermann@example.com"
                    maxLength={100}
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    title="Bitte geben Sie eine gültige E-Mail-Adresse ein"
                    required
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefonnummer *
                </label>
                <input
                  type="tel"
                  value={formData.newAddress.phone}
                  onChange={(e) => handleInputChange('newAddress', {...formData.newAddress, phone: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                  placeholder="+41 79 123 45 67"
                  maxLength={20}
                  pattern="[\+]?[0-9\s\-\(\)]+"
                  title="Bitte geben Sie eine gültige Telefonnummer ein"
                  required
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kanton/Provinz *
                  </label>
                  <input
                    type="text"
                    value={formData.newAddress.province}
                    onChange={(e) => handleInputChange('newAddress', {...formData.newAddress, province: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.province ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="Zürich"
                    maxLength={30}
                    minLength={2}
                    pattern="[A-Za-zÄäÖöÜüß\s]+"
                    title="Nur Buchstaben und Leerzeichen erlaubt"
                    required
                  />
                  {validationErrors.province && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.province}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bezirk/Distrikt *
                  </label>
                  <input
                    type="text"
                    value={formData.newAddress.district}
                    onChange={(e) => handleInputChange('newAddress', {...formData.newAddress, district: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.district ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="Zürich"
                    maxLength={30}
                    minLength={2}
                    pattern="[A-Za-zÄäÖöÜüß\s]+"
                    title="Nur Buchstaben und Leerzeichen erlaubt"
                    required
                  />
                  {validationErrors.district && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.district}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postleitzahl *
                  </label>
                  <input
                    type="text"
                    value={formData.newAddress.postalCode}
                    onChange={(e) => handleInputChange('newAddress', {...formData.newAddress, postalCode: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.postalCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="8001"
                    maxLength={10}
                    minLength={4}
                    pattern="[0-9]+"
                    title="Nur Zahlen erlaubt"
                    required
                  />
                  {validationErrors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.postalCode}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Straße und Hausnummer *
                </label>
                <input
                  type="text"
                  value={formData.newAddress.address}
                  onChange={(e) => handleInputChange('newAddress', {...formData.newAddress, address: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    validationErrors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                  placeholder="Bahnhofstrasse 1"
                  maxLength={100}
                  minLength={5}
                  required
                />
                {validationErrors.address && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  // Restore previous selection when canceling
                  if (previousShippingAddress) {
                    setFormData(prev => ({
                      ...prev,
                      selectedShippingAddress: previousShippingAddress
                    }))
                  }
                  setShowAddressDialog(false)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  if (validateForm()) {
                    setShowAddressDialog(false)
                  }
                }}
                className="px-4 py-2 text-white font-medium rounded-lg transition-colors hover:opacity-90"
                style={{backgroundColor: '#F39236'}}
              >
                Adresse speichern
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
