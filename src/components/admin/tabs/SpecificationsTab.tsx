'use client'

import { useState } from 'react'
import { Settings, Plus, Trash2 } from 'lucide-react'

interface TechnicalSpec {
  id?: string
  title: string
  description: string
  sort_order: number
}

interface Specifications {
  technical_specs: TechnicalSpec[]
}

interface SpecificationsTabProps {
  specifications: Specifications
  handleSpecificationChange: (field: string, value: string | TechnicalSpec[]) => void
  openDeleteDialog: (index: number) => void
  onSave?: () => void
  isSaving?: boolean
  isAutoSaving?: boolean
}

export default function SpecificationsTab({ specifications, handleSpecificationChange, openDeleteDialog, onSave, isSaving, isAutoSaving }: SpecificationsTabProps) {
  console.log('SpecificationsTab render - specifications:', specifications)
  console.log('Technical specs count:', specifications.technical_specs?.length)
  
  const [newSpec, setNewSpec] = useState<TechnicalSpec>({
    title: '',
    description: '',
    sort_order: 0
  })

  const handleAddSpec = async () => {
    if (newSpec.title.trim() && newSpec.description.trim()) {
      const specs = [...specifications.technical_specs]
      const maxSortOrder = specs.length > 0 ? Math.max(...specs.map(s => s.sort_order)) : 0
      const specToAdd = {
        ...newSpec,
        sort_order: maxSortOrder + 1
      }
      
      // Update local state first - this will trigger automatic saving
      handleSpecificationChange('technical_specs', [...specs, specToAdd])
      setNewSpec({ title: '', description: '', sort_order: 0 })
    }
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-[#F39236]" />
        <h3 className="text-xl font-semibold text-gray-900">Technische Spezifikationen</h3>
        {isAutoSaving && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F39236]"></div>
            <span>Wird gespeichert...</span>
          </div>
        )}
      </div>

      {/* Custom Technical Specifications */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-lg font-medium text-gray-900 mb-4"></h4>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel
                </label>
              <input
                type="text"
                value={newSpec.title}
                onChange={(e) => setNewSpec({ ...newSpec, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                placeholder="z.B.: Leistungsaufnahme, Abmessungen, Material, Gewicht, Farbe"
              />
            </div>
            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
              <input
                type="text"
                value={newSpec.description}
                onChange={(e) => setNewSpec({ ...newSpec, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                placeholder="z.B.: 1500W, 60x40x80 cm, Edelstahl, 15.5 kg, Weiß"
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleAddSpec()
              }}
              disabled={!newSpec.title.trim() || !newSpec.description.trim() || isAutoSaving}
              className="px-4 py-2 bg-[#F39236] text-white rounded-md hover:bg-[#E67E22] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {isAutoSaving ? 'Wird gespeichert...' : 'Hinzufügen'}
            </button>
          </div>
        </div>

        {/* Custom Specifications Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reihenfolge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {specifications.technical_specs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Noch keine benutzerdefinierten technischen Details hinzugefügt. Sie können sie mit dem obigen Formular hinzufügen.
                  </td>
                </tr>
              ) : (
                specifications.technical_specs
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((spec, index) => (
                    <tr key={spec.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium text-gray-900">{spec.title}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="text-gray-700">{spec.description}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              openDeleteDialog(index)
                            }}
                            disabled={isAutoSaving}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Save Button - Only show when onSave is provided */}
      {onSave && (
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onSave()
            }}
            disabled={isSaving || isAutoSaving}
            className="px-6 py-3 bg-[#F39236] text-white rounded-md hover:bg-[#E67E22] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {isSaving ? 'Wird gespeichert...' : 'Technische Spezifikationen speichern'}
          </button>
        </div>
      )}


    </div>
  )
}
