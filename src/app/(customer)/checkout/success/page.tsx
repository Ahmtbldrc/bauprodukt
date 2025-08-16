'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, AlertCircle, RefreshCw } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const provider = searchParams.get('provider')

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>('processing')
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    if (orderId) {
      pollOrderStatus()
    } else {
      setError('Keine Bestellnummer gefunden')
      setLoading(false)
    }
  }, [orderId])

  const pollOrderStatus = async () => {
    if (!orderId) return

    try {
      // Add cache-busting parameter to prevent caching issues
      const response = await fetch(`/api/orders/${orderId}?t=${Date.now()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }

      const orderData = await response.json()
      setOrder(orderData)

      console.log('Order status check:', {
        orderId,
        payment_status: orderData.payment_status,
        status: orderData.status,
        pollCount,
        timestamp: new Date().toISOString()
      })

      // Check payment status
      if (orderData.payment_status === 'paid') {
        setPaymentStatus('paid')
        setLoading(false)
      } else if (orderData.payment_status === 'failed' || orderData.payment_status === 'cancelled') {
        setPaymentStatus('failed')
        setError('Die Zahlung konnte nicht verarbeitet werden')
        setLoading(false)
      } else if (pollCount < 24) { // Poll for up to 120 seconds (24 * 5s) - increased timeout
        setTimeout(() => {
          setPollCount(prev => prev + 1)
          pollOrderStatus()
        }, 5000)
      } else {
        // Timeout after 120 seconds
        setPaymentStatus('timeout')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Fehler beim Laden der Bestelldaten')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="h-8 w-8 text-orange-600 animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Zahlung wird verarbeitet...
            </h1>
            <p className="text-gray-600 mb-6">
              Bitte warten Sie, während wir Ihre Zahlung bestätigen. Dies kann einige Sekunden dauern.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                <strong>Wichtig:</strong> Schließen Sie dieses Fenster nicht, bis die Zahlung bestätigt wurde.
              </p>
              <button 
                onClick={() => {
                  setPollCount(0)
                  pollOrderStatus()
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Status manuell aktualisieren
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || paymentStatus === 'failed') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Zahlung fehlgeschlagen
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'Es gab ein Problem bei der Verarbeitung Ihrer Zahlung.'}
            </p>
            
            <div className="space-x-4">
              <Link 
                href={`/checkout/payment?orderId=${orderId}`}
                className="inline-flex items-center px-6 py-3 text-white font-medium rounded-md transition-colors hover:opacity-90"
                style={{backgroundColor: '#F39236'}}
              >
                Erneut versuchen
              </Link>
              <Link 
                href="/cart" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Zum Warenkorb
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'timeout') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Zahlung wird noch verarbeitet
            </h1>
            <p className="text-gray-600 mb-6">
              Die Zahlungsbestätigung dauert länger als gewöhnlich. Ihre Zahlung wird möglicherweise noch verarbeitet.
            </p>
            
            {order && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-lg font-bold" style={{color: '#F39236'}}>
                  Bestellnummer: {order.order_number}
                </p>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Was Sie jetzt tun können:</strong><br />
                • Überprüfen Sie Ihre E-Mails für eine Bestätigung<br />
                • Kontaktieren Sie uns, wenn Sie keine Bestätigung erhalten<br />
                • Laden Sie diese Seite in ein paar Minuten neu
              </p>
            </div>
            
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 text-white font-medium rounded-md transition-colors hover:opacity-90"
                style={{backgroundColor: '#F39236'}}
              >
                Seite neu laden
              </button>
              <Link 
                href="/" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Zahlung erfolgreich!
          </h1>
          <p className="text-gray-600 mb-6">
            Vielen Dank für Ihre Bestellung. Die Zahlung wurde erfolgreich verarbeitet.
          </p>
          
          {order && (
            <>
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-2xl font-bold" style={{color: '#F39236'}}>
                  Bestellnummer: {order.order_number}
                </p>
                <p className="text-gray-600 mt-2">
                  Bezahlt über {provider === 'stripe' ? 'Stripe' : 'DataTrans (TWINT)'}
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 text-left">
                <h3 className="text-lg font-semibold mb-4">Bestellübersicht</h3>
                
                {order.order_items && order.order_items.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.product_name} (x{item.quantity})</span>
                        <span>CHF {item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <hr className="border-gray-200 mb-4" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Gesamtsumme:</span>
                  <span>CHF {order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Was passiert als nächstes?</strong><br />
              • Sie erhalten eine Bestätigungs-E-Mail mit allen Details<br />
              • Ihre Bestellung wird bearbeitet und versendet<br />
              • Sie erhalten eine Versandbestätigung mit Tracking-Informationen
            </p>
          </div>
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