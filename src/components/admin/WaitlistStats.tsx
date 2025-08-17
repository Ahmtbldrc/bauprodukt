'use client'

import { useWaitlist } from '@/hooks/useWaitlist'
import { Clock, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'

export function WaitlistStats() {
  const { stats, isLoading } = useWaitlist()

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  // Stats null check
  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Statistiken konnten nicht geladen werden</p>
      </div>
    )
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Entries */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Einträge</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_entries || 0}</p>
          </div>
        </div>
      </div>

      {/* New Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Neue Produkte</p>
            <p className="text-2xl font-bold text-gray-900">{stats.new_products || 0}</p>
          </div>
        </div>
      </div>

      {/* Pending Updates */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Ausstehende Updates</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending_updates || 0}</p>
          </div>
        </div>
      </div>

      {/* Manual Review Required */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Manuelle Überprüfung</p>
            <p className="text-2xl font-bold text-gray-900">{stats.manual_review_required || 0}</p>
          </div>
        </div>
      </div>

      {/* Queue Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-gray-100 rounded-lg">
            <TrendingDown className="h-6 w-6 text-gray-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Queue Status</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthColor(stats.health_indicators?.queue_health || 'good')}`}>
              {stats.health_indicators?.queue_health === 'good' ? 'Gut' : 
               stats.health_indicators?.queue_health === 'warning' ? 'Warnung' : 'Kritisch'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
