'use client'

import { Info, Plus, Trash2, X, Settings } from 'lucide-react'
import { useState } from 'react'

interface GeneralTabProps {
  formData: {
    name: string
    slug: string
    description: string
    price: string
    discount_price: string
    stock: string
    stock_code: string
    art_nr: string
    hersteller_nr: string
    image_url: string
    brand_id: string
    category_id: string
    technical_specs: Array<{
      id?: string
      title: string
      description: string
      sort_order: number
    }>,
    general_technical_specs: Array<{
      id?: string
      title: string
      description: string
      sort_order: number
    }>
  }
  brands: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string; emoji?: string }>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

export default function GeneralTab({ formData, brands, categories, handleInputChange }: GeneralTabProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [newTechSpec, setNewTechSpec] = useState('')

  const addTechSpec = () => {
    if (newTechSpec.trim()) {
      const updatedSpecs = [...formData.general_technical_specs, {
        id: undefined,
        title: newTechSpec.trim(),
        description: newTechSpec.trim(),
        sort_order: formData.general_technical_specs.length
      }]
      const event = {
        target: { name: 'general_technical_specs', value: updatedSpecs }
      } as any
      handleInputChange(event)
      setNewTechSpec('')
    }
  }

  const removeTechSpec = (index: number) => {
    const updatedSpecs = formData.general_technical_specs.filter((_, i) => i !== index)
    const event = {
      target: { name: 'general_technical_specs', value: updatedSpecs }
    } as any
    handleInputChange(event)
  }

  const openDialog = () => {
    setNewTechSpec('')
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setNewTechSpec('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTechSpec.trim()) {
      addTechSpec()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Info className="h-6 w-6 text-[#F39236]" />
        <h3 className="text-xl font-semibold text-gray-900">Genel Bilgiler</h3>
      </div>

      {/* Ürün Adı ve Stok Kodu - Yan Yana */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Ürün Adı *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            required
          />
        </div>

        <div>
          <label htmlFor="stock_code" className="block text-sm font-medium text-gray-700 mb-2">
            Stok Kodu
          </label>
          <input
            type="text"
            id="stock_code"
            name="stock_code"
            value={formData.stock_code}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            placeholder="Stok kodu"
          />
        </div>
      </div>

      {/* Marka ve Kategori - Ürün Adı ve Stok Kodunun Altında */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 mb-2">
            Marka *
          </label>
          <select
            id="brand_id"
            name="brand_id"
            value={formData.brand_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            required
          >
            <option value="">Marka seçin</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
            Kategori *
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            required
          >
            <option value="">Kategori seçin</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.emoji} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Art-Nr ve Hersteller-Nr - Yan Yana */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="art_nr" className="block text-sm font-medium text-gray-700 mb-2">
            Art-Nr
          </label>
          <input
            type="text"
            id="art_nr"
            name="art_nr"
            value={formData.art_nr}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            placeholder="Ürün numarası"
          />
        </div>

        <div>
          <label htmlFor="hersteller_nr" className="block text-sm font-medium text-gray-700 mb-2">
            Hersteller-Nr
          </label>
          <input
            type="text"
            id="hersteller_nr"
            name="hersteller_nr"
            value={formData.hersteller_nr}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            placeholder="Üretici numarası"
          />
        </div>
      </div>

      {/* Fiyat ve İndirimli Fiyat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Fiyat (CHF) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            required
          />
        </div>

        <div>
          <label htmlFor="discount_price" className="block text-sm font-medium text-gray-700 mb-2">
            İndirimli Fiyat (CHF)
          </label>
          <input
            type="number"
            id="discount_price"
            name="discount_price"
            value={formData.discount_price}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
          />
        </div>
      </div>

      {/* Technische Eigenschaften ve Stok Miktarı - Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stok Miktarı - Sol */}
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
            Stok Miktarı *
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            required
          />
        </div>

        {/* Technische Eigenschaften - Sağ */}
        <div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center text-lg font-semibold text-gray-800 bg-gradient-to-r from-[#F39236] to-[#E67E22] bg-clip-text text-transparent">
              <Settings className="h-5 w-5 mr-2 text-[#F39236]" />
              Technische Eigenschaften:
            </label>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#FFF0E2] text-[#F39236] border border-[#F39236]">
              {formData.general_technical_specs.length} madde
            </span>
            <button
              type="button"
              onClick={openDialog}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-[#F39236] rounded-md hover:bg-[#E67E22] transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ekle
            </button>
            {formData.general_technical_specs.length === 0 && (
              <span className="text-sm text-gray-500 italic">Henüz teknik özellik eklenmemiş</span>
            )}
          </div>
        </div>
      </div>

      {/* Dialog for managing technical specs - shows only the list */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-md bg-gray-900/20 transition-all duration-300 opacity-100"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={closeDialog}
          />
          
          {/* Dialog */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 transform opacity-100 scale-100 translate-y-0 border border-white/20">
            {/* Close Button */}
            <button
              onClick={closeDialog}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <Settings className="h-6 w-6" style={{color: '#F39236'}} />
              <h2 className="text-xl font-semibold text-gray-900">
                Technische Eigenschaften
              </h2>
            </div>
            
            <div className="space-y-6">
              {/* Add new spec input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Özellik Ekle
                </label>
                <input
                  type="text"
                  value={newTechSpec}
                  onChange={(e) => setNewTechSpec(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Özellik metnini yazın..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                  autoFocus
                />
              </div>
              
              {/* Current list display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Özellikler:
                </label>
                <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                  {formData.general_technical_specs.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Henüz özellik eklenmemiş</p>
                  ) : (
                    <ul className="space-y-1">
                      {formData.general_technical_specs.map((spec, index) => (
                        <li key={index} className="flex items-center justify-between text-sm text-gray-700">
                          <span className="flex items-center">
                            <span className="text-gray-400 mr-2">&gt;</span>
                            {spec.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTechSpec(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={closeDialog}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={addTechSpec}
                disabled={!newTechSpec.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#F39236] rounded-md hover:bg-[#E67E22] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
