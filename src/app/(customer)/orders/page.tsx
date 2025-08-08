'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react'
import { OrderTracking } from '@/components/order'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_slug: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_province: string
  shipping_district: string
  shipping_postal_code: string
  shipping_address: string
  billing_province: string
  billing_district: string
  billing_postal_code: string
  billing_address: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  notes: string
  created_at: string
  updated_at: string
  order_items: OrderItem[]
}

const statusConfig = {
  pending: {
    label: 'Ausstehend',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  confirmed: {
    label: 'Bestätigt',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  processing: {
    label: 'In Bearbeitung',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  shipped: {
    label: 'Versendet',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  },
  delivered: {
    label: 'Zugestellt',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  cancelled: {
    label: 'Storniert',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchOrderNumber, setSearchOrderNumber] = useState('')
  const [searchMode, setSearchMode] = useState<'email' | 'orderNumber'>('email')

  const fetchOrders = async (email?: string, orderNumber?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (email) params.append('email', email)
      if (orderNumber) params.append('orderNumber', orderNumber)
      
      const response = await fetch(`/api/orders?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchMode === 'email' && searchEmail.trim()) {
      fetchOrders(searchEmail.trim())
    } else if (searchMode === 'orderNumber' && searchOrderNumber.trim()) {
      fetchOrders(undefined, searchOrderNumber.trim())
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    return `CHF ${price.toFixed(2)}`
  }

  const getStatusConfig = (status: Order['status']) => {
    return statusConfig[status]
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Zurück zur Startseite
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Meine Bestellungen</h1>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bestellung suchen</h2>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setSearchMode('email')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                searchMode === 'email'
                  ? 'text-white'
                  : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              style={searchMode === 'email' ? {backgroundColor: '#F39236'} : {}}
            >
              Nach E-Mail suchen
            </button>
            <button
              onClick={() => setSearchMode('orderNumber')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                searchMode === 'orderNumber'
                  ? 'text-white'
                  : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              style={searchMode === 'orderNumber' ? {backgroundColor: '#F39236'} : {}}
            >
              Nach Bestellnummer suchen
            </button>
          </div>

          <div className="flex gap-4">
            {searchMode === 'email' ? (
              <input
                type="email"
                placeholder="Ihre E-Mail-Adresse eingeben"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
              />
            ) : (
              <input
                type="text"
                placeholder="Bestellnummer eingeben (z.B. BP123456)"
                value={searchOrderNumber}
                onChange={(e) => setSearchOrderNumber(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
              />
            )}
            
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2 text-white font-medium rounded-md transition-colors hover:opacity-90 disabled:opacity-50"
              style={{backgroundColor: '#F39236'}}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{borderBottomColor: '#F39236'}}
            ></div>
            <p className="text-gray-600">Bestellungen werden gesucht...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && !error && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = getStatusConfig(order.status)
              const StatusIcon = status.icon
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Bestellung #{order.order_number}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${status.bgColor} ${status.color} ${status.borderColor}`}>
                          <div className="flex items-center gap-1">
                            <StatusIcon className="h-4 w-4" />
                            {status.label}
                          </div>
                        </div>
                        <p className="text-lg font-bold" style={{color: '#F39236'}}>
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Bestellte Artikel</h4>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-500">
                              Menge: {item.quantity} × {formatPrice(item.unit_price)}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.total_price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                                     {/* Order Tracking */}
                   <div className="p-6 bg-gray-50">
                     <OrderTracking
                       status={order.status}
                       orderNumber={order.order_number}
                       createdAt={order.created_at}
                       updatedAt={order.updated_at}
                     />
                   </div>

                   {/* Order Details */}
                   <div className="p-6 bg-gray-50">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <h4 className="font-medium text-gray-900 mb-3">Kundeninformationen</h4>
                         <div className="text-sm text-gray-600 space-y-1">
                           <p><strong>Name:</strong> {order.customer_name}</p>
                           <p><strong>E-Mail:</strong> {order.customer_email}</p>
                           <p><strong>Telefon:</strong> {order.customer_phone}</p>
                         </div>
                       </div>
                       
                       <div>
                         <h4 className="font-medium text-gray-900 mb-3">Lieferadresse</h4>
                         <div className="text-sm text-gray-600">
                           <p>{order.shipping_address}</p>
                           <p>{order.shipping_postal_code} {order.shipping_district}</p>
                           <p>{order.shipping_province}</p>
                         </div>
                       </div>
                     </div>
                     
                     {order.notes && (
                       <div className="mt-4 pt-4 border-t border-gray-200">
                         <h4 className="font-medium text-gray-900 mb-2">Bestellnotizen</h4>
                         <p className="text-sm text-gray-600">{order.notes}</p>
                       </div>
                     )}
                   </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && orders.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Keine Bestellungen gefunden
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchEmail || searchOrderNumber 
                ? 'Es wurden keine Bestellungen mit den angegebenen Kriterien gefunden.'
                : 'Geben Sie Ihre E-Mail-Adresse oder Bestellnummer ein, um Ihre Bestellungen zu finden.'
              }
            </p>
            {!(searchEmail || searchOrderNumber) && (
              <Link 
                href="/products" 
                className="inline-flex items-center px-6 py-3 text-white font-medium rounded-md transition-colors hover:opacity-90"
                style={{backgroundColor: '#F39236'}}
              >
                Produkte entdecken
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
