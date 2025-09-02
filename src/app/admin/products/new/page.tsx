'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAllBrands } from '@/hooks/useBrands'
import { useAllCategories } from '@/hooks/useCategories'
import { ArrowLeft, Save, X, Info } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
  const router = useRouter()
  const { data: brandsResponse } = useAllBrands()
  const { data: categoriesResponse } = useAllCategories()
  
  const brands = brandsResponse?.data || []
  const categories = categoriesResponse?.data || []

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '',
    stock_code: '',
    image_url: '',
    brand_id: '',
    category_id: ''
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Form verilerini hazırla
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock: parseInt(formData.stock),
        brand_id: formData.brand_id || null,
        category_id: formData.category_id || null,
        image_url: null, // image_url alanı yok, null olarak gönder
      }

      console.log('Gönderilen veri:', submitData)

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Başarılı response:', result)
        // Yeni oluşturulan ürünün detay sayfasına yönlendir
        router.push(`/admin/products/${result.id}`)
      } else {
        const error = await response.json()
        console.error('API Hatası:', error)
        console.error('Response Status:', response.status)
        alert(`Hata: ${error.message || error.error || 'Bilinmeyen hata'}`)
      }
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Ürün oluşturulurken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/products"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Ürün Ekle</h1>
            <p className="text-gray-600">Yeni ürün bilgilerini girin</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Sağ tarafta boş alan - gelecekte eklenebilir */}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6">
          {/* General Tab */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Info className="h-6 w-6" style={{color: '#F39236'}} />
              <h2 className="text-xl font-semibold text-gray-900">Genel Bilgiler</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ürün Adı */}
              <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                  placeholder="Ürün adını girin"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  URL Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  pattern="[a-z0-9-]+"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                  placeholder="urun-adi"
                />
                <p className="text-xs text-gray-500">Sadece küçük harf, rakam ve tire kullanın</p>
              </div>

              {/* Fiyat */}
              <div className="space-y-1">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Fiyat (₺) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₺</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* İndirimli Fiyat */}
              <div className="space-y-1">
                <label htmlFor="discount_price" className="block text-sm font-medium text-gray-700">
                  İndirimli Fiyat (₺)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₺</span>
                  <input
                    type="number"
                    id="discount_price"
                    name="discount_price"
                    value={formData.discount_price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Stok */}
              <div className="space-y-1">
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                  Stok Miktarı *
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                  placeholder="0"
                />
              </div>

              {/* Stok Kodu */}
              <div className="space-y-1">
                <label htmlFor="stock_code" className="block text-sm font-medium text-gray-700">
                  Stok Kodu
                </label>
                <input
                  type="text"
                  id="stock_code"
                  name="stock_code"
                  value={formData.stock_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                  placeholder="STK001"
                />
              </div>

              {/* Marka */}
              <div className="space-y-1">
                <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700">
                  Marka
                </label>
                <select
                  id="brand_id"
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                >
                  <option value="">Marka seçin</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori */}
              <div className="space-y-1">
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                  Kategori
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                >
                  <option value="">Kategori seçin</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Açıklama - Tam Genişlik */}
            <div className="space-y-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Ürün Açıklaması
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400 resize-none"
                style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                placeholder="Ürün hakkında detaylı bilgi verin..."
              />
              <p className="text-xs text-gray-500">Maksimum 2000 karakter</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/admin/products"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              İptal
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              style={{backgroundColor: isLoading ? '#d1d5db' : '#F39236'}}
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
