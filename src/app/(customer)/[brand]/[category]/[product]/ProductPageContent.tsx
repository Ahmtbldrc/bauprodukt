'use client'

import { AddToCartButton } from '@/components/cart'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, Download, Heart, ShoppingCart } from 'lucide-react'
import { 
  useBrandBySlug, 
  useCategoryBySlug, 
  useProductByBrandCategorySlug, 
  useProductsByBrand 
} from '@/hooks'
import { formatPrice, generateBrandURL, generateCategoryURL } from '@/lib/url-utils'
import Image from 'next/image'
import { Lens } from '@/components/magicui/lens'
import { FavoriteButton } from '@/components/favorites'

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
  const [activeTab, setActiveTab] = useState('specs')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0)

  // Fetch brand, category and product data
  const { data: brand } = useBrandBySlug(brandSlug)
  const { data: category } = useCategoryBySlug(categorySlug)
  const { 
    data: product, 
  } = useProductByBrandCategorySlug(brand?.id, category?.id, productSlug)

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
  const discountPercentage = hasDiscount && product?.price && product.discount_price !== undefined
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;
  const displayPrice = hasDiscount && product?.discount_price !== undefined
    ? product.discount_price
    : product?.price;

  // Get related products (excluding current product)
  const relatedProducts = relatedProductsResponse?.data?.filter(p => p.id !== product?.id)?.slice(0, 4) || []

  const handleThumbnailClick = (index: number) => {
    const actualIndex = thumbnailStartIndex + index
    setSelectedImageIndex(actualIndex)
  }

  return (
    <main className="flex-1 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/" className="text-gray-500 hover:text-gray-700">Startseite</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href={generateBrandURL(brand?.slug || '')} className="text-gray-500 hover:text-gray-700">
            {brand?.name}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href={generateCategoryURL(category?.slug || '')} className="text-gray-500 hover:text-gray-700">
            {category?.name}
          </Link>
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
                    onClick={() => setActiveTab('conversion')}
                    className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                      activeTab === 'conversion' 
                        ? 'border-[#F39236] text-[#F39236]' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Umrechnungsfaktoren
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
                    <p>
                      Dieses Produkt wurde mit den neuesten Technologien der Marke {brand?.name} hergestellt. 
                      Als führendes Produkt in der Kategorie {category?.name} wurde es mit Fokus auf 
                      Benutzererfahrung entwickelt.
                    </p>
                    
                    <h4>Anwendungsbereiche</h4>
                    <ul>
                      <li>Professionelle Anwendung</li>
                      <li>Haus- und Büroapplikationen</li>
                      <li>Industrielle Projekte</li>
                      <li>Dekorative Zwecke</li>
                    </ul>
                    
                    <h4>Produkteigenschaften</h4>
                    <p>
                      {product?.description || 'Dieses hochwertige Produkt'} wurde aus erstklassigen Materialien gefertigt und 
                      bietet jahrelange Nutzungsmöglichkeiten. Es zeichnet sich durch einfache Montage und Wartungsvorteile aus.
                    </p>
                  </div>
                )}
                
                {activeTab === 'specs' && (
                  <div className="prose max-w-none w-full">
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden w-full mx-0 p-4">
                      <div className="grid grid-cols-1">
                        <div className="flex border-b border-gray-100">
                          <div className="w-1/3 px-4 py-1 text-xs font-bold text-gray-900" style={{background: '#FFF0E2'}}>Marke</div>
                          <div className="w-2/3 px-4 py-1 text-xs" style={{background: '#FFF0E2'}}>{brand?.name || '-'}</div>
                        </div>
                        <div className="flex border-b border-gray-100">
                          <div className="w-1/3 px-4 py-1 text-xs font-bold text-gray-900">Serie</div>
                          <div className="w-2/3 px-4 py-1 text-xs">Smart</div>
                        </div>
                        <div className="flex border-b border-gray-100">
                          <div className="w-1/3 px-4 py-1 text-xs font-bold text-gray-900" style={{background: '#FFF0E2'}}>Ausprägung</div>
                          <div className="w-2/3 px-4 py-1 text-xs" style={{background: '#FFF0E2'}}>AD 153 mm, leer</div>
                        </div>
                        <div className="flex border-b border-gray-100">
                          <div className="w-1/3 px-4 py-1 text-xs font-bold text-gray-900">Energieeffizienzklasse</div>
                          <div className="w-2/3 px-4 py-1 text-xs">D</div>
                        </div>
                        <div className="flex border-b border-gray-100">
                          <div className="w-1/3 px-4 py-1 text-xs font-bold text-gray-900" style={{background: '#FFF0E2'}}>Durchflussmenge 1. Abgang</div>
                          <div className="w-2/3 px-4 py-1 text-xs" style={{background: '#FFF0E2'}}>L/min.</div>
                        </div>
                        <div className="flex border-b border-gray-100">
                          <div className="w-1/3 px-4 py-1 text-xs font-bold text-gray-900">Geräuschgruppe</div>
                          <div className="w-2/3 px-4 py-1 text-xs">I</div>
                        </div>
                        <div className="flex border-b border-gray-100">
                          <div className="w-1/3 px-4 py-1 text-xs font-bold text-gray-900" style={{background: '#FFF0E2'}}>Farbe</div>
                          <div className="w-2/3 px-4 py-1 text-xs" style={{background: '#FFF0E2'}}>Verchromt</div>
                        </div>
                        <div className="flex border-b border-gray-100">
                          <div className="w-1/3 px-4 py-1 text-xs font-bold text-gray-900">Gewicht</div>
                          <div className="w-2/3 px-4 py-1 text-xs">1.135 kg</div>
                        </div>
                        <div className="flex">
                          <div className="w-1/3 px-4 py-1 text-xs font-bold text-gray-900" style={{background: '#FFF0E2'}}>Volumen</div>
                          <div className="w-2/3 px-4 py-1 text-xs" style={{background: '#FFF0E2'}}>0.002 m³</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'documents' && (
                  <div className="prose max-w-none w-full">
                    <h3>Dokumente</h3>
                    <p>Hier finden Sie alle relevanten Dokumente für dieses Produkt.</p>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <p className="text-gray-500">Keine Dokumente verfügbar</p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'conversion' && (
                  <div className="prose max-w-none w-full">
                    <h3>Umrechnungsfaktoren</h3>
                    <p>Technische Umrechnungsfaktoren für dieses Produkt.</p>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <p className="text-gray-500">Keine Umrechnungsfaktoren verfügbar</p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'videos' && (
                  <div className="prose max-w-none w-full">
                    <h3>Videos</h3>
                    <p>Produktvideos und Anleitungen.</p>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <p className="text-gray-500">Keine Videos verfügbar</p>
                    </div>
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
                                  Abstellverschraubung, ½" x ½", ½" x ½" mit flacher Rosette, verchromt
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
                                  <button className="text-gray-400 border border-gray-200 rounded-sm hover:border-gray-300 hover:text-red-500 transition-all duration-200 flex items-center justify-center" style={{ width: '30px', height: '30px' }}>
                                    <Heart className="h-4 w-4" />
                                  </button>
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
                      <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-700">{brand.name.substring(0, 3).toUpperCase()}</span>
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
                    {category?.name}
                    {brand?.name && `, ${brand.name}`}
                    {product?.category?.name && `, ${product.category.name}`}
                  </p>
                </div>
                
                {/* Article and Manufacturer Numbers */}
                <div className="mb-6">
                  <p className="text-xs" style={{color: '#A3A3A3'}}>
                    Art-Nr. 123456789 | Hersteller-Nr. 987654321
                  </p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold" style={{color: '#F39236'}}>
                      {formatPrice(Number(displayPrice))}
                    </p>
                    {hasDiscount && (
                      <p className="text-base text-gray-500 line-through">
                        {formatPrice(Number(product?.price ?? 0))}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1 text-base">Technische Eigenschaften:</h3>
                  <ul className="space-y-0.5">
                    <li className="flex items-center text-xs" style={{color: '#A3A3A3'}}>
                      <span className="mr-1">›</span>
                      Premium Qualitätsmaterial
                    </li>
                    <li className="flex items-center text-xs" style={{color: '#A3A3A3'}}>
                      <span className="mr-1">›</span>
                      Langlebiges Design
                    </li>
                    <li className="flex items-center text-xs" style={{color: '#A3A3A3'}}>
                      <span className="mr-1">›</span>
                      Einfache Installation
                    </li>
                    <li className="flex items-center text-xs" style={{color: '#A3A3A3'}}>
                      <span className="mr-1">›</span>
                      2 Jahre Garantie
                    </li>
                    <li className="flex items-center text-xs" style={{color: '#A3A3A3'}}>
                      <span className="mr-1">›</span>
                      CE-Zertifikat
                    </li>
                  </ul>
                </div>
                
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
                
                <div className="flex space-x-4">
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
                const relatedDiscountPercentage = relatedHasDiscount 
                  ? Math.round(((relatedProduct.price - relatedProduct.discount_price!) / relatedProduct.price) * 100)
                  : 0
                
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
    </main>
  )
} 