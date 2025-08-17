'use client'


import { WaitlistTable } from '@/components/admin/WaitlistTable'
import { WaitlistStats } from '@/components/admin/WaitlistStats'
import { Clock } from 'lucide-react'

export default function WaitlistPage() {

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warteliste</h1>
          <p className="text-gray-600">Verwaltung von Produktgenehmigungen und -aktualisierungen</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Ausstehende Genehmigungen</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <WaitlistStats />



      {/* Waitlist Table */}
      <WaitlistTable />
    </div>
  )
}
