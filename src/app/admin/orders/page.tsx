'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Eye, Edit, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react'

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/orders')
      
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

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setIsUpdatingStatus(true)
    
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ))

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      alert('Fehler beim Aktualisieren des Bestellstatus')
    } finally {
      setIsUpdatingStatus(false)
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const closeOrderModal = () => {
    setSelectedOrder(null)
    setShowOrderModal(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{borderBottomColor: '#F39236'}}
          ></div>
          <p className="text-gray-600">Bestellungen werden geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">Fehler beim Laden der Bestellungen: {error}</p>
        <button 
          onClick={fetchOrders}
          className="px-4 py-2 text-white font-medium rounded-md transition-colors hover:opacity-90"
          style={{backgroundColor: '#F39236'}}
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bestellungen verwalten</h1>
        <p className="text-gray-600">Verwalten Sie alle Kundenbestellungen und deren Status</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nach Bestellnummer, Kundenname oder E-Mail suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
              style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            >
              <option value="all">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="confirmed">Bestätigt</option>
              <option value="processing">In Bearbeitung</option>
              <option value="shipped">Versendet</option>
              <option value="delivered">Zugestellt</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bestellnummer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gesamtbetrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const status = getStatusConfig(order.status)
                const StatusIcon = status.icon
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order.order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color} ${status.borderColor}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(order.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openOrderModal(order)}
                        className="text-gray-600 hover:text-gray-900 transition-colors mr-3"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openOrderModal(order)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Keine Bestellungen mit den angegebenen Kriterien gefunden.'
                : 'Noch keine Bestellungen vorhanden.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Bestellung #{selectedOrder.order_number}
                </h2>
                <button
                  onClick={closeOrderModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Customer Information */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Kundeninformationen</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>E-Mail:</strong> {selectedOrder.customer_email}</p>
                    <p><strong>Telefon:</strong> {selectedOrder.customer_phone}</p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Lieferadresse</h3>
                  <div className="text-sm text-gray-600">
                    <p>{selectedOrder.shipping_address}</p>
                    <p>{selectedOrder.shipping_postal_code} {selectedOrder.shipping_district}</p>
                    <p>{selectedOrder.shipping_province}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Bestellte Artikel</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
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

              {/* Status Update */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Status aktualisieren</h3>
                <div className="flex gap-2">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const StatusIcon = config.icon
                    const isCurrentStatus = selectedOrder.status === status
                    
                    return (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status as Order['status'])}
                        disabled={isUpdatingStatus || isCurrentStatus}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isCurrentStatus
                            ? `${config.bgColor} ${config.color} ${config.borderColor}`
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        } disabled:opacity-50`}
                      >
                        <div className="flex items-center gap-1">
                          <StatusIcon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Bestellnotizen</h3>
                  <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bestelldatum: {formatDate(selectedOrder.created_at)}</p>
                    <p className="text-sm text-gray-600">Letzte Aktualisierung: {formatDate(selectedOrder.updated_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{color: '#F39236'}}>
                      {formatPrice(selectedOrder.total_amount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
