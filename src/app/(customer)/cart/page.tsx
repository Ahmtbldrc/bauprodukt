'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/MockCartContext'
import { CartItem, CartSummary } from '@/components/cart'
import { ShoppingBag, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'

export default function CartPage() {
  const { cart, isLoading, error } = useCart()
  const [isCouponOpen, setIsCouponOpen] = useState(false)

  const handleCheckout = () => {
    // TODO: Implement checkout flow
    console.log('Proceeding to checkout...')
    alert('Die Checkout-Funktion wird bald verfügbar sein!')
  }

  if (isLoading && !cart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{borderBottomColor: '#F39236'}}
            ></div>
            <p className="text-gray-600">Warenkorb wird geladen...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Fehler beim Laden des Warenkorbs: {error}</p>
          <Link href="/" className="hover:underline" style={{color: '#F39236'}}>
            Zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  const isEmpty = !cart || cart.items.length === 0

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Weiter einkaufen
        </Link>
      </div>

              <div className="flex items-center gap-3 mb-8">
        <ShoppingBag className="h-8 w-8" style={{color: '#F39236'}} />
        <h1 className="text-3xl font-bold text-gray-900">Mein Warenkorb</h1>
        {!isEmpty && (
          <span className="px-3 py-1 rounded-full text-sm font-medium" style={{backgroundColor: '#F3923620', color: '#F39236'}}>
            {cart.total_items} Artikel
          </span>
        )}
      </div>

      {isEmpty ? (
        /* Empty Cart */
        <div className="text-center py-16">
          <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Ihr Warenkorb ist leer
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Sie haben noch keine Artikel zu Ihrem Warenkorb hinzugefügt. Entdecken Sie unsere Produkte, um mit dem Einkaufen zu beginnen.
          </p>
          <div className="space-x-4">
            <Link 
              href="/products" 
              className="inline-flex items-center px-6 py-3 text-white font-medium rounded-md transition-colors hover:opacity-90"
              style={{backgroundColor: '#F39236'}}
            >
              Produkte entdecken
            </Link>
            <Link 
              href="/categories" 
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Kategorien
            </Link>
          </div>
        </div>
      ) : (
        /* Cart Content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Coupon Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button 
                onClick={() => setIsCouponOpen(!isCouponOpen)}
                className="w-full p-6 border-b border-gray-200 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Gutscheincode
                  </h2>
                  {isCouponOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {isCouponOpen && (
                <div className="p-6">
                  {/* Coupon Input Form */}
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      placeholder="Geben Sie Ihren Gutscheincode ein"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      onFocus={(e) => e.target.style.borderColor = '#F39236'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                    <button 
                      className="px-6 py-2 text-white font-medium rounded-md transition-colors hover:opacity-90"
                      style={{backgroundColor: '#F39236'}}
                    >
                      Anwenden
                    </button>
                  </div>
                  
                  {/* Available Coupons */}
                  <div>
                    <p className="text-sm text-gray-600 mb-3">Verfügbare Gutscheine:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div 
                        className="p-3 rounded-md cursor-pointer transition-colors hover:opacity-80" 
                        style={{backgroundColor: '#F3923620', border: '2px solid #F39236'}}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium" style={{color: '#F39236'}}>WELCOME10</p>
                            <p className="text-sm" style={{color: '#F39236'}}>10% Rabatt</p>
                          </div>
                          <button 
                            className="text-xs text-white px-2 py-1 rounded transition-colors hover:opacity-90"
                            style={{backgroundColor: '#F39236'}}
                          >
                            Anwenden
                          </button>
                        </div>
                      </div>
                      
                      <div 
                        className="p-3 rounded-md cursor-pointer transition-colors hover:opacity-80" 
                        style={{backgroundColor: '#F3923620', border: '2px solid #F39236'}}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium" style={{color: '#F39236'}}>FREESHIP</p>
                            <p className="text-sm" style={{color: '#F39236'}}>Kostenloser Versand</p>
                          </div>
                          <button 
                            className="text-xs text-white px-2 py-1 rounded transition-colors hover:opacity-90"
                            style={{backgroundColor: '#F39236'}}
                          >
                            Anwenden
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Applied Coupons */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Angewendete Gutscheine:</p>
                    <div className="text-sm text-gray-500">
                      Noch keine Gutscheine angewendet
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Artikel in Ihrem Warenkorb
                </h2>
              </div>
              <div className="p-6">
                {cart.items.map((item) => (
                  <CartItem 
                    key={item.id} 
                    item={item}
                    onQuantityChange={() => {
                      // Cart will be refreshed automatically by the CartItem component
                    }}
                    onRemove={() => {
                      // Cart will be refreshed automatically by the CartItem component
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <CartSummary 
                onCheckout={handleCheckout}
                className="shadow-sm border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}


    </div>
  )
} 