'use client'

import { Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface WaitlistInfo {
  id: string
  product_slug: string
  product_id: string
  reason: string
  requires_manual_review: boolean
}

interface WaitlistAlertProps {
  waitlistInfo: WaitlistInfo
  productId: string
}

export default function WaitlistAlert({ waitlistInfo, productId }: WaitlistAlertProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center space-x-2">
        <Clock className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-medium text-yellow-800">
          Ausstehende Updates in der Warteliste
        </h3>
      </div>
      <p className="text-yellow-700 mt-2">
        Für dieses Produkt gibt es ausstehende Änderungen aufgrund von <strong>{waitlistInfo.reason?.replace('_', ' ')}</strong>.
      </p>
      <div className="mt-3 flex space-x-2">
        <Link
          href={`/admin/waitlist?product_id=${productId}`}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 transition-colors"
        >
          Warteliste anzeigen
        </Link>
        {waitlistInfo.requires_manual_review && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Manuelle Überprüfung erforderlich
          </span>
        )}
      </div>
    </div>
  )
}
