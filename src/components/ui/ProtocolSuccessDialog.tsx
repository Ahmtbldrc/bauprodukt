'use client'

import React from 'react'
import { X, CheckCircle2, Download, Loader2 } from 'lucide-react'

interface ProtocolSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  protocolId: string | null
  isUpdate?: boolean
}

export function ProtocolSuccessDialog({
  isOpen,
  onClose,
  protocolId,
  isUpdate = false
}: ProtocolSuccessDialogProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [isPdfLoading, setIsPdfLoading] = React.useState(true)

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10)
      setIsPdfLoading(true)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }

  const handleDownload = async () => {
    if (!protocolId) return
    
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/plumber-protocols/${protocolId}/pdf`)
      if (!response.ok) throw new Error('PDF konnte nicht heruntergeladen werden')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `protokoll-${protocolId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Fehler beim Herunterladen des PDFs')
    } finally {
      setIsDownloading(false)
    }
  }

  if (!isOpen) return null

  const pdfUrl = protocolId ? `/api/plumber-protocols/${protocolId}/pdf?preview=true` : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-auto transition-all duration-300 transform ${
        isVisible 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
      }`} style={{ maxHeight: '90vh' }}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-10 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 shadow-sm"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col h-full" style={{ maxHeight: '90vh' }}>
          {/* Header */}
          <div className="flex items-center gap-3 p-6 pb-4 border-b border-gray-200">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {isUpdate ? 'Protokoll aktualisiert!' : 'Protokoll erstellt!'}
              </h3>
              <p className="text-gray-600 text-sm mt-0.5">
                {isUpdate 
                  ? 'Ihr Protokoll wurde erfolgreich aktualisiert und an die Gemeinde gesendet.'
                  : 'Ihr Protokoll wurde erfolgreich erstellt und an die Gemeinde gesendet.'
                }
              </p>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="flex-1 relative bg-gray-50 overflow-hidden">
            {pdfUrl && (
              <>
                {isPdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <div className="text-center">
                      <Loader2 className="h-10 w-10 text-gray-400 animate-spin mx-auto mb-3" />
                      <p className="text-gray-600 text-sm">PDF wird geladen...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={pdfUrl}
                  className="w-full h-full min-h-[500px]"
                  title="Protokoll PDF"
                  onLoad={() => setIsPdfLoading(false)}
                />
              </>
            )}
            {!pdfUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500">Kein PDF verfügbar</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 bg-white">
            <button
              onClick={handleClose}
              className="flex-1 px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Schließen
            </button>
            
            <button
              onClick={handleDownload}
              disabled={!protocolId || isDownloading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#4b4b4b] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Wird heruntergeladen...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  PDF herunterladen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

