'use client'

import { AddToCartButton } from '@/components/cart'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown, Download, ShoppingCart, Play } from 'lucide-react'
import { 
  useBrandBySlug, 
  useCategoryBySlug, 
  useProductByBrandCategorySlug, 
  useProductsByBrand 
} from '@/hooks'
import { formatPrice, generateBrandURL, generateCategoryURL } from '@/lib/url-utils'
import Image from 'next/image'
import { Lens } from '@/components/magicui/lens'
import VideoDialog from '@/components/ui/VideoDialog'
import { CustomerDocumentsTab } from '@/components/customer'

// Types for API data
interface TechnicalSpec {
  id?: string
  title: string
  description: string
  sort_order: number
}

interface ProductVariant {
  id: string
  sku: string
  title: string
  price: number
  compare_at_price?: number
  stock_quantity: number
  track_inventory: boolean
  continue_selling_when_out_of_stock: boolean
  is_active: boolean
  position: number
  attributes: any[]
}

interface ProductDocument {
  id: string
  title: string
  file_url: string
  file_type?: string
  file_size?: number
}

interface ProductVideo {
  id: string
  title: string
  video_url: string
  thumbnail_url?: string
  duration?: number
  file_size?: number
}

 


interface ProductPageContentProps {
  brandSlug: string
  categorySlug: string
  productSlug: string
}

export default function ProductPageContent({ 
  brandSlug, 
  categorySlug, 
  productSlug 
}: ProductPageContentProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0)
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({
    color: 'Rot',
    size: 'Mittel',
    material: 'Metall'
  })
  
  // Video dialog state
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)

  // New state for dynamic data from admin APIs
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [, setSpecifications] = useState<TechnicalSpec[]>([])
  const [documents, setDocuments] = useState<ProductDocument[]>([])
  const [videos, setVideos] = useState<ProductVideo[]>([])

  // Fetch brand, category and product data
  const { data: brand } = useBrandBySlug(brandSlug)
  const { data: category } = useCategoryBySlug(categorySlug)
  const { 
    data: product, 
  } = useProductByBrandCategorySlug(brand?.id, category?.id, productSlug)

  // Load dynamic data when product is loaded
  useEffect(() => {
    if (product?.id) {
      // Load specifications from product data
      const loadSpecifications = async () => {
        try {
          const productData = product as any
          if (productData.specifications_data) {
            // Check if it's already an object or needs parsing
            let specs = productData.specifications_data
            if (typeof specs === 'string') {
              specs = JSON.parse(specs)
            }
            if (specs.technical_specs && Array.isArray(specs.technical_specs)) {
              setSpecifications(specs.technical_specs)
            }
          }
        } catch (error) {
          console.error('Error loading specifications:', error)
        }
      }

      // Load variants
      const loadVariants = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}/variants/customer`)
          if (response.ok) {
            const data = await response.json()
            if (data.variants && Array.isArray(data.variants)) {
              setVariants(data.variants)
            }
          }
        } catch (error) {
          console.error('Error loading variants:', error)
        }
      }

      // Load documents
      const loadDocuments = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}/documents/customer`)
          if (response.ok) {
            const data = await response.json()
            if (data.data && Array.isArray(data.data)) {
              setDocuments(data.data)
            }
          }
        } catch (error) {
          console.error('Error loading documents:', error)
        }
      }

      // Load videos
      const loadVideos = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}/videos/customer`)
          if (response.ok) {
            const data = await response.json()
            if (data.data && Array.isArray(data.data)) {
              setVideos(data.data)
            }
          }
        } catch (error) {
          console.error('Error loading videos:', error)
        }
      }

      loadSpecifications()
      loadVariants()
      loadDocuments()
      loadVideos()
      
    }
  }, [product])

  // Fetch related products from same brand
  const { 
    data: relatedProductsResponse, 
    isLoading: relatedProductsLoading 
  } = useProductsByBrand(brand?.id || '', { limit: 20 })

  // Product images
  const productImages = product?.product_images?.length 
    ? product.product_images 
    : product?.image_url 
      ? [{ id: '1', image_url: product.image_url, order_index: 0, is_cover: true }]
      : []

  // Thumbnail navigation
  const maxVisibleThumbnails = 4;
  const totalImages = productImages.length;
  const visibleThumbnails = productImages.slice(
    thumbnailStartIndex,
    Math.min(thumbnailStartIndex + maxVisibleThumbnails, totalImages)
  );

  const handleThumbnailScrollDown = () => {
    if (selectedImageIndex < totalImages - 1) {
      // Eğer blok sonuna geldiyse thumbnailStartIndex'i artır
      if (
        thumbnailStartIndex < totalImages - maxVisibleThumbnails &&
        selectedImageIndex >= thumbnailStartIndex + maxVisibleThumbnails - 1
      ) {
        setThumbnailStartIndex(thumbnailStartIndex + 1);
      }
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handleThumbnailScrollUp = () => {
    if (selectedImageIndex > 0) {
      // Eğer blok başına geldiyse thumbnailStartIndex'i azalt
      if (
        thumbnailStartIndex > 0 &&
        selectedImageIndex <= thumbnailStartIndex
      ) {
        setThumbnailStartIndex(thumbnailStartIndex - 1);
      }
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  // Auto-scroll thumbnails when selected image changes
  useEffect(() => {
    if (selectedImageIndex < thumbnailStartIndex) {
      // Selected image is above visible area
      setThumbnailStartIndex(selectedImageIndex)
    } else if (selectedImageIndex >= thumbnailStartIndex + maxVisibleThumbnails) {
      // Selected image is below visible area
      setThumbnailStartIndex(Math.max(0, selectedImageIndex - maxVisibleThumbnails + 1))
    }
  }, [selectedImageIndex, thumbnailStartIndex, maxVisibleThumbnails])

  // Calculate discount information
  const hasDiscount = product?.discount_price !== undefined && product?.discount_price < product?.price;
  const displayPrice = hasDiscount && product?.discount_price !== undefined
    ? product.discount_price
    : product?.price;

  // Get related products (excluding current product)
  const relatedProducts = relatedProductsResponse?.data?.filter(p => p.id !== product?.id)?.slice(0, 4) || []

  const handleThumbnailClick = (index: number) => {
    const actualIndex = thumbnailStartIndex + index
    setSelectedImageIndex(actualIndex)
  }

  const handleVideoClick = (index: number) => {
    setSelectedVideoIndex(index)
    setIsVideoDialogOpen(true)
  }

  // Generate variant options from variants data
  const generateVariantOptions = useCallback(() => {
    const options: Record<string, string[]> = {
      color: [],
      size: [],
      material: []
    }

    variants.forEach(variant => {
      // Check if variant has attributes array
      if (variant.attributes && Array.isArray(variant.attributes)) {
        variant.attributes.forEach(attr => {
          if (attr.attribute_name === 'color' && !options.color.includes(attr.value)) {
            options.color.push(attr.value)
          } else if (attr.attribute_name === 'size' && !options.size.includes(attr.value)) {
            options.size.push(attr.value)
          } else if (attr.attribute_name === 'material' && !options.material.includes(attr.value)) {
            options.material.push(attr.value)
          }
        })
      }
      
      // Also check variant title for common patterns
      if (variant.title) {
        const title = variant.title.toLowerCase()
        if (title.includes('rot') || title.includes('red') && !options.color.includes('Rot')) {
          options.color.push('Rot')
        } else if (title.includes('blau') || title.includes('blue') && !options.color.includes('Blau')) {
          options.color.push('Blau')
        } else if (title.includes('grün') || title.includes('green') && !options.color.includes('Grün')) {
          options.color.push('Grün')
        }
        
        if (title.includes('klein') || title.includes('small') && !options.size.includes('Klein')) {
          options.size.push('Klein')
        } else if (title.includes('mittel') || title.includes('medium') && !options.size.includes('Mittel')) {
          options.size.push('Mittel')
        } else if (title.includes('groß') || title.includes('large') && !options.size.includes('Groß')) {
          options.size.push('Groß')
        }
        
        if (title.includes('metall') || title.includes('metal') && !options.material.includes('Metall')) {
          options.material.push('Metall')
        } else if (title.includes('kunststoff') || title.includes('plastic') && !options.material.includes('Kunststoff')) {
          options.material.push('Kunststoff')
        } else if (title.includes('holz') || title.includes('wood') && !options.material.includes('Holz')) {
          options.material.push('Holz')
        }
      }
    })

    return options
  }, [variants])

  const variantOptions = generateVariantOptions()
  
  // Set default selected values if variants are available
  useEffect(() => {
    if (variants.length > 0) {
      const options = generateVariantOptions()
      setSelectedValues(prev => ({
        color: options.color.length > 0 ? options.color[0] : prev.color,
        size: options.size.length > 0 ? options.size[0] : prev.size,
        material: options.material.length > 0 ? options.material[0] : prev.material
      }))
    }
  }, [variants, generateVariantOptions])

  // Fallback-safe category link/label
  const mainCategorySlug = category?.slug || categorySlug || product?.category?.slug || ''
  const mainCategoryName = category?.name || product?.category?.name || 'Kategorie'
  const subCategoryId = product?.category?.id
  const categoryHref = mainCategorySlug ? `${generateCategoryURL(mainCategorySlug)}${subCategoryId ? `?sub=${subCategoryId}` : ''}` : '#'

  return (
    <main className="flex-1 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/" className="text-gray-500 hover:text-gray-700">Startseite</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href={brand?.id ? `/products?brand=${brand.id}` : generateBrandURL(brand?.slug || '')} className="text-gray-500 hover:text-gray-700">
            {brand?.name}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          {mainCategorySlug ? (
            <Link href={categoryHref} className="text-gray-500 hover:text-gray-700">
              {mainCategoryName}
            </Link>
          ) : (
            <span className="text-gray-500">{mainCategoryName}</span>
          )}
          {product?.category?.name && (
            <>
              <span className="mx-2 text-gray-400">/</span>
              <Link href={categoryHref} className="text-gray-500 hover:text-gray-700">
                {product.category.name}
              </Link>
            </>
          )}
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">{product?.name || ''}</span>
        </nav>
        
        {/* Main Layout - Sticky Right Side */}
        <div className="flex gap-8">
          {/* Left Side - Scrollable Content */}
          <div className="flex-1">
            {/* Product Images */}
            <div className="flex gap-6 mb-8">
              {/* Thumbnail Images - Sol tarafta dikey */}
              {productImages.length > 1 && (
                <div className="flex flex-col w-32">
                  {/* Up Arrow */}
                  {selectedImageIndex > 0 && (
                    <button
                      onClick={handleThumbnailScrollUp}
                      className="h-8 w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded mb-2 transition-colors"
                    >
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                  
                  {/* Visible Thumbnails */}
                  <div className="flex flex-col gap-4">
                    {visibleThumbnails.map((image, index) => {
                      const actualIndex = thumbnailStartIndex + index;
                      return (
                        <div
                          key={image.id}
                          className={`aspect-square bg-white rounded cursor-pointer overflow-hidden transition-all ${selectedImageIndex === actualIndex ? 'ring-2 ring-[#F39236]' : 'hover:bg-gray-100'}`}
                          onClick={() => handleThumbnailClick(index)}
                        >
                          {image.image_url ? (
                            <Image
                              src={image.image_url}
                              alt={`${product?.name || ''} - Bild ${actualIndex + 1}`}
                              width={128}
                              height={128}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-sm text-gray-400">{actualIndex + 1}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Down Arrow */}
                  {selectedImageIndex < totalImages - 1 && (
                    <button
                      onClick={handleThumbnailScrollDown}
                      className="h-8 w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded mt-2 transition-colors"
                    >
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Main Image */}
              <div className="flex-1">
                <div className="aspect-square bg-white rounded-lg overflow-hidden relative border border-gray-200">
                  {hasDiscount && (
                    <div className="absolute top-4 left-4 text-white px-4 py-1.5 rounded-sm text-lg font-light z-10" style={{backgroundColor: '#F39236'}}>
                      Sale
                    </div>
                  )}
                  {productImages.length > 0 && productImages[selectedImageIndex]?.image_url ? (
                    <Lens zoomFactor={2} lensSize={200} ariaLabel="Zoom Area">
                      <Image
                        src={productImages[selectedImageIndex]?.image_url}
                        alt={product?.name || ''}
                        width={800}
                        height={800}
                        className="w-full h-full object-contain select-none pointer-events-none"
                        priority
                      />
                    </Lens>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-500 text-xl">Kein Produktbild</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Tabs */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Informationen</h3>
                <button className="text-gray-400 border border-gray-200 rounded-sm hover:border-gray-300 hover:text-gray-900 transition-all duration-200 flex items-center justify-center" style={{ width: '30px', height: '30px' }}>
                  <Download className="h-4 w-4" />
                </button>
              </div>
              <div className="w-full">
                <nav className="-mb-px flex space-x-8 w-full">
                  <button 
                    onClick={() => setActiveTab('details')}
                    className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                      activeTab === 'details' 
                        ? 'border-[#F39236] text-[#F39236]' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Produktbeschreibung
                  </button>
                  <button 
                    onClick={() => setActiveTab('specs')}
                    className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                      activeTab === 'specs' 
                        ? 'border-[#F39236] text-[#F39236]' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Technische Details
                  </button>
                  <button 
                    onClick={() => setActiveTab('documents')}
                    className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                      activeTab === 'documents' 
                        ? 'border-[#F39236] text-[#F39236]' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Dokumente
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('videos')}
                    className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                      activeTab === 'videos' 
                        ? 'border-[#F39236] text-[#F39236]' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Videos
                  </button>
                </nav>
              </div>
              
              <div className="py-6 w-full">
                {activeTab === 'details' && (
                  <div className="prose max-w-none w-full">
                    <h3>Produktbeschreibung</h3>
                    {product?.description ? (
                      <div className="text-sm text-gray-700 whitespace-pre-line">
                        {product.description}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Keine Produktbeschreibung vorhanden.</p>
                    )}
                  </div>
                )}
                
                {activeTab === 'specs' && (
                  <div className="prose max-w-none w-full">
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden w-full mx-0 p-4">
                      <div className="grid grid-cols-1">
                        {(() => {
                          const productData = product as any
                          let specs: any[] = []
                          
                          if (productData?.specifications_data) {
                            try {
                              let specsData = productData.specifications_data
                              if (typeof specsData === 'string') {
                                specsData = JSON.parse(specsData)
                              }
                              if (specsData.technical_specs && Array.isArray(specsData.technical_specs)) {
                                specs = specsData.technical_specs
                              }
                            } catch (e) {
                              console.error('Error parsing specifications:', e)
                            }
                          }
                          
                          if (specs.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">Keine technischen Spezifikationen verfügbar</p>
                              </div>
                            )
                          }
                          
                          return specs.map((spec: any, index: number) => (
                            <div key={spec.id || index} className={`flex ${index === specs.length - 1 ? '' : 'border-b border-gray-100'}`}>
                              <div className={`w-1/3 px-4 py-1 text-xs font-bold text-gray-900 ${index % 2 === 0 ? '' : ''}`} style={index % 2 === 0 ? {background: '#FFF0E2'} : {}}>
                                {spec.title}
                              </div>
                              <div className={`w-2/3 px-4 py-1 text-xs ${index % 2 === 0 ? '' : ''}`} style={index % 2 === 0 ? {background: '#FFF0E2'} : {}}>
                                {spec.description}
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>


                  </div>
                )}
                
                {activeTab === 'documents' && (
                  <CustomerDocumentsTab documents={documents} />
                )}
                
                
                
                {activeTab === 'videos' && (
                  <div className="prose max-w-none w-full">
                    <h3>Videos</h3>
                    {videos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {videos.map((video, index) => (
                          <div 
                            key={video.id} 
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleVideoClick(index)}
                          >
                            {video.thumbnail_url ? (
                              <div className="aspect-video bg-gray-100 relative">
                                <Image
                                  src={video.thumbnail_url}
                                  alt={video.title}
                                  width={300}
                                  height={200}
                                  className="w-full h-full object-cover"
                                />
                                {/* Play button overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                                  <Play className="h-12 w-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                                <Play className="h-12 w-12 text-gray-400" />
                                {/* Play button overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                                  <Play className="h-12 w-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            )}
                            <div className="p-4">
                              <h4 className="font-medium text-gray-900 text-sm mb-2">{video.title}</h4>
                              {video.duration && (
                                <p className="text-xs text-gray-500">{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</p>
                              )}
                              <div className="mt-3 w-full bg-[#F39236] text-white text-sm py-2 px-4 rounded hover:bg-[#E67E22] transition-colors text-center">
                                Video ansehen
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <p className="text-gray-500">Keine Videos verfügbar</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Verwandte Produkte Section */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Verwandte Produkte</h3>
              </div>
              
              <div className="w-full">
                <nav className="-mb-px flex space-x-8 w-full ml-4">
                  <button className="border-b-2 py-2 px-1 text-sm font-medium transition-colors border-transparent text-gray-500 hover:text-gray-700">
                    Ersatzteile
                  </button>
                  <button className="border-b-2 py-2 px-1 text-sm font-medium transition-colors border-[#F39236] text-[#F39236]">
                    Zubehör
                  </button>
                </nav>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6 w-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 px-1">
                      <input type="checkbox" className="rounded border-gray-300 w-4 h-4" />
                    </div>
                    <label className="text-sm text-gray-600">
                      Alle auswählen
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs rounded-full w-5 h-5 flex items-center justify-center border border-[#F39236]" style={{backgroundColor: '#FFF0E2', color: '#F39236'}}>5</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Product Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <tbody>
                      {[1, 2, 3, 4, 5].map((item) => (
                        <tr key={item} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-1 border-r border-gray-200 w-6">
                            <input type="checkbox" className="rounded border-gray-300 w-4 h-4" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-4">
                              {/* Product Image */}
                              <div className="w-16 h-12 bg-white border border-gray-200 rounded flex items-center justify-center">
                                <div className="w-12 h-8 bg-gray-100 rounded"></div>
                              </div>
                              
                              {/* Product Details */}
                              <div className="flex-1 max-w-sm">
                                <h4 className="font-bold text-gray-900 text-sm mb-1">
                                  Abstellverschraubung, ½ x ½, ½ x ½ mit flacher Rosette, verchromt
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Art-Nr. 123456789 | Hersteller-Nr. 987654321
                                </p>
                              </div>
                              
                              {/* Quantity and Action Controls */}
                              <div className="flex flex-col gap-2 ml-auto">
                                {/* Quantity Selector */}
                                <div className="flex items-center border border-gray-200 rounded-sm" style={{ width: '105px', height: '30px' }}>
                                  <button className="w-9 h-full flex items-center justify-center hover:bg-gray-50 border-r" style={{color: '#A3A3A3', borderColor: '#F2F2F2'}}>
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                  </button>
                                  <div className="w-9 h-full flex items-center justify-center text-sm" style={{color: '#A3A3A3'}}>
                                    1
                                  </div>
                                  <button className="w-9 h-full flex items-center justify-center hover:bg-gray-50 border-l" style={{color: '#A3A3A3', borderColor: '#F2F2F2'}}>
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <button className="text-gray-400 border border-gray-200 rounded-sm hover:border-gray-300 hover:text-gray-900 transition-all duration-200 flex items-center justify-center" style={{ width: '30px', height: '30px' }}>
                                    <ShoppingCart className="h-4 w-4" />
                                  </button>
                                  <button className="text-gray-400 border border-gray-200 rounded-sm hover:border-gray-300 hover:text-gray-900 transition-all duration-200 flex items-center justify-center" style={{ width: '30px', height: '30px' }}>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sticky */}
          <div className="w-96 flex-shrink-0 relative">
            <div 
              className="sticky top-40 max-h-screen overflow-y-auto bg-white" 
              style={{ 
                position: 'sticky', 
                top: '160px', 
                zIndex: 10,
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}
            >
              {/* Product Info */}
              <div className="mb-8">
                {/* Brand Logo and Product Name */}
                <div className="mb-4">
                  {brand?.name && (
                    <div className="mb-3">
                      <div className={`w-16 h-12 relative rounded flex items-center justify-center overflow-hidden ${brand.logo ? '' : 'bg-gray-100'}`}>
                        {brand.logo ? (
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            fill
                            sizes="64px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-700 text-center px-1 truncate w-full">
                            {brand.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {product?.name || ''}
                    </h1>
                  </div>
                </div>
                
                {/* Categories */}
                <div className="mb-0">
                  <p className="text-xs" style={{color: '#A3A3A3'}}>
                    {mainCategorySlug ? (
                      <Link href={categoryHref} className="hover:text-orange-600">
                        {mainCategoryName}
                      </Link>
                    ) : (
                      <span>{mainCategoryName}</span>
                    )}
                    {product?.category?.name && (
                      <>
                        {' / '}
                        {mainCategorySlug && subCategoryId ? (
                          <Link href={`${generateCategoryURL(mainCategorySlug)}?sub=${subCategoryId}`} className="hover:text-orange-600">
                            {product.category.name}
                          </Link>
                        ) : (
                          <span>{product.category.name}</span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                
                {/* Article and Manufacturer Numbers */}
                <div className="mb-6">
                  <p className="text-xs" style={{color: '#A3A3A3'}}>
                    Art-Nr. {product?.art_nr || '-'}
                  </p>
                  <p className="text-xs" style={{color: '#A3A3A3'}}>
                    Hersteller-Nr. {product?.hersteller_nr || '-'}
                  </p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    {hasDiscount && (
                      <p className="text-xl" style={{ 
                        color: '#A3A3A3',
                        textDecoration: 'line-through 2px #A3A3A3',
                        textDecorationSkipInk: 'none',
                        '--tw-text-decoration-offset': '0.2em'
                      } as React.CSSProperties}>
                        {formatPrice(Number(product?.price ?? 0))}
                      </p>
                    )}
                    <p className="text-xl font-bold" style={{color: '#F39236'}}>
                      {formatPrice(Number(displayPrice))}
                    </p>
                  </div>
                </div>

                {/* Dynamic Variant Selector based on variants data */}
                {variants.length > 0 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Color Selection */}
                      {variantOptions.color.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Farbe
                          </label>
                          <select
                            value={selectedValues.color}
                            onChange={(e) => setSelectedValues(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#F39236]"
                          >
                            {variantOptions.color.map(color => (
                              <option key={color} value={color}>{color}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Size Selection */}
                      {variantOptions.size.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Größe
                          </label>
                          <select
                            value={selectedValues.size}
                            onChange={(e) => setSelectedValues(prev => ({ ...prev, size: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#F39236]"
                          >
                            {variantOptions.size.map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Material Selection */}
                      {variantOptions.material.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Material
                          </label>
                          <select
                            value={selectedValues.material}
                            onChange={(e) => setSelectedValues(prev => ({ ...prev, material: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#F39236]"
                          >
                            {variantOptions.material.map(material => (
                              <option key={material} value={material}>{material}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                
                
                {/* Stock Status Badge */}
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center whitespace-nowrap px-2" style={{
                    width: (product?.stock || 0) <= 0 ? '90px' : (product?.stock || 0) <= 5 ? '115px' : '80px',
                    height: '22px',
                    background: (product?.stock || 0) <= 0 ? '#E0BEBB 0% 0% no-repeat padding-box' : (product?.stock || 0) <= 5 ? '#FFF0E2 0% 0% no-repeat padding-box' : '#E9EDD0 0% 0% no-repeat padding-box',
                    border: (product?.stock || 0) <= 0 ? '1px solid #A63F35' : (product?.stock || 0) <= 5 ? '1px solid #F39237' : '1px solid #AAB560',
                    borderRadius: '5px',
                    opacity: 1
                  }}>
                    <div className="relative mr-1">
                      <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
                        color: (product?.stock || 0) <= 0 ? '#A63F35' : (product?.stock || 0) <= 5 ? '#F39237' : '#AAB560'
                      }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-white rounded-full border flex items-center justify-center" style={{
                        borderColor: (product?.stock || 0) <= 0 ? '#A63F35' : (product?.stock || 0) <= 5 ? '#F39237' : '#AAB560'
                      }}>
                        <svg className="w-0.5 h-0.5" fill="currentColor" viewBox="0 0 24 24" style={{
                          color: (product?.stock || 0) <= 0 ? '#A63F35' : (product?.stock || 0) <= 5 ? '#F39237' : '#AAB560'
                        }}>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </div>
                    </div>
                    <span className="text-xs font-medium" style={{
                      color: (product?.stock || 0) <= 0 ? '#A63F35' : (product?.stock || 0) <= 5 ? '#F39237' : '#AAB560'
                    }}>
                      {(product?.stock || 0) <= 0 ? 'Ausverkauft' : (product?.stock || 0) <= 5 ? 'Wenig auf Lager' : 'Auf Lager'}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-4 items-center">
                  <AddToCartButton 
                    productId={product?.id || ''}
                    productStock={product?.stock || 0}
                    disabled={!!(product?.stock === 0)}
                    className="flex-1"
                    product={product ? {
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      description: product.description ?? '',
                      price: product.price,
                      originalPrice: product.discount_price ?? undefined,
                      image: product.image_url ?? undefined,
                      brand: {
                        id: product.brand?.id ?? '',
                        name: product.brand?.name ?? '',
                        slug: product.brand?.slug ?? '',
                      },
                      category: {
                        id: product.category?.id ?? '',
                        name: product.category?.name ?? '',
                        slug: product.category?.slug ?? '',
                      },
                      inStock: product.stock > 0,
                      onSale: !!product.discount_price,
                      discountPercentage: undefined,
                      addedAt: '', // Set as needed
                    } : undefined}
                  />

                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Related Products - Outside Sticky Area */}
        {!relatedProductsLoading && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Weitere Produkte
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => {
                const relatedHasDiscount = relatedProduct.discount_price && relatedProduct.discount_price < relatedProduct.price
                const relatedDisplayPrice = relatedHasDiscount ? relatedProduct.discount_price! : relatedProduct.price
                
                // Generate product URL
                const productURL = `/${relatedProduct.brand?.slug || ''}/${relatedProduct.category?.slug || ''}/${relatedProduct.slug}`
                
                return (
                  <Link key={relatedProduct.id} href={productURL}>
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative">
                      <div className="relative">
                        {/* Product Image */}
                        <div className="h-48 bg-white overflow-hidden">
                          {relatedProduct.product_images?.[0]?.image_url || relatedProduct.image_url ? (
                            <Image
                              src={relatedProduct.product_images?.[0]?.image_url || relatedProduct.image_url || ''}
                              alt={relatedProduct.name || ''}
                              width={200}
                              height={200}
                              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-500 text-sm">Produktbild</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Divider Line */}
                        <div className="h-px bg-gray-200"></div>
                        
                        {/* Sale Badge - Top Right */}
                        {relatedHasDiscount && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-1 text-xs rounded font-medium" style={{backgroundColor: '#F39236', color: '#F2F2F2'}}>
                              Sale
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        {/* Stock Status Icon */}
                        <div className="flex items-center mb-2">
                          <div className={`w-5 h-5 rounded flex items-center justify-center mr-2`} style={{
                            background: relatedProduct.stock <= 0 ? '#E0BEBB' : relatedProduct.stock <= 5 ? '#FFF0E2' : '#E9EDD0',
                            border: relatedProduct.stock <= 0 ? '1px solid #A63F35' : relatedProduct.stock <= 5 ? '1px solid #F39237' : '1px solid #AAB560',
                            borderRadius: '5px'
                          }}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
                              color: relatedProduct.stock <= 0 ? '#A63F35' : relatedProduct.stock <= 5 ? '#F39237' : '#AAB560'
                            }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Product Name */}
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 h-12 text-sm">
                          {relatedProduct.name || ''}
                        </h3>
                        
                        {/* Category Description */}
                        <p className="text-xs text-gray-500 mb-3">
                          {relatedProduct.category?.name || category?.name}
                        </p>
                        
                        {/* Price */}
                        <div className="flex items-center gap-2">
                          {relatedHasDiscount && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(Number(relatedProduct.price ?? 0))}
                            </span>
                          )}
                          <span className="text-lg font-bold" style={{color: '#F39236'}}>
                            {formatPrice(Number(relatedDisplayPrice))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Video Dialog */}
      <VideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        videos={videos}
        initialVideoIndex={selectedVideoIndex}
      />
    </main>
  )
} 