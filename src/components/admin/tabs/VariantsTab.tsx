'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, GripVertical, Edit, Trash2, Settings, Palette, Ruler, Hammer, Tag } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui'


interface Attribute {
  name: string
  display_name: string
  attribute_type: 'select' | 'color' | 'text'
  value: string
  display_value: string
  hex_color?: string | null
  sort_order: number
}

interface Variant {
  id?: string
  sku: string
  title: string
  price: string
  compare_at_price: string
  stock_quantity: string
  track_inventory: boolean
  continue_selling_when_out_of_stock: boolean
  is_active: boolean
  position: number
  attributes: Attribute[]
}

interface VariantsTabProps {
  variants: Variant[]
  setVariants: (variants: Variant[]) => void
  productId: string
  isSaving?: boolean
}

// Predefined attribute types
const PREDEFINED_ATTRIBUTES = [
  { name: 'farbe', display_name: 'Farbe', attribute_type: 'color' as const, icon: Palette },
  { name: 'grosse', display_name: 'Größe', attribute_type: 'select' as const, icon: Ruler },
  { name: 'material', display_name: 'Material', attribute_type: 'select' as const, icon: Hammer },
  { name: 'stil', display_name: 'Stil', attribute_type: 'select' as const, icon: Tag },
  { name: 'size', display_name: 'Size', attribute_type: 'select' as const, icon: Ruler },
]

// Predefined values for common attributes
const PREDEFINED_VALUES = {
  farbe: [
    { value: 'red', display_value: 'Red', hex_color: '#FF0000' },
    { value: 'blue', display_value: 'Blue', hex_color: '#0000FF' },
    { value: 'green', display_value: 'Green', hex_color: '#00FF00' },
    { value: 'yellow', display_value: 'Yellow', hex_color: '#FFFF00' },
    { value: 'black', display_value: 'Black', hex_color: '#000000' },
    { value: 'white', display_value: 'White', hex_color: '#FFFFFF' },
  ],
  grosse: [
    { value: '1600', display_value: '1600' },
    { value: '1800', display_value: '1800' },
    { value: '2000', display_value: '2000' },
    { value: '2200', display_value: '2200' },
  ],
  material: [
    { value: 'holz', display_value: 'Holz' },
    { value: 'metall', display_value: 'Metall' },
    { value: 'kunststoff', display_value: 'Kunststoff' },
    { value: 'glas', display_value: 'Glas' },
  ],
  stil: [
    { value: '13_fusse', display_value: '13 Füße' },
    { value: 'modern', display_value: 'Modern' },
    { value: 'klassisch', display_value: 'Klassisch' },
    { value: 'minimalistisch', display_value: 'Minimalistisch' },
  ],
  size: [
    { value: 'small', display_value: 'Small' },
    { value: 'medium', display_value: 'Medium' },
    { value: 'large', display_value: 'Large' },
    { value: 'xl', display_value: 'XL' },
  ]
}

// Toast Component
function Toast({ message, type, isVisible, onClose }: {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
  onClose: () => void
}) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-2">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 min-w-[300px] ${
        type === 'success' 
          ? 'bg-green-50 border-green-500 text-green-800' 
          : 'bg-red-50 border-red-500 text-red-800'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function VariantsTab({
  variants,
  setVariants,
  productId
}: VariantsTabProps) {
  console.log('🔄 VariantsTab rendered')
  console.log('variants prop:', variants)
  console.log('variants.length:', variants?.length)
  console.log('productId:', productId)
  
  const [showVariantDialog, setShowVariantDialog] = useState(false)
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [editingVariant, setEditingVariant] = useState<Variant>({
    sku: '',
    title: '',
    price: '',
    compare_at_price: '',
    stock_quantity: '0',
    track_inventory: true,
    continue_selling_when_out_of_stock: false,
    is_active: true,
    position: 0,
    attributes: []
  })
  
  // State for delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    variantIndex: number | null
    variantTitle: string
  }>({
    isOpen: false,
    variantIndex: null,
    variantTitle: ''
  })
  
  // State for toast
  
  const [toast, setToast] = useState<{
    isVisible: boolean
    message: string
    type: 'success' | 'error'
  }>({ isVisible: false, message: '', type: 'success' })



  const addVariant = () => {
    const newVariant: Variant = {
      sku: '',
      title: '',
      price: '',
      compare_at_price: '',
      stock_quantity: '0',
      track_inventory: true,
      continue_selling_when_out_of_stock: false,
      is_active: true,
      position: variants.length,
      attributes: []
    }
    setEditingVariant(newVariant)
    setEditingVariantIndex(null)
    setShowVariantDialog(true)
  }

  const editVariant = (index: number) => {
    setEditingVariant(variants[index])
    setEditingVariantIndex(index)
    setShowVariantDialog(true)
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isVisible: true, message, type })
    setTimeout(() => {
      setToast({ isVisible: false, message: '', type: 'success' })
    }, 4000)
  }





  const openDeleteDialog = (index: number) => {
    const variant = variants[index]
    setDeleteDialog({
      isOpen: true,
      variantIndex: index,
      variantTitle: variant.title || variant.sku
    })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      variantIndex: null,
      variantTitle: ''
    })
  }

  const confirmDeleteVariant = async () => {
    if (deleteDialog.variantIndex === null) return
    
    const variant = variants[deleteDialog.variantIndex]
    if (!variant.id) {
      showToast('Variante hatası: ID bulunamadı', 'error')
      closeDeleteDialog()
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}/variants`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId: variant.id
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Variante silinemedi')
      }

      // Remove from local state
      const newVariants = variants.filter((_, i) => i !== deleteDialog.variantIndex)
      setVariants(newVariants)
      
      showToast('Variante başarıyla silindi!', 'success')
      closeDeleteDialog()
    } catch (error) {
      console.error('Fehler beim Löschen der Variante:', error)
      showToast(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 'error')
    }
  }

  const closeVariantDialog = () => {
    setShowVariantDialog(false)
    setEditingVariantIndex(null)
    setEditingVariant({
      sku: '',
      title: '',
      price: '',
      compare_at_price: '',
      stock_quantity: '0',
      track_inventory: true,
      continue_selling_when_out_of_stock: false,
      is_active: true,
      position: 0,
      attributes: []
    })
  }

  const saveVariant = async () => {
    try {
      if (editingVariantIndex !== null) {
        // Edit existing variant - PUT request
        console.log('✏️ Updating existing variant:', editingVariant)
        
        const response = await fetch(`/api/products/${productId}/variants/${editingVariant.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sku: editingVariant.sku,
            title: editingVariant.title,
            price: parseFloat(editingVariant.price),
            compare_at_price: editingVariant.compare_at_price ? parseFloat(editingVariant.compare_at_price) : null,
            stock_quantity: parseInt(editingVariant.stock_quantity),
            track_inventory: editingVariant.track_inventory,
            continue_selling_when_out_of_stock: editingVariant.continue_selling_when_out_of_stock,
            is_active: editingVariant.is_active,
            position: editingVariant.position
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Variante konnte nicht aktualisiert werden')
        }

        const updatedVariant = await response.json()
        console.log('✅ Variant updated:', updatedVariant)
        
        // Update local state with the response from API
        const newVariants = [...variants]
        newVariants[editingVariantIndex] = updatedVariant
        setVariants(newVariants)
        
        showToast('Variante erfolgreich aktualisiert!', 'success')
      } else {
        // Add new variant - POST request
        console.log('➕ Creating new variant:', editingVariant)
        
        const response = await fetch(`/api/products/${productId}/variants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sku: editingVariant.sku,
            title: editingVariant.title,
            price: parseFloat(editingVariant.price),
            compare_at_price: editingVariant.compare_at_price ? parseFloat(editingVariant.compare_at_price) : null,
            stock_quantity: parseInt(editingVariant.stock_quantity),
            track_inventory: editingVariant.track_inventory,
            continue_selling_when_out_of_stock: editingVariant.continue_selling_when_out_of_stock,
            is_active: editingVariant.is_active,
            position: editingVariant.position
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Variante konnte nicht hinzugefügt werden')
        }

        const newVariant = await response.json()
        console.log('✅ Variant created:', newVariant)
        
        // Add to local state
        setVariants([...variants, newVariant])
        
        showToast('Variante erfolgreich hinzugefügt!', 'success')
      }
      
      closeVariantDialog()
    } catch (error) {
              console.error('Fehler beim Speichern der Variante:', error)
      showToast(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 'error')
    }
  }

  const handleVariantInputChange = (field: keyof Variant, value: string | boolean | number) => {
    setEditingVariant(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addAttribute = (attributeType: typeof PREDEFINED_ATTRIBUTES[0]) => {
    const newAttribute: Attribute = {
      name: attributeType.name,
      display_name: attributeType.display_name,
      attribute_type: attributeType.attribute_type,
      value: '',
      display_value: '',
      hex_color: null,
      sort_order: (editingVariant.attributes?.length || 0)
    }
    
    setEditingVariant(prev => ({
      ...prev,
      attributes: [...(prev.attributes || []), newAttribute]
    }))
  }

  const removeAttribute = (index: number) => {
    setEditingVariant(prev => ({
      ...prev,
      attributes: (prev.attributes || []).filter((_, i) => i !== index)
    }))
  }

  const updateAttribute = (index: number, field: keyof Attribute, value: string | null) => {
    setEditingVariant(prev => ({
      ...prev,
      attributes: (prev.attributes || []).map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }))
  }

  const getAttributeValues = (attributeName: string) => {
    return PREDEFINED_VALUES[attributeName as keyof typeof PREDEFINED_VALUES] || []
  }

  // Auto-generate title when attributes change
  useEffect(() => {
    const generateVariantTitle = () => {
      if (!editingVariant.attributes || editingVariant.attributes.length === 0) return ''
      
      const attributeValues = editingVariant.attributes
        .filter(attr => attr.display_value)
        .map(attr => attr.display_value)
        .join(' - ')
      
      return attributeValues || 'Neue Variante'
    }

    const newTitle = generateVariantTitle()
    if (newTitle && newTitle !== editingVariant.title) {
      setEditingVariant(prev => ({ ...prev, title: newTitle }))
    }
  }, [editingVariant.attributes, editingVariant.title])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-[#F39236]" />
          <h3 className="text-xl font-semibold text-gray-900">Varianten</h3>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
          style={{backgroundColor: '#F39236'}}
        >
          <Plus className="h-4 w-4" />
                      Variante hinzufügen
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-900 mb-1">Noch keine Varianten hinzugefügt</p>
            <p className="text-xs">Klicken Sie auf den obigen Button, um eine Variante hinzuzufügen</p>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <div>
                    <h4 className="font-medium text-gray-900">{variant.title || variant.sku}</h4>
                    <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editVariant(index)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
                    title="Variante bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteDialog(index)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                    title="Variante löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Attributes Display */}
              {variant.attributes.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {variant.attributes.map((attr, attrIndex) => (
                      <div key={attrIndex} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                        <span className="text-gray-600 font-medium">{attr.display_name}:</span>
                        {attr.attribute_type === 'color' && attr.hex_color ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: attr.hex_color }}
                            />
                            <span>{attr.display_value}</span>
                          </div>
                        ) : (
                          <span className="text-gray-800">{attr.display_value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Preis:</span>
                  <span className="ml-2 font-medium">{variant.price} CHF</span>
                </div>
                <div>
                  <span className="text-gray-500">Lagerbestand:</span>
                  <span className="ml-2 font-medium">{variant.stock_quantity}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    variant.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {variant.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Reihenfolge:</span>
                  <span className="ml-2 font-medium">{variant.position}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variant Dialog */}
      {showVariantDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-md bg-gray-900/20 transition-all duration-300 opacity-100"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={closeVariantDialog}
          />
          
          {/* Dialog */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 transform opacity-100 scale-100 translate-y-0 border border-white/20">
            {/* Close Button */}
            <button
              onClick={closeVariantDialog}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-6 w-6" style={{color: '#F39236'}} />
              <h2 className="text-xl font-semibold text-gray-900">
                {editingVariantIndex !== null ? 'Variante bearbeiten' : 'Variante hinzufügen'}
              </h2>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4"></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit_sku" className="block text-sm font-medium text-gray-700 mb-2">
                      SKU *
                    </label>
                    <input
                      id="edit_sku"
                      type="text"
                      value={editingVariant.sku}
                      onChange={(e) => handleVariantInputChange('sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      required
                    />
                  </div>
                  
                  <div>
                                    <label htmlFor="edit_title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titel (Automatisch)
                </label>
                    <input
                      id="edit_title"
                      type="text"
                      value={editingVariant.title}
                      onChange={(e) => handleVariantInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      readOnly
                    />
                  </div>
                  
                  <div>
                                    <label htmlFor="edit_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Preis (CHF) *
                </label>
                    <input
                      id="edit_price"
                      type="number"
                      value={editingVariant.price}
                      onChange={(e) => handleVariantInputChange('price', e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit_compare_price" className="block text-sm font-medium text-gray-700 mb-2">
                      Vergleichspreis (CHF)
                    </label>
                    <input
                      id="edit_compare_price"
                      type="number"
                      value={editingVariant.compare_at_price}
                      onChange={(e) => handleVariantInputChange('compare_at_price', e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit_stock" className="block text-sm font-medium text-gray-700 mb-2">
                      Lagerbestand
                    </label>
                    <input
                      id="edit_stock"
                      type="number"
                      value={editingVariant.stock_quantity}
                      onChange={(e) => handleVariantInputChange('stock_quantity', e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit_position" className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <input
                      id="edit_position"
                      type="number"
                      value={editingVariant.position}
                      onChange={(e) => handleVariantInputChange('position', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>

              {/* Attributes Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Eigenschaften</h3>
                  <div className="flex gap-2">
                    {PREDEFINED_ATTRIBUTES.map((attrType) => {
                      const Icon = attrType.icon
                      const isAdded = editingVariant.attributes.some(attr => attr.name === attrType.name)
                      
                      return (
                        <button
                          key={attrType.name}
                          type="button"
                          onClick={() => addAttribute(attrType)}
                          disabled={isAdded}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isAdded 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {attrType.display_name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {editingVariant.attributes.length > 0 && (
                  <div className="space-y-4">
                    {editingVariant.attributes.map((attr, attrIndex) => {
                      const Icon = PREDEFINED_ATTRIBUTES.find(a => a.name === attr.name)?.icon || Settings
                      const availableValues = getAttributeValues(attr.name)
                      
                      return (
                        <div key={attrIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-gray-600" />
                              <span className="font-medium text-gray-900">{attr.display_name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttribute(attrIndex)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Değer
                              </label>
                              {availableValues.length > 0 ? (
                                <select
                                  value={attr.value}
                                  onChange={(e) => {
                                    const selected = availableValues.find(v => v.value === e.target.value)
                                    if (selected) {
                                      updateAttribute(attrIndex, 'value', selected.value)
                                      updateAttribute(attrIndex, 'display_value', selected.display_value)
                                      if ('hex_color' in selected) {
                                        updateAttribute(attrIndex, 'hex_color', (selected as { hex_color?: string }).hex_color || null)
                                      }
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                                >
                                  <option value="">Seçiniz</option>
                                  {availableValues.map((val, valIndex) => (
                                    <option key={valIndex} value={val.value}>
                                      {val.display_value}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={attr.value}
                                  onChange={(e) => updateAttribute(attrIndex, 'value', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                                  placeholder="Değer giriniz"
                                />
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Görünen Değer
                              </label>
                              <input
                                type="text"
                                value={attr.display_value}
                                onChange={(e) => updateAttribute(attrIndex, 'display_value', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                                style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                                placeholder="Görünen değer"
                              />
                            </div>
                            
                            {attr.attribute_type === 'color' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Renk Kodu
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={attr.hex_color || '#000000'}
                                    onChange={(e) => updateAttribute(attrIndex, 'hex_color', e.target.value)}
                                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={attr.hex_color || ''}
                                    onChange={(e) => updateAttribute(attrIndex, 'hex_color', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                                    placeholder="#FF0000"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    id="edit_track_inventory"
                    type="checkbox"
                    checked={editingVariant.track_inventory}
                    onChange={(e) => handleVariantInputChange('track_inventory', e.target.checked)}
                    className="w-4 h-4 text-[#F39236] border-gray-300 rounded focus:ring-[#F39236]"
                  />
                  <label htmlFor="edit_track_inventory" className="text-sm font-medium text-gray-700">
                    Lagerbestand verfolgen
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    id="edit_continue_selling"
                    type="checkbox"
                    checked={editingVariant.continue_selling_when_out_of_stock}
                    onChange={(e) => handleVariantInputChange('continue_selling_when_out_of_stock', e.target.checked)}
                    className="w-4 h-4 text-[#F39236] border-gray-300 rounded focus:ring-[#F39236]"
                  />
                  <label htmlFor="edit_continue_selling" className="text-sm font-medium text-gray-700">
                    Weiterverkauf bei Lagerbestandsmangel
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    id="edit_is_active"
                    type="checkbox"
                    checked={editingVariant.is_active}
                    onChange={(e) => handleVariantInputChange('is_active', e.target.checked)}
                    className="w-4 h-4 text-[#F39236] border-gray-300 rounded focus:ring-[#F39236]"
                  />
                  <label htmlFor="edit_is_active" className="text-sm font-medium text-gray-700">
                    Aktiv
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                              <button
                  type="button"
                  onClick={closeVariantDialog}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
              <button
                type="button"
                onClick={saveVariant}
                className="px-4 py-2 bg-[#F39236] text-white font-medium rounded-lg hover:bg-[#E67E22] transition-colors"
              >
                {editingVariantIndex !== null ? 'Aktualisieren' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ isVisible: false, message: '', type: 'success' })}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteVariant}
        title="Variante löschen"
        message={`Sind Sie sicher, dass Sie die Variante "${deleteDialog.variantTitle}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Ja, löschen"
        cancelText="Abbrechen"
        variant="danger"
      />
    </div>
  )
}
