'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft } from 'lucide-react'
import ProviderSelector from '@/components/payment/ProviderSelector'

function PaymentCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  const { cart, getTotalAmount, isLoading: cartLoading } = useCart()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'datatrans' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<{ total_amount: number; order_items: Array<{ id: string; product?: { name: string }; product_name?: string; quantity: number; price?: number; unit_price?: number }> } | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(false)

  const totalAmount = getTotalAmount()

  const loadOrder = useCallback(async () => {
    if (!orderId) return
    
    setLoadingOrder(true)
    try {
      const response = await fetch(`/api/orders?orderNumber=${orderId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.orders && data.orders.length > 0) {
          setOrder(data.orders[0])
        }
      }
    } catch (error) {
      console.error('Failed to load order:', error)
    } finally {
      setLoadingOrder(false)
    }
  }, [orderId])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/checkout')
    }
  }, [authLoading, isAuthenticated, router])

  // Load order if orderId is provided
  useEffect(() => {
    if (orderId) {
      loadOrder()
    } else if (!cartLoading && (!cart || cart.items.length === 0)) {
      // If no orderId and cart is empty, redirect to cart
      router.push('/cart')
    }
  }, [orderId, cart, cartLoading, loadOrder, router])

  const handleCreateOrder = async () => {
    if (!cart || cart.items.length === 0) {
      setError('Ihr Warenkorb ist leer')
      return null
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Get shipping address from somewhere (you might want to add a form for this)
      // For now, using placeholder data
      const orderData = {
        customerName: 'Test Customer', // This should come from user input
        customerEmail: 'test@example.com', // This should come from auth context
        customerPhone: '+41 79 123 45 67',
        shippingProvince: 'Zürich',
        shippingDistrict: 'Zürich',
        shippingPostalCode: '8001',
        shippingAddress: 'Bahnhofstrasse 1',
        totalAmount: totalAmount,
        items: cart.items.map(item => ({
          product: {
            id: item.product_id,
            name: item.product.name,
            slug: item.product.slug
          },
          quantity: item.quantity,
          price: item.price
        }))
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const result = await response.json()
      return result.orderId
    } catch (error) {
      console.error('Order creation error:', error)
      setError(error instanceof Error ? error.message : 'Fehler beim Erstellen der Bestellung')
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedProvider) {
      setError('Bitte wählen Sie eine Zahlungsmethode aus')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      let currentOrderId = orderId
      
      // Create order if we don't have one yet
      if (!currentOrderId) {
        currentOrderId = await handleCreateOrder()
        if (!currentOrderId) {
          return // Error already set
        }
      }

      // Create payment session
      const response = await fetch(`/api/payments/${selectedProvider}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: currentOrderId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler beim Erstellen der Zahlungssitzung')
      }

      const { redirectUrl } = await response.json()

      // Don't clear cart here - only clear after successful payment confirmation
      // This prevents cart loss if user abandons payment or payment fails
      
      // Redirect to payment provider
      window.location.href = redirectUrl
    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten')
      setIsProcessing(false)
    }
  }

  if (authLoading || cartLoading || loadingOrder) {
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

  const displayAmount = order ? order.total_amount : totalAmount
  const displayItems = order ? order.order_items : cart?.items

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/checkout" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Zurück zur Kasse
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Zahlung</h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <ProviderSelector
              selectedProvider={selectedProvider}
              onProviderSelect={setSelectedProvider}
              disabled={isProcessing}
            />

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handlePayment}
                disabled={!selectedProvider || isProcessing}
                className="w-full px-6 py-3 text-white font-medium rounded-md transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{backgroundColor: selectedProvider ? '#F39236' : '#d1d5db'}}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird verarbeitet...
                  </span>
                ) : (
                  'Weiter zur Zahlung'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bestellübersicht</h3>
              
              {/* Items */}
              {displayItems && displayItems.length > 0 && (
                <div className="space-y-3 mb-4">
                  {displayItems.map((item: { id: string; product?: { name: string }; product_name?: string; quantity: number; price?: number; unit_price?: number }) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.product?.name || item.product_name}
                        </p>
                        <p className="text-xs text-gray-500">Menge: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        CHF {((item.price || item.unit_price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              <hr className="border-gray-200 mb-4" />
              
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Zwischensumme:</span>
                  <span className="font-medium">CHF {displayAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Versand:</span>
                  <span className="font-medium text-green-600">Kostenlos</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Gesamtsumme:</span>
                  <span>CHF {displayAmount.toFixed(2)}</span>
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

export default function PaymentCheckoutPage() {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <PaymentCheckoutContent />
    </Suspense>
  )
}