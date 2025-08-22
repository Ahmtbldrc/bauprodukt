'use client'

import { Save, X } from 'lucide-react'
import Link from 'next/link'

interface FormActionsProps {
  isSaving: boolean
  onCancel?: () => void
  cancelUrl?: string
  saveText?: string
  savingText?: string
  cancelText?: string
  isGeneratingPdf?: boolean
  pdfGenerationText?: string
  onSubmit?: (e: React.FormEvent) => void
}

export default function FormActions({ 
  isSaving, 
  onCancel, 
  cancelUrl = '/admin',
  saveText = 'Speichern',
  savingText = 'Wird gespeichert...',
  cancelText = 'Abbrechen',
  isGeneratingPdf = false,
  pdfGenerationText = 'PDF wird erstellt...',
  onSubmit
}: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
      {cancelUrl ? (
        <Link
          href={cancelUrl}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          {cancelText}
        </Link>
      ) : onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          {cancelText}
        </button>
      ) : null}
      
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSaving}
        className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        style={{backgroundColor: isSaving ? '#d1d5db' : '#F39236'}}
      >
        <Save className="h-4 w-4" />
        {isSaving ? (isGeneratingPdf ? pdfGenerationText : savingText) : saveText}
      </button>
    </div>
  )
}
