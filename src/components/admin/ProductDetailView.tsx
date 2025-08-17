'use client'

import { useState } from 'react'
import { WaitlistEntry } from '@/types/waitlist'
import { createDiffSummary, generateTextSummary, DiffSummary } from '@/lib/waitlist/diff'
import { Clock, AlertTriangle, CheckCircle, XCircle, Package, Edit, TrendingUp, TrendingDown, Minus, Plus, X } from 'lucide-react'

interface ProductDetailViewProps {
  entry: WaitlistEntry
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  isProcessing: boolean
  onClose: () => void
}

export function ProductDetailView({ 
  entry, 
  onApprove, 
  onReject, 
  isProcessing, 
  onClose 
}: ProductDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'changes'>('summary')

  const getStatusIcon = (entry: WaitlistEntry) => {
    if (entry.requires_manual_review) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
    if (entry.has_invalid_discount) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    return <Clock className="h-4 w-4 text-blue-500" />
  }

  const getStatusText = (entry: WaitlistEntry) => {
    if (entry.requires_manual_review) {
      return 'Manuelle Überprüfung'
    }
    if (entry.has_invalid_discount) {
      return 'Ungültiger Rabatt'
    }
    return 'Ausstehend'
  }

  const formatFieldName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      'name': 'Produktname',
      'price': 'Preis',
      'discount_price': 'Rabattpreis',
      'stock': 'Lagerbestand',
      'description': 'Beschreibung',
      'stock_code': 'Artikelnummer',
      'image_url': 'Bild-URL',
      'brand_id': 'Marke',
      'category_id': 'Kategorie',
      'status': 'Status',
      'is_changeable': 'Änderbar'
    }
    
    return fieldNames[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nein'
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'string') return value
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const renderChangeSummary = () => {
    if (!entry.diff_summary) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Minus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Keine Änderungen verfügbar</p>
        </div>
      )
    }

    const summary: DiffSummary = createDiffSummary(entry.diff_summary)
    const textSummary = generateTextSummary(entry.diff_summary)

    return (
      <div className="space-y-6">
        {/* Overall Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Zusammenfassung</h4>
          <p className="text-blue-800">{textSummary}</p>
          <div className="mt-3 flex items-center space-x-4 text-sm text-blue-700">
            <span>Gesamtänderungen: {summary.total_changes}</span>
            {summary.price_changes.length > 0 && (
              <span>Preisänderungen: {summary.price_changes.length}</span>
            )}
            {summary.content_changes.length > 0 && (
              <span>Inhaltsänderungen: {summary.content_changes.length}</span>
            )}
          </div>
        </div>

        {/* Significant Changes */}
        {summary.significant_changes && summary.significant_changes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-amber-900 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Wichtige Änderungen
            </h4>
            <div className="space-y-2">
              {summary.significant_changes.map((change: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm font-medium text-amber-800">
                    {formatFieldName(change.field)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{formatValue(change.from)}</span>
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-gray-600">{formatValue(change.to)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Changes */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Detaillierte Änderungen</h4>
          <div className="space-y-3">
            {Object.entries(entry.diff_summary).map(([field, change]: [string, any]) => (
              <div key={field} className="bg-white rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{formatFieldName(field)}</span>
                  {change.percentage_change && (
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      change.percentage_change > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {change.percentage_change > 0 ? '+' : ''}{change.percentage_change}%
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Von:</span>
                    <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900">
                      {formatValue(change.current)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Zu:</span>
                    <div className="mt-1 p-2 bg-blue-100 rounded text-blue-900">
                      {formatValue(change.proposed)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderProductDetails = () => {
    if (!entry.payload_json) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Keine Produktdaten verfügbar</p>
        </div>
      )
    }

    const productData = entry.payload_json
    const importantFields = ['name', 'price', 'discount_price', 'stock', 'description', 'stock_code', 'brand_id', 'category_id', 'status']

    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Grundinformationen</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {importantFields.map(field => {
              const value = productData[field]
              if (value === undefined || value === null) return null
              
              return (
                <div key={field} className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">{formatFieldName(field)}</label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900">
                    {formatValue(value)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* All Fields */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Alle Felder</h4>
          <div className="space-y-3">
            {Object.entries(productData).map(([field, value]) => (
              <div key={field} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700 min-w-[120px]">{formatFieldName(field)}</span>
                <div className="flex-1 ml-4 text-right">
                  <span className="text-gray-900">{formatValue(value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-md bg-gray-900/20 transition-all duration-300 opacity-100"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-6xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 transform opacity-100 scale-100 translate-y-0 border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-6 w-6" style={{color: '#F39236'}} />
          <h2 className="text-xl font-semibold text-gray-900">Produktdetails</h2>
        </div>
        
        {/* Product Image and Basic Info */}
        <div className="flex items-start space-x-6 mb-6">
          <div className="flex-shrink-0">
            <div className="relative h-32 w-32 bg-gray-200 rounded-xl overflow-hidden shadow-lg">
              {entry.products?.image_url && entry.products.image_url.startsWith('http') ? (
                <img
                  src={entry.products.image_url}
                  alt={entry.products.name || entry.product_slug}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  {entry.product_id ? (
                    <Edit className="h-12 w-12 text-gray-500" />
                  ) : (
                    <Package className="h-12 w-12 text-gray-500" />
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                {entry.products?.name || entry.product_slug}
              </h4>
              <p className="text-gray-600">
                Produkt ID: {entry.product_id || 'Neues Produkt'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">Typ:</span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  entry.product_id 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  {entry.product_id ? 'Update' : 'Neues Produkt'}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(entry)}
                  <span className="text-sm font-medium text-gray-900">
                    {getStatusText(entry)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">Datum:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(entry.created_at).toLocaleDateString('de-CH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">Slug:</span>
                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {entry.product_slug}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h6 className="text-sm font-medium text-blue-900 mb-1">Grund:</h6>
              <p className="text-sm text-blue-800">
                {entry.reason?.replace(/_/g, ' ') || 'Unbekannt'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'summary', label: 'Änderungszusammenfassung', icon: TrendingUp },
              { id: 'details', label: 'Produktdaten', icon: Package },
              { id: 'changes', label: 'Detaillierte Änderungen', icon: Edit }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'summary' && renderChangeSummary()}
          {activeTab === 'details' && renderProductDetails()}
          {activeTab === 'changes' && renderChangeSummary()}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 pt-6 flex items-center justify-end space-x-3">
          <button
            onClick={() => {
              onReject(entry.id, 'Von Admin abgelehnt')
              onClose()
            }}
            disabled={isProcessing}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Ablehnen
          </button>
        
          <button
            onClick={() => {
              onApprove(entry.id)
              onClose()
            }}
            disabled={isProcessing}
            className="inline-flex items-center px-6 py-3 text-white font-medium rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{backgroundColor: '#F39236'}}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Genehmigen
          </button>
        </div>
      </div>
    </div>
  )
}
