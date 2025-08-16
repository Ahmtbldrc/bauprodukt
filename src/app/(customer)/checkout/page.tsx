'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Check, CreditCard, User } from 'lucide-react'

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

interface PaymentMethod {
  id?: string
  type: 'card' | 'bank_transfer'
  cardNumber?: string
  cardHolderName?: string
  expiryMonth?: string
  expiryYear?: string
  cvv?: string
  isDefault?: boolean
}

interface CheckoutFormData {
  // Address Selection
  selectedShippingAddress: string | null // 'new' or address ID
  selectedBillingAddress: string | null // 'new' or address ID
  
  // New Address Data (if creating new)
  newAddress: Address
  
  // Payment Method
  selectedPaymentMethod: string | null // 'new' or payment method ID
  newPaymentMethod: PaymentMethod
  
  // Order Notes
  notes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getTotalAmount, clearCart, isLoading } = useCart()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  
  // Store previous selections to restore if dialog is closed without saving
  const [previousShippingAddress, setPreviousShippingAddress] = useState<string | null>(null)
  const [previousPaymentMethod, setPreviousPaymentMethod] = useState<string | null>(null)
  
  // Credit card preview state
  const [showCardBack, setShowCardBack] = useState(false)
  
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
  
  const [savedPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      cardNumber: '**** **** **** 1234',
      cardHolderName: 'Max Mustermann',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      isDefault: true
    },
    {
      id: '2',
      type: 'card',
      cardNumber: '**** **** **** 5678',
      cardHolderName: 'Anna Schmidt',
      expiryMonth: '06',
      expiryYear: '2026',
      cvv: '456',
      isDefault: false
    }
  ])
  
  const [paymentMethodsScrollPosition, setPaymentMethodsScrollPosition] = useState(0)
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
    selectedPaymentMethod: '1', // Default to first payment method
    newPaymentMethod: {
      type: 'card',
      cardNumber: '',
      cardHolderName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: ''
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
    
    if (!authLoading && isAuthenticated && savedPaymentMethods.length > 0) {
      const defaultPaymentMethod = savedPaymentMethods.find(pm => pm.isDefault) || savedPaymentMethods[0]
      if (defaultPaymentMethod) {
        setFormData(prev => ({
          ...prev,
          selectedPaymentMethod: defaultPaymentMethod.id!,
          // Keep newPaymentMethod empty for new entries
          newPaymentMethod: {
            type: 'card',
            cardNumber: '',
            cardHolderName: '',
            expiryMonth: '',
            expiryYear: '',
            cvv: ''
          }
        }))
      }
    }
  }, [authLoading, isAuthenticated, savedAddresses, savedPaymentMethods])

  function handleInputChange(field: 'newAddress', value: Address): void
  function handleInputChange(field: 'newPaymentMethod', value: PaymentMethod): void
  function handleInputChange(
    field: 'selectedShippingAddress' | 'selectedBillingAddress' | 'selectedPaymentMethod',
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
      } else if (field === 'newPaymentMethod') {
        return {
          ...prev,
          newPaymentMethod: value as PaymentMethod
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

  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    const selectedPaymentMethod = savedPaymentMethods.find(pm => pm.id === paymentMethodId)
    if (selectedPaymentMethod) {
      setFormData(prev => ({
        ...prev,
        selectedPaymentMethod: paymentMethodId,
        newPaymentMethod: { ...selectedPaymentMethod }
      }))
    }
  }

  const handleNewPaymentMethodSelect = () => {
    // Store current selection before switching to new
    setPreviousPaymentMethod(formData.selectedPaymentMethod)
    setFormData(prev => ({
      ...prev,
      selectedPaymentMethod: 'new',
      newPaymentMethod: {
        type: 'card',
        cardNumber: '',
        cardHolderName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: ''
      }
    }))
  }

  // Format card number with spaces every 4 digits
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const scrollPaymentMethods = (direction: 'left' | 'right') => {
    const container = document.getElementById('payment-methods-container')
    if (container) {
      const scrollAmount = 200 // Scroll 200px at a time
      const currentScroll = container.scrollLeft
      const newPosition = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount)
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' })
    }
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

  // Track scroll position for button states
  React.useEffect(() => {
    const container = document.getElementById('payment-methods-container')
    if (container) {
      const handleScroll = () => {
        setPaymentMethodsScrollPosition(container.scrollLeft)
      }
      
      container.addEventListener('scroll', handleScroll)
      
      // Initial check
      handleScroll()
      
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [savedPaymentMethods.length])

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
    
    // Check if a payment method is selected or new payment method is filled
    if (!formData.selectedPaymentMethod) {
      errors.paymentMethod = 'Bitte wählen Sie eine Zahlungsmethode aus oder fügen Sie eine neue hinzu'
    } else if (formData.selectedPaymentMethod === 'new') {
      // Validate new payment method fields
      if (formData.newPaymentMethod.type === 'card') {
        if (!formData.newPaymentMethod.cardHolderName?.trim()) {
          errors.cardHolderName = 'Name auf der Karte ist erforderlich'
        }
        if (!formData.newPaymentMethod.cardNumber?.trim()) {
          errors.cardNumber = 'Kartennummer ist erforderlich'
        }
        if (!formData.newPaymentMethod.expiryMonth?.trim()) {
          errors.expiryMonth = 'Monat ist erforderlich'
        }
        if (!formData.newPaymentMethod.expiryYear?.trim()) {
          errors.expiryYear = 'Jahr ist erforderlich'
        }
        if (!formData.newPaymentMethod.cvv?.trim()) {
          errors.cvv = 'CVV ist erforderlich'
        }
      }
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
    
    // Check if a payment method is selected
    if (!formData.selectedPaymentMethod) {
      return false
    }
    
    // If new payment method is selected, validate required fields
    if (formData.selectedPaymentMethod === 'new') {
      if (formData.newPaymentMethod.type === 'card') {
        return (formData.newPaymentMethod.cardHolderName?.trim() || '') !== '' &&
               (formData.newPaymentMethod.cardNumber?.trim() || '') !== '' &&
               (formData.newPaymentMethod.expiryMonth?.trim() || '') !== '' &&
               (formData.newPaymentMethod.expiryYear?.trim() || '') !== '' &&
               (formData.newPaymentMethod.cvv?.trim() || '') !== ''
      }
      // For bank transfer, no additional validation needed
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
      console.log('Payment method:', formData.selectedPaymentMethod)

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
        // Redirect to payment page with order ID
        router.push(`/checkout/payment?orderId=${result.orderId}`)
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
                

                
                                  
                  {/* Payment Section */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <CreditCard className="h-6 w-6" style={{color: '#F39236'}} />
                      <h2 className="text-xl font-semibold text-gray-900">Zahlung & Bestätigung</h2>
                    </div>
                    
                    {/* Saved Payment Methods */}
                    {validationErrors.paymentMethod && (
                      <p className="text-sm text-red-600 mb-3">{validationErrors.paymentMethod}</p>
                    )}
                    
                    {savedPaymentMethods.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Gespeicherte Zahlungsmethoden</h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => scrollPaymentMethods('left')}
                              disabled={paymentMethodsScrollPosition <= 0}
                              className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollPaymentMethods('right')}
                              disabled={paymentMethodsScrollPosition >= (savedPaymentMethods.length * 200 - 500)}
                              className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div 
                          id="payment-methods-container"
                          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {savedPaymentMethods.map((paymentMethod) => (
                            <div
                              key={paymentMethod.id}
                              className={`flex-shrink-0 w-48 p-3 border rounded-lg cursor-pointer transition-colors ${
                                formData.selectedPaymentMethod === paymentMethod.id
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handlePaymentMethodSelect(paymentMethod.id!)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  checked={formData.selectedPaymentMethod === paymentMethod.id}
                                  onChange={() => handlePaymentMethodSelect(paymentMethod.id!)}
                                  className="h-3 w-3 text-red-700 focus:ring-red-700 border-gray-300"
                                  style={{accentColor: '#A63F35'}}
                                />
                                {paymentMethod.isDefault && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: '#F3923620', color: '#F39236'}}>
                                    Standard
                                  </span>
                                )}
                              </div>
                              <div className="text-center">
                                <h5 className="font-medium text-gray-900 text-sm mb-1">{paymentMethod.cardHolderName}</h5>
                                <p className="text-xs text-gray-600 mb-1">{paymentMethod.cardNumber}</p>
                                <p className="text-xs text-gray-500">{paymentMethod.expiryMonth}/{paymentMethod.expiryYear}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => {
                        handleNewPaymentMethodSelect()
                        setShowPaymentDialog(true)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors hover:opacity-90"
                      style={{backgroundColor: '#F39236'}}
                    >
                      Neue Zahlungsmethode hinzufügen
                    </button>
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

      {/* Payment Dialog */}
      {showPaymentDialog && (
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
              if (previousPaymentMethod) {
                setFormData(prev => ({
                  ...prev,
                  selectedPaymentMethod: previousPaymentMethod
                }))
              }
              setShowPaymentDialog(false)
            }}
          />
          
          {/* Dialog */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 transform opacity-100 scale-100 translate-y-0 border border-white/20">
            {/* Close Button */}
            <button
              onClick={() => {
                // Restore previous selection when closing without saving
                if (previousPaymentMethod) {
                  setFormData(prev => ({
                    ...prev,
                    selectedPaymentMethod: previousPaymentMethod
                  }))
                }
                setShowPaymentDialog(false)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-6 w-6" style={{color: '#F39236'}} />
              <h2 className="text-xl font-semibold text-gray-900">Neue Zahlungsmethode hinzufügen</h2>
            </div>
            
            {/* Credit Card Preview */}
            {formData.newPaymentMethod.type === 'card' && (
              <div className="mb-6">
                <div className="relative w-full max-w-sm mx-auto">
                  <div 
                    className={`relative w-full h-56 transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
                      showCardBack ? 'rotate-y-180' : ''
                    }`}
                    style={{transformStyle: 'preserve-3d'}}
                    onClick={() => setShowCardBack(!showCardBack)}
                  >
                    {/* Front of Card */}
                    <div 
                      className={`absolute w-full h-full rounded-xl p-6 text-white transition-all duration-300 ${
                        showCardBack ? 'opacity-0' : 'opacity-100'
                      }`}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)'
                      }}
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div className="text-2xl font-bold">Bauprodukt</div>
                        <div className="w-12 h-8 bg-white/20 rounded"></div>
                      </div>
                      
                      <div className="mb-6">
                        <div className="text-sm text-white/70 mb-2">Kartennummer</div>
                        <div className="text-xl font-mono tracking-wider">
                          {formData.newPaymentMethod.cardNumber || '•••• •••• •••• ••••'}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-sm text-white/70 mb-1">Karteninhaber</div>
                          <div className="text-lg font-medium">
                            {formData.newPaymentMethod.cardHolderName || 'VORNAME NACHNAME'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-white/70 mb-1">Gültig bis</div>
                          <div className="text-lg font-medium">
                            {formData.newPaymentMethod.expiryMonth && formData.newPaymentMethod.expiryYear 
                              ? `${formData.newPaymentMethod.expiryMonth}/${formData.newPaymentMethod.expiryYear}`
                              : 'MM/JJ'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Back of Card */}
                    <div 
                      className={`absolute w-full h-full rounded-xl p-6 text-white transition-all duration-300 ${
                        showCardBack ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <div className="w-full h-12 bg-black/30 mb-6"></div>
                      
                      <div className="flex justify-end mb-6">
                        <div className="w-16 h-10 bg-white rounded flex items-center justify-center">
                          <span className="text-black text-sm font-bold">
                            {formData.newPaymentMethod.cvv || '•••'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-center text-sm text-white/70">
                        Bauprodukt Bank
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kartentyp
                  </label>
                  <select
                    value={formData.newPaymentMethod.type}
                    onChange={(e) => handleInputChange('newPaymentMethod', {...formData.newPaymentMethod, type: e.target.value as 'card' | 'bank_transfer'})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                  >
                    <option value="card">Kreditkarte</option>
                    <option value="bank_transfer">Banküberweisung</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name auf der Karte *
                  </label>
                  <input
                    type="text"
                    value={formData.newPaymentMethod.cardHolderName}
                    onChange={(e) => handleInputChange('newPaymentMethod', {...formData.newPaymentMethod, cardHolderName: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.cardHolderName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="MAX MUSTERMANN"
                    maxLength={50}
                    minLength={2}
                    pattern="[A-Za-zÄäÖöÜüß\s]+"
                    title="Nur Buchstaben und Leerzeichen erlaubt"
                    required
                  />
                  {validationErrors.cardHolderName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.cardHolderName}</p>
                  )}
                </div>
              </div>
              
              {formData.newPaymentMethod.type === 'card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kartennummer *
                    </label>
                    <input
                      type="text"
                      value={formData.newPaymentMethod.cardNumber}
                      onChange={(e) => handleInputChange('newPaymentMethod', {...formData.newPaymentMethod, cardNumber: formatCardNumber(e.target.value)})}
                      onFocus={() => setShowCardBack(false)}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                        validationErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      minLength={16}
                      pattern="[0-9 ]+"
                      title="Bitte geben Sie eine gültige Kartennummer ein (16-19 Ziffern)"
                      required
                    />
                    {validationErrors.cardNumber && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.cardNumber}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monat *
                      </label>
                      <select
                        value={formData.newPaymentMethod.expiryMonth}
                        onChange={(e) => handleInputChange('newPaymentMethod', {...formData.newPaymentMethod, expiryMonth: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                          validationErrors.expiryMonth ? 'border-red-500' : 'border-gray-300'
                        }`}
                        style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                        required
                      >
                        <option value="">MM</option>
                        {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      {validationErrors.expiryMonth && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.expiryMonth}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jahr *
                      </label>
                      <select
                        value={formData.newPaymentMethod.expiryYear}
                        onChange={(e) => handleInputChange('newPaymentMethod', {...formData.newPaymentMethod, expiryYear: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                          validationErrors.expiryYear ? 'border-red-500' : 'border-gray-300'
                        }`}
                        style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                        required
                      >
                        <option value="">JJJJ</option>
                        {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      {validationErrors.expiryYear && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.expiryYear}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV *
                    </label>
                    <input
                      type="text"
                      value={formData.newPaymentMethod.cvv}
                      onChange={(e) => handleInputChange('newPaymentMethod', {...formData.newPaymentMethod, cvv: e.target.value})}
                      onFocus={() => setShowCardBack(true)}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                        validationErrors.cvv ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      placeholder="123"
                      maxLength={4}
                      minLength={3}
                      pattern="[0-9]+"
                      title="Nur 3-4 Ziffern erlaubt"
                      required
                    />
                    {validationErrors.cvv && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.cvv}</p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  // Restore previous selection when canceling
                  if (previousPaymentMethod) {
                    setFormData(prev => ({
                      ...prev,
                      selectedPaymentMethod: previousPaymentMethod
                    }))
                  }
                  setShowPaymentDialog(false)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  if (validateForm()) {
                    setShowPaymentDialog(false)
                  }
                }}
                className="px-4 py-2 text-white font-medium rounded-lg transition-colors hover:opacity-90"
                style={{backgroundColor: '#F39236'}}
              >
                Zahlungsmethode speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
