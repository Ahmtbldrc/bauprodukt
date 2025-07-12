'use client'

import { AddToCartButton } from '@/components/cart'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Heart, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'
import { 
  useBrandBySlug, 
  useCategoryBySlug, 
  useProductByBrandCategorySlug, 
  useProductsByBrand 
} from '@/hooks'
import { formatPrice, generateBrandURL, generateCategoryURL } from '@/lib/url-utils'
import Image from 'next/image'
import { Lens } from '@/components/magicui/lens'
// @ts-ignore
import ReactImageMagnify from 'react-image-magnify';
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
  const [activeTab, setActiveTab] = useState('details')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0)

  // Fetch brand, category and product data
  const { data: brand, isLoading: brandLoading, error: brandError } = useBrandBySlug(brandSlug)
  const { data: category, isLoading: categoryLoading, error: categoryError } = useCategoryBySlug(categorySlug)
  const { 
    data: product, 
    isLoading: productLoading, 
    error: productError,
    refetch: refetchProduct 
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
  const hasDiscount = product?.discount_price && product?.discount_price < product?.price
  const discountPercentage = hasDiscount 
    ? Math.round(((product?.price - product?.discount_price!) / product?.price) * 100)
    : 0
  const displayPrice = hasDiscount ? product?.discount_price! : product?.price

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
          <Link href="/brands" className="text-gray-500 hover:text-gray-700">Marken</Link>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Product Images */}
          <div className="lg:col-span-3 flex gap-6">
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
                        className={`aspect-square bg-gray-200 rounded cursor-pointer overflow-hidden transition-all ${selectedImageIndex === actualIndex ? 'ring-2 ring-[#F39236]' : 'hover:bg-gray-300'}`}
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
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative">
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                    -{discountPercentage}%
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
          
          {/* Product Info */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product?.name || ''}
            </h1>
            
            <div className="mb-4">
              <Link href={generateBrandURL(brand?.slug || '')} className="hover:underline" style={{color: '#F39236'}}>
                {brand?.name}
              </Link>
              <span className="mx-2 text-gray-400">•</span>
              <Link href={generateCategoryURL(category?.slug || '')} className="hover:underline" style={{color: '#F39236'}}>
                {category?.name}
              </Link>
              {product?.stock_code && (
                <>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-gray-500">Code: {product?.stock_code}</span>
                </>
              )}
            </div>
            
            <div className="mb-6">
              {hasDiscount && (
                <p className="text-lg text-gray-500 line-through mb-1">
                  {formatPrice(Number(product?.price ?? 0))}
                </p>
              )}
              <p className="text-3xl font-bold" style={{color: '#F39236'}}>
                {formatPrice(Number(displayPrice))}
              </p>
            </div>
            
            {product?.description && (
              <div className="mb-6">
                <p className="text-gray-600 leading-relaxed">
                  {product?.description}
                </p>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Technische Eigenschaften:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Premium Qualitätsmaterial</li>
                <li>Langlebiges Design</li>
                <li>Einfache Installation</li>
                <li>2 Jahre Garantie</li>
                <li>CE-Zertifikat</li>
              </ul>
            </div>
            
            <div className="mb-6 p-4 rounded-lg">
              {product?.stock || 0 > 0 ? (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-700 text-xl">✓</span>
                    <span className="text-green-700 font-semibold">
                      Verfügbar ({product?.stock || 0} Stück) - Sofortversand
                    </span>
                  </div>
                  <div className="pl-7">
                    <span className="text-green-600 text-sm">
                      Bei heutiger Bestellung, morgen im Versand
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-700 text-xl">✗</span>
                    <span className="text-red-700 font-semibold">
                      Nicht verfügbar
                    </span>
                  </div>
                  <div className="pl-7">
                    <span className="text-red-600 text-sm">
                      Wir kontaktieren den Lieferanten
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-4">
              <AddToCartButton 
                productId={product?.id || ''}
                productStock={product?.stock || 0}
                disabled={!!(product?.stock === 0)}
                className="flex-1"
              />
              {product && (
                <FavoriteButton product={product} size="lg" className="h-12 w-12 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-500 flex items-center justify-center" />
              )}
            </div>
          </div>
        </div>
        
        {/* Product Tabs */}
        <div className="mb-12">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button 
                onClick={() => setActiveTab('details')}
                className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                  activeTab === 'details' 
                    ? 'border-[#F39236] text-[#F39236]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Produktdetails
              </button>
              <button 
                onClick={() => setActiveTab('specs')}
                className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                  activeTab === 'specs' 
                    ? 'border-[#F39236] text-[#F39236]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Technische Daten
              </button>
            </nav>
          </div>
          
          <div className="py-6">
            {activeTab === 'details' && (
              <div className="prose max-w-none">
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
              <div className="prose max-w-none">
                <h3>Technische Daten</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4>Allgemeine Eigenschaften</h4>
                    <ul>
                      <li><strong>Marke:</strong> {brand?.name}</li>
                      <li><strong>Kategorie:</strong> {category?.name}</li>
                      <li><strong>Preis:</strong> {formatPrice(Number(displayPrice))}</li>
                      {hasDiscount && <li><strong>Ursprungspreis:</strong> {formatPrice(Number(product?.price ?? 0))}</li>}
                      <li><strong>Verfügbarkeit:</strong> {product?.stock || 0 > 0 ? `${product?.stock || 0} Stück verfügbar` : 'Ausverkauft'}</li>
                      {product?.stock_code && <li><strong>Artikelnummer:</strong> {product?.stock_code}</li>}
                    </ul>
                  </div>
                  <div>
                    <h4>Qualität und Zertifikate</h4>
                    <ul>
                      <li>CE-Zertifikat</li>
                      <li>ISO 9001 Qualitätsstandard</li>
                      <li>2 Jahre Garantie</li>
                      <li>Europäische Produktion</li>
                      <li>Umweltfreundliches Material</li>
                    </ul>
                  </div>
                </div>
                
                <h4>Abmessungen und Gewicht</h4>
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-semibold">Produktabmessungen</td>
                      <td className="border border-gray-300 px-4 py-2">Nach Produktspezifikation</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-semibold">Verpackungsabmessungen</td>
                      <td className="border border-gray-300 px-4 py-2">Standard Versandgröße</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-semibold">Gewicht</td>
                      <td className="border border-gray-300 px-4 py-2">Variiert je nach Produkttyp</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Related Products */}
        {!relatedProductsLoading && relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {brand?.name} - Weitere Produkte
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
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                        {relatedHasDiscount && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold z-10">
                            -{relatedDiscountPercentage}%
                          </div>
                        )}
                        {relatedProduct.product_images?.[0]?.image_url || relatedProduct.image_url ? (
                          <Image
                            src={relatedProduct.product_images?.[0]?.image_url || relatedProduct.image_url || ''}
                            alt={relatedProduct.name || ''}
                            width={200}
                            height={200}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">Kein Bild</span>
                        )}
                        {relatedProduct.stock === 0 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-semibold">Ausverkauft</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {relatedProduct.name || ''}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {relatedProduct.category?.name || category?.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            {relatedHasDiscount && (
                              <p className="text-sm text-gray-500 line-through">
                                {formatPrice(Number(relatedProduct.price ?? 0))}
                              </p>
                            )}
                            <p className="text-lg font-bold" style={{color: '#F39236'}}>
                              {formatPrice(Number(relatedDisplayPrice))}
                            </p>
                          </div>
                          {relatedProduct.stock > 0 && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              Verfügbar
                            </span>
                          )}
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