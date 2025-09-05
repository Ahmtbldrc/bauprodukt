'use client'

import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'

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
    allow_manual_stock_edit?: boolean
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
  mainCategories: Array<{ id: string; name: string; slug: string }>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

export default function GeneralTab({ formData, brands, mainCategories, handleInputChange }: GeneralTabProps) {
  const [mainId, setMainId] = useState<string>('')
  const [subOptions, setSubOptions] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [loadingSubs, setLoadingSubs] = useState(false)

  // Initialize from existing category_id: detect parent main category and load its subs
  useEffect(() => {
    const initFromExisting = async () => {
      if (!formData.category_id || mainId) return
      try {
        const res = await fetch(`/api/categories/${formData.category_id}`)
        if (!res.ok) return
        const cat = await res.json()
        const detectedMainId = cat?.parent?.id || (cat?.category_type === 'main' ? cat.id : '')
        if (detectedMainId) {
          setMainId(detectedMainId)
          try {
            const kidsRes = await fetch(`/api/categories/${detectedMainId}/children`)
            if (kidsRes.ok) {
              const json = await kidsRes.json()
              const children = (json.data || []).map((r: any) => r.category)
              setSubOptions(children)
            }
          } catch {}
        }
      } catch {}
    }
    initFromExisting()
  }, [formData.category_id, mainId])

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Info className="h-6 w-6 text-[#F39236]" />
        <h3 className="text-xl font-semibold text-gray-900">Allgemeine Informationen</h3>
      </div>

      {/* Produktname ve Marke - yan yana */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Produktname *
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
          <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 mb-2">
            Marke *
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
            <option value="">Marke auswählen</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hauptkategorie ve Unterkategorie - yan yana */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hauptkategorie
          </label>
          <select
            value={mainId}
            onChange={async (e) => {
              const val = e.target.value
              setMainId(val)
              // Reset product category_id until sub is chosen (or assign main if no subs exist)
              handleInputChange({
                target: { name: 'category_id', value: '' }
              } as any)
              if (!val) { setSubOptions([]); return }
              try {
                setLoadingSubs(true)
                const res = await fetch(`/api/categories/${val}/children`)
                const json = await res.json()
                const children = (json.data || []).map((r: any) => r.category)
                setSubOptions(children)
                if (children.length === 0) {
                  // No subs: assign main category as product category
                  handleInputChange({
                    target: { name: 'category_id', value: val }
                  } as any)
                }
              } finally {
                setLoadingSubs(false)
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
          >
            <option value="">Hauptkategorie auswählen</option>
            {mainCategories.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
            Unterkategorie
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            disabled={!mainId || loadingSubs || subOptions.length === 0}
          >
            <option value="">
              {loadingSubs ? 'Wird geladen...' : subOptions.length === 0 ? 'Keine Unterkategorien' : 'Unterkategorie auswählen'}
            </option>
            {subOptions.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Art-Nr ve Hersteller-Nr - Yan Yana */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="art_nr" className="block text-sm font-medium text-gray-700 mb-2">
            Art.-Nr.
          </label>
          <input
            type="text"
            id="art_nr"
            name="art_nr"
            value={formData.art_nr}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            placeholder="Produktnummer"
          />
        </div>

        <div>
          <label htmlFor="hersteller_nr" className="block text-sm font-medium text-gray-700 mb-2">
            Hersteller-Nr.
          </label>
          <input
            type="text"
            id="hersteller_nr"
            name="hersteller_nr"
            value={formData.hersteller_nr}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            placeholder="Herstellernummer"
          />
        </div>
      </div>

      {/* Fiyat ve İndirimli Fiyat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Preis (CHF) *
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
            Rabattpreis (CHF)
          </label>
          <input
            type="number"
            id="discount_price"
            name="discount_price"
            value={formData.discount_price}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            required={false}
            placeholder="Optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
          />
        </div>
      </div>

      {/* Lagerbestand - en altta solda, tam genişliği kaplamasın */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
              Lagerbestand
            </label>
            <button
              type="button"
              aria-checked={!!formData.allow_manual_stock_edit}
              role="switch"
              onClick={() => {
                const next = !formData.allow_manual_stock_edit
                handleInputChange({
                  target: {
                    name: 'allow_manual_stock_edit',
                    value: next,
                    checked: next,
                    type: 'checkbox'
                  }
                } as unknown as React.ChangeEvent<HTMLInputElement>)
              }}
              className="inline-flex items-center gap-2 cursor-pointer select-none"
            >
              <div
                className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${formData.allow_manual_stock_edit ? 'bg-[#F39236]' : 'bg-gray-200'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform duration-200 ${formData.allow_manual_stock_edit ? 'translate-x-4' : ''}`}
                />
              </div>
              <span className="text-xs text-gray-600">Manuelle Bearbeitung erlauben</span>
            </button>
          </div>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            min="0"
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200 ${
              formData.allow_manual_stock_edit ? '' : 'bg-gray-50'
            }`}
            style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
            readOnly={!formData.allow_manual_stock_edit}
          />
        </div>
      </div>

    </div>
  )
}
