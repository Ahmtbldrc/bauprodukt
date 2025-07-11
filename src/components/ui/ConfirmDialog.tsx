'use client'

import React from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  isLoading = false,
  variant = 'danger'
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      // Küçük gecikme ile animasyonu başlat
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    // Animasyon bitene kadar bekle sonra kapat
    setTimeout(() => onClose(), 300)
  }

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
      iconBg: 'bg-red-100'
    },
    warning: {
      icon: 'text-yellow-500',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      iconBg: 'bg-yellow-100'
    },
    info: {
      icon: 'text-blue-500',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      iconBg: 'bg-blue-100'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 backdrop-blur-sm transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transition-all duration-300 transform ${
        isVisible 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
      }`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
            <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
          </div>

          {/* Text Content */}
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmButton}`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Wird gelöscht...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 