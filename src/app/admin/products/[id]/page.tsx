'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useProductById, useProductVariants, useProductImages } from '@/hooks/useProducts'
import { useAllBrands } from '@/hooks/useBrands'
import { useAllCategories } from '@/hooks/useCategories'
import { ArrowLeft, Save, X, Loader2, Plus, Trash2, Image as ImageIcon, Package, Info, GripVertical } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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
}

interface ProductImage {
  id?: string
  image_url: string
  is_cover: boolean
}

interface VariantResponse {
  id: string
  sku: string
  title?: string
  price: number
  compare_at_price?: number
  stock_quantity: number
  track_inventory: boolean
  continue_selling_when_out_of_stock: boolean
  is_active: boolean
  position: number
}

interface ImageResponse {
  id: string
  image_url: string
  order_index: number
  is_cover: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const { data: product, isLoading: isProductLoading, error: productError } = useProductById(productId)
  const { data: variantsResponse, isLoading: isVariantsLoading } = useProductVariants(productId)
  const { data: imagesResponse, isLoading: isImagesLoading } = useProductImages(productId)
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

  const [variants, setVariants] = useState<Variant[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'images'>('general')
  const [isSaving, setIsSaving] = useState(false)
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
    position: 0
  })

  // Populate form when product data is loaded
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        discount_price: product.discount_price?.toString() || '',
        stock: product.stock?.toString() || '',
        stock_code: product.stock_code || '',
        image_url: product.image_url || '',
        brand_id: product.brand_id || '',
        category_id: product.category_id || ''
      })
    }
  }, [product])

  // Load variants when variants data is loaded
  useEffect(() => {
    if (variantsResponse?.variants) {
      const loadedVariants: Variant[] = variantsResponse.variants.map((variant: VariantResponse) => ({
        id: variant.id,
        sku: variant.sku || '',
        title: variant.title || '',
        price: variant.price?.toString() || '',
        compare_at_price: variant.compare_at_price?.toString() || '',
        stock_quantity: variant.stock_quantity?.toString() || '0',
        track_inventory: variant.track_inventory !== undefined ? variant.track_inventory : true,
        continue_selling_when_out_of_stock: variant.continue_selling_when_out_of_stock !== undefined ? variant.continue_selling_when_out_of_stock : false,
        is_active: variant.is_active !== undefined ? variant.is_active : true,
        position: variant.position || 0
      }))
      setVariants(loadedVariants)
    }
  }, [variantsResponse])

  // Load images when images data is loaded
  useEffect(() => {
    if (imagesResponse?.data) {
      const loadedImages: ProductImage[] = imagesResponse.data.map((image: ImageResponse) => ({
        id: image.id,
        image_url: image.image_url || '',
        is_cover: image.is_cover || false
      }))
      setImages(loadedImages)
    }
  }, [imagesResponse])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (index: number, field: keyof ProductImage, value: string | boolean) => {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], [field]: value }
    setImages(newImages)
  }

  const addImage = () => {
    const newImage: ProductImage = {
      image_url: '',
      is_cover: images.length === 0
    }
    setImages([...images, newImage])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    // If we're removing the cover image, make the first remaining image the cover
    if (images[index].is_cover && newImages.length > 0) {
      newImages[0].is_cover = true
    }
    setImages(newImages)
  }

  const setCoverImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_cover: i === index
    }))
    setImages(newImages)
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Update main product
      const productResponse = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
          stock: parseInt(formData.stock),
          brand_id: formData.brand_id || null,
          category_id: formData.category_id || null,
        }),
      })

      if (!productResponse.ok) {
        const error = await productResponse.json()
        throw new Error(error.message)
      }

      // Update variants if any exist
      if (variants.length > 0) {
        const variantsResponse = await fetch(`/api/products/${productId}/variants`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ variants }),
        })

        if (!variantsResponse.ok) {
          const error = await variantsResponse.json()
          throw new Error(`Varyant güncellenirken hata: ${error.message}`)
        }
      }

      // Update images if any exist
      if (images.length > 0) {
        const imagesResponse = await fetch(`/api/products/${productId}/images`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ images }),
        })

        if (!imagesResponse.ok) {
          const error = await imagesResponse.json()
          throw new Error(`Resimler güncellenirken hata: ${error.message}`)
        }
      }

      router.push('/admin/products')
    } catch (error) {
      console.error('Error updating product:', error)
      alert(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const editVariant = (index: number) => {
    setEditingVariantIndex(index)
    setEditingVariant({ ...variants[index] })
    setShowVariantDialog(true)
  }

  const closeVariantDialog = () => {
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
      position: variants.length
    })
    setShowVariantDialog(false)
  }

  const handleEditingVariantChange = (field: keyof Variant, value: string | number | boolean) => {
    setEditingVariant(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveVariant = () => {
    if (editingVariantIndex !== null) {
      // Update existing variant
      const updatedVariants = [...variants]
      updatedVariants[editingVariantIndex] = editingVariant
      setVariants(updatedVariants)
    } else {
      // Add new variant
      setVariants([...variants, { ...editingVariant, position: variants.length }])
    }
    closeVariantDialog()
  }

  const deleteVariant = (index: number) => {
    if (confirm('Bu varyantı silmek istediğinize emin misiniz?')) {
      setVariants(variants.filter((_, i) => i !== index))
    }
  }

  if (isProductLoading || isVariantsLoading || isImagesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Ürün bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (productError || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/products"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ürün Bulunamadı</h1>
            <p className="text-gray-600">Ürün yüklenirken hata oluştu</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {productError?.message || 'Ürün bulunamadı veya yüklenirken hata oluştu.'}
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'Genel Bilgiler', icon: Info },
    { id: 'variants', label: 'Varyantlar', icon: Package },
    { id: 'images', label: 'Resimler', icon: ImageIcon }
  ]

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
            <h1 className="text-3xl font-bold text-gray-900">Ürün Düzenle</h1>
            <p className="text-gray-600">{product.name} ürününü düzenle</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Sağ tarafta boş alan - gelecekte eklenebilir */}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'general' | 'variants' | 'images')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500'
                    : 'border-transparent'
                }`}
                style={{
                  color: activeTab === tab.id ? '#F39237' : '#6b7280',
                  borderBottomColor: activeTab === tab.id ? '#F39237' : 'transparent'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#F39237'
                    e.currentTarget.style.borderBottomColor = '#F39237'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#6b7280'
                    e.currentTarget.style.borderBottomColor = 'transparent'
                  }
                }}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-4">
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
                    {category.emoji ? `${category.emoji} ` : ''}{category.name}
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
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ürün Varyantları</h3>
                  <p className="text-sm text-gray-600 mt-1">Ürün varyantlarını yönetin (renk, boyut, fiyat farkları)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVariantDialog(true)}
                  className="px-4 py-2 text-white rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                  style={{backgroundColor: '#F39236'}}
                >
                  <Plus className="h-4 w-4" />
                  Varyant Ekle
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Henüz varyant eklenmemiş</p>
                  <p className="text-sm">Ürün varyantları eklemek için yukarıdaki butona tıklayın</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Başlık
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fiyat
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stok
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {variants.map((variant, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {variant.sku}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.title || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-col">
                                <span className="font-medium">₺{variant.price}</span>
                                {variant.compare_at_price && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ₺{variant.compare_at_price}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.stock_quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                variant.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {variant.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => editVariant(index)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                >
                                  Düzenle
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteVariant(index)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                >
                                  Sil
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ürün Resimleri</h3>
                  <p className="text-sm text-gray-600 mt-1">Resimleri sürükleyip bırakarak sıralayın</p>
                </div>
                <button
                  type="button"
                  onClick={addImage}
                  className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
                  style={{backgroundColor: '#F39236'}}
                >
                  <Plus className="h-4 w-4" />
                  Resim Ekle
                </button>
              </div>

              {images.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-900 mb-1">Henüz resim eklenmemiş</p>
                  <p className="text-xs">Ürün resimleri eklemek için yukarıdaki butona tıklayın</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 bg-gray-50">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50">
                            Önizleme
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            URL
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 bg-gray-50">
                            Kapak
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 bg-gray-50">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {images.map((image, index) => (
                          <tr 
                            key={index} 
                            className="hover:bg-gray-50 transition-colors cursor-move"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', index.toString())
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault()
                              const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'))
                              if (draggedIndex !== index) {
                                const newImages = [...images]
                                const [draggedImage] = newImages.splice(draggedIndex, 1)
                                newImages.splice(index, 0, draggedImage)
                                setImages(newImages)
                              }
                            }}
                          >
                            {/* Drag Handle & Position */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                                <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                              </div>
                            </td>
                            
                            {/* Image Preview */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                                {image.image_url ? (
                                  <Image
                                    src={image.image_url}
                                    alt={`Ürün resmi ${index + 1}`}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-5 w-5 text-gray-300" />
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            {/* URL Input */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="url"
                                value={image.image_url}
                                onChange={(e) => handleImageChange(index, 'image_url', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                                placeholder="https://example.com/image.jpg"
                              />
                            </td>
                            
                            {/* Cover Status */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {image.is_cover ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                      style={{backgroundColor: '#FFF0E2', color: '#F39237'}}>
                                  Kapak
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setCoverImage(index)}
                                  className="px-2 py-1 text-xs rounded-md transition-colors"
                                  style={{
                                    color: '#6b7280'
                                  } as React.CSSProperties}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FFF0E2'
                                    e.currentTarget.style.color = '#F39237'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                    e.currentTarget.style.color = '#6b7280'
                                  }}
                                >
                                  Kapak Yap
                                </button>
                              )}
                            </td>
                            
                            {/* Actions */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                                  title="Resmi sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}



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
              disabled={isSaving}
              className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              style={{backgroundColor: isSaving ? '#d1d5db' : '#F39236'}}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>

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
          <div className="relative bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 transform opacity-100 scale-100 translate-y-0 border border-white/20">
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
                {editingVariantIndex !== null ? 'Varyant Düzenle' : 'Varyant Ekle'}
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit_sku" className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    id="edit_sku"
                    name="sku"
                    value={editingVariant.sku}
                    onChange={(e) => handleEditingVariantChange('sku', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="VARYANT-001"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit_title" className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık
                  </label>
                  <input
                    type="text"
                    id="edit_title"
                    name="title"
                    value={editingVariant.title}
                    onChange={(e) => handleEditingVariantChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="Kırmızı, Büyük"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    id="edit_price"
                    name="price"
                    value={editingVariant.price}
                    onChange={(e) => handleEditingVariantChange('price', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit_compare_at_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Karşılaştırma Fiyatı (₺)
                  </label>
                  <input
                    type="number"
                    id="edit_compare_at_price"
                    name="compare_at_price"
                    value={editingVariant.compare_at_price}
                    onChange={(e) => handleEditingVariantChange('compare_at_price', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit_stock_quantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Stok Miktarı *
                  </label>
                  <input
                    type="number"
                    id="edit_stock_quantity"
                    name="stock_quantity"
                    value={editingVariant.stock_quantity}
                    onChange={(e) => handleEditingVariantChange('stock_quantity', e.target.value)}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition-colors"
                    style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
                    placeholder="0"
                  />
                </div>
              </div>
              
              {/* Checkboxes Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_track_inventory"
                    name="track_inventory"
                    checked={editingVariant.track_inventory}
                    onChange={(e) => handleEditingVariantChange('track_inventory', e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    style={{accentColor: '#F39236'}}
                  />
                  <label htmlFor="edit_track_inventory" className="ml-2 text-sm text-gray-700">
                    Stok takibi yap
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_continue_selling"
                    name="continue_selling_when_out_of_stock"
                    checked={editingVariant.continue_selling_when_out_of_stock}
                    onChange={(e) => handleEditingVariantChange('continue_selling_when_out_of_stock', e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    style={{accentColor: '#F39236'}}
                  />
                  <label htmlFor="edit_continue_selling" className="ml-2 text-sm text-gray-700">
                    Stok bittiğinde satmaya devam et
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    name="is_active"
                    checked={editingVariant.is_active}
                    onChange={(e) => handleEditingVariantChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    style={{accentColor: '#F39236'}}
                  />
                  <label htmlFor="edit_is_active" className="ml-2 text-sm text-gray-700">
                    Aktif
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={closeVariantDialog}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveVariant}
                className="px-4 py-2 text-white font-medium rounded-lg transition-colors hover:opacity-90"
                style={{backgroundColor: '#F39236'}}
              >
                {editingVariantIndex !== null ? 'Varyant Güncelle' : 'Varyant Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
