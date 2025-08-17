'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Package, Truck, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  status: string
  total_amount: number
  created_at: string
  tracking_url?: string
  tracking_number?: string
  expected_delivery_date?: string
}

export default function TrackingPage() {
  const params = useParams()
  const orderNumber = params.orderNumber as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trackingUrl, setTrackingUrl] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders?orderNumber=${orderNumber}`)
      
      if (!response.ok) {
        throw new Error('Sipariş bulunamadı')
      }
      
      const data = await response.json()
      
      if (data.orders && data.orders.length > 0) {
        setOrder(data.orders[0])
        if (data.orders[0].tracking_url) {
          setTrackingUrl(data.orders[0].tracking_url)
        }
        if (data.orders[0].tracking_number) {
          setTrackingNumber(data.orders[0].tracking_number)
        }
        if (data.orders[0].expected_delivery_date) {
          setExpectedDeliveryDate(data.orders[0].expected_delivery_date)
        }
      } else {
        setError('Sipariş bulunamadı')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [orderNumber])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trackingUrl.trim()) {
      setError('Kargo takip URL\'i gerekli')
      return
    }

    if (!trackingNumber.trim()) {
      setError('Sendungsnummer ist erforderlich')
      return
    }

    if (!expectedDeliveryDate.trim()) {
      setError('Voraussichtliches Lieferdatum ist erforderlich')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      // API endpoint'i çağır
      const response = await fetch('/api/orders/tracking', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_number: orderNumber,
          tracking_url: trackingUrl,
          tracking_number: trackingNumber,
          expected_delivery_date: expectedDeliveryDate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kargo takip URL\'i güncellenirken bir hata oluştu')
      }

      await response.json()
      setSuccessMessage('Versandinformationen wurden erfolgreich aktualisiert und Bestellung als "geliefert" markiert!')
      
      if (order) {
        setOrder({
          ...order,
          tracking_url: trackingUrl,
          tracking_number: trackingNumber,
          expected_delivery_date: expectedDeliveryDate,
          status: 'delivered' // Update status to delivered when tracking info is added
        })
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kargo takip URL\'i güncellenirken bir hata oluştu')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Bestellung wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Fehler</h1>
          <p className="text-gray-600 mb-8 text-lg">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  const hasTrackingInfo = !!(order.tracking_url && order.tracking_number && order.expected_delivery_date)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-base text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-3" />
            Zurück zur Startseite
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Versandverfolgung
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Versandverfolgung für Bestellung #{order.order_number}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
          {/* Order Information */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Bestelldetails</h2>
              
                                <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bestellnummer</dt>
                  <dd className="text-base text-gray-900 font-mono">{order.order_number}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Kundenname</dt>
                  <dd className="text-base text-gray-900">{order.customer_name}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
                  <dd className="text-base text-gray-900">{order.customer_email}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className={`text-base capitalize font-medium ${
                    order.status === 'delivered' 
                      ? 'text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-flex items-center' 
                      : order.status === 'confirmed'
                      ? 'text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-flex items-center'
                      : 'text-gray-900'
                  }`}>
                    {order.status}
                    {order.status === 'delivered' && (
                      <CheckCircle className="h-4 w-4 ml-2" />
                    )}
                    {order.status === 'confirmed' && (
                      <CheckCircle className="h-4 w-4 ml-2" />
                    )}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gesamtbetrag</dt>
                  <dd className="text-base text-gray-900 font-semibold">
                    {new Intl.NumberFormat('de-CH', {
                      style: 'currency',
                      currency: 'CHF'
                    }).format(order.total_amount)}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bestelldatum</dt>
                  <dd className="text-base text-gray-900">
                    {new Date(order.created_at).toLocaleDateString('de-CH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Form */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-green-100 rounded-full p-3">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Versandverfolgung</h2>
              </div>

              {hasTrackingInfo ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                                      <div className="flex items-start gap-4">
                      <CheckCircle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                                             <h3 className="text-base font-medium text-blue-900 mb-2">
                         Aktive Versandverfolgung verfügbar
                       </h3>
                       <p className="text-sm text-blue-700 mb-4">
                         Für diese Bestellung ist bereits eine Versandverfolgung definiert. 
                         Die bestehende Tracking-URL kann nicht geändert werden.
                       </p>
                      <div className="bg-white rounded-lg p-4 border border-blue-200 space-y-4">
                        <div>
                          <dt className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-2">
                            Sendungsnummer
                          </dt>
                          <dd className="text-xl font-mono text-blue-900 break-all">
                            {order.tracking_number}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-2">
                            Voraussichtliche Lieferung
                          </dt>
                          <dd className="text-xl text-blue-900">
                            {order.expected_delivery_date && new Date(order.expected_delivery_date).toLocaleDateString('de-DE', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-2">
                            Tracking-URL
                          </dt>
                          <dd className="text-lg font-mono text-blue-900 break-all">
                            {order.tracking_url}
                          </dd>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-base font-medium text-yellow-900 mb-2">
                        Versandverfolgung fehlt
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Für diese Bestellung ist noch keine Versandverfolgung definiert. 
                        Sie können sie mit dem untenstehenden Formular hinzufügen.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!hasTrackingInfo && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="trackingUrl" className="block text-base font-medium text-gray-700 mb-3">
                      Tracking-URL
                    </label>
                    <input
                      type="url"
                      id="trackingUrl"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://versand.example.ch/track/1234567890"
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Geben Sie die Tracking-URL von Ihrem Versandunternehmen ein
                    </p>
                  </div>

                  <div>
                    <label htmlFor="trackingNumber" className="block text-base font-medium text-gray-700 mb-3">
                      Sendungsnummer
                    </label>
                    <input
                      type="text"
                      id="trackingNumber"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="TRK123456789"
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Geben Sie die Sendungsnummer vom Versandunternehmen ein
                    </p>
                  </div>

                  <div>
                    <label htmlFor="expectedDeliveryDate" className="block text-base font-medium text-gray-700 mb-3">
                      Voraussichtliches Lieferdatum
                    </label>
                    <input
                      type="date"
                      id="expectedDeliveryDate"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Wählen Sie das voraussichtliche Lieferdatum
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-base text-red-700">{error}</p>
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-base text-green-700">{successMessage}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !trackingUrl.trim() || !trackingNumber.trim() || !expectedDeliveryDate.trim()}
                    className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-lg text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                     {submitting ? (
                       <>
                         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                         Wird aktualisiert...
                       </>
                     ) : (
                       'Versandinformationen hinzufügen'
                     )}
                   </button>
                </form>
              )}

              {hasTrackingInfo && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Versandstatus</h3>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-600">Überprüfen Sie den aktuellen Versandstatus auf der Website Ihres Versandunternehmens mit der Tracking-URL.</span>
                      <a 
                        href={order.tracking_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-base text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200"
                      >
                        Versandunternehmen Website →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
