'use client'

import React from 'react'
import { Clock, CheckCircle, Package, Truck, XCircle } from 'lucide-react'

interface OrderTrackingProps {
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  orderNumber: string
  createdAt: string
  updatedAt: string
}

const statusSteps = [
  { key: 'pending', label: 'Bestellung erhalten', icon: Clock, color: 'text-yellow-600' },
  { key: 'confirmed', label: 'Bestellung bestätigt', icon: CheckCircle, color: 'text-blue-600' },
  { key: 'processing', label: 'In Bearbeitung', icon: Package, color: 'text-orange-600' },
  { key: 'shipped', label: 'Versendet', icon: Truck, color: 'text-purple-600' },
  { key: 'delivered', label: 'Zugestellt', icon: CheckCircle, color: 'text-green-600' }
]

const cancelledStep = { key: 'cancelled', label: 'Storniert', icon: XCircle, color: 'text-red-600' }

export function OrderTracking({ status, orderNumber, createdAt, updatedAt }: OrderTrackingProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCurrentStepIndex = () => {
    if (status === 'cancelled') return -1
    return statusSteps.findIndex(step => step.key === status)
  }

  const currentStepIndex = getCurrentStepIndex()
  const isCancelled = status === 'cancelled'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Bestellung #{orderNumber}
        </h3>
        <p className="text-sm text-gray-500">
          Bestelldatum: {formatDate(createdAt)}
        </p>
        {updatedAt !== createdAt && (
          <p className="text-sm text-gray-500">
            Letzte Aktualisierung: {formatDate(updatedAt)}
          </p>
        )}
      </div>

      {isCancelled ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="h-6 w-6 text-red-600" />
          <div>
            <p className="font-medium text-red-900">Bestellung storniert</p>
            <p className="text-sm text-red-700">Diese Bestellung wurde storniert</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const StepIcon = step.icon
            const isCompleted = index <= currentStepIndex
            const isCurrent = index === currentStepIndex
            
            return (
              <div key={step.key} className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-green-100 border-2 border-green-200' 
                    : 'bg-gray-100 border-2 border-gray-200'
                }`}>
                  <StepIcon className={`h-4 w-4 ${
                    isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <p className={`font-medium ${
                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-gray-500 mt-1">
                      Aktueller Status
                    </p>
                  )}
                </div>
                
                {index < statusSteps.length - 1 && (
                  <div className={`flex-1 h-px ${
                    isCompleted ? 'bg-green-200' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
