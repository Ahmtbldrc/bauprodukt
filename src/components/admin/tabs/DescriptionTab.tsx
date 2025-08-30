'use client'

import { FileText } from 'lucide-react'

interface DescriptionTabProps {
  description: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSave: () => void
  isSaving?: boolean
}

export default function DescriptionTab({ description, onChange, onSave, isSaving }: DescriptionTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-[#F39236]" />
        <h3 className="text-xl font-semibold text-gray-900">Produktbeschreibung</h3>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beschreibungstext
          </label>
          <textarea
            name="description"
            value={description}
            onChange={onChange}
            rows={10}
            placeholder="Produktbeschreibung hier eingeben..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSave()
          }}
          disabled={isSaving}
          className="px-6 py-3 bg-[#F39236] text-white rounded-md hover:bg-[#E67E22] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          {isSaving ? 'Wird gespeichert...' : 'Beschreibung speichern'}
        </button>
      </div>
    </div>
  )
}


