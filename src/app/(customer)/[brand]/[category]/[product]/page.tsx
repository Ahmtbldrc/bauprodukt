'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AddToCartButton } from '@/components/cart'
import Link from 'next/link'
import { getProductByBrandCategorySlug, getProductsByBrand } from '@/lib/mock-data'
import { generateProductURLFromObject, formatPrice, generateBrandURL, generateCategoryURL } from '@/lib/url-utils'
import { notFound } from 'next/navigation'
import { useState, use } from 'react'
import { Heart } from 'lucide-react'
import type { Metadata } from 'next'

interface DynamicProductPageProps {
  params: Promise<{
    brand: string
    category: string
    product: string
  }>
}

export default function DynamicProductPage({ params }: DynamicProductPageProps) {
  const [activeTab, setActiveTab] = useState('details')
  const resolvedParams = use(params)
  const product = getProductByBrandCategorySlug(resolvedParams.brand, resolvedParams.category, resolvedParams.product)
  
  if (!product) {
    notFound()
  }

  // Get related products from same brand (excluding current product)
  const relatedProducts = getProductsByBrand(resolvedParams.brand)
    .filter(p => p.id !== product.id)
    .slice(0, 4)
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Startseite</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/brands" className="text-gray-500 hover:text-gray-700">Marken</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href={generateBrandURL(product.brand.slug)} className="text-gray-500 hover:text-gray-700">
              {product.brand.name}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href={generateCategoryURL(product.category.slug)} className="text-gray-500 hover:text-gray-700">
              {product.category.name}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
            {/* Product Images */}
            <div className="lg:col-span-3 flex gap-6">
              {/* Thumbnail Images - Sol tarafta dikey */}
              <div className="flex flex-col gap-4 w-32">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded cursor-pointer flex items-center justify-center hover:bg-gray-300 transition-colors">
                    <span className="text-sm text-gray-400">{i}</span>
                  </div>
                ))}
              </div>
              
              {/* Main Image - Sağ tarafta büyük */}
              <div className="flex-1">
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-xl">Hauptproduktbild</span>
                </div>
              </div>
            </div>
            
            {/* Product Info */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              <div className="mb-4">
                <Link href={generateBrandURL(product.brand.slug)} className="hover:underline" style={{color: '#F39236'}}>
                  {product.brand.name}
                </Link>
                <span className="mx-2 text-gray-400">•</span>
                <Link href={generateCategoryURL(product.category.slug)} className="hover:underline" style={{color: '#F39236'}}>
                  {product.category.name}
                </Link>
              </div>
              
              <p className="text-3xl font-bold mb-6" style={{color: '#F39236'}}>{formatPrice(product.price)}</p>
              
              <div className="mb-6">
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
              
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
              
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                {product.inStock ? (
                  <>
                    <p className="text-green-700 font-semibold flex items-center">
                      <span className="mr-2">✓</span>
                      Verfügbar - Sofortversand
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Bei heutiger Bestellung, morgen im Versand
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-red-700 font-semibold flex items-center">
                      <span className="mr-2">✗</span>
                      Nicht verfügbar
                    </p>
                    <p className="text-red-600 text-sm mt-1">
                      Wir kontaktieren den Lieferanten
                    </p>
                  </>
                )}
              </div>
              
              <div className="flex space-x-4">
                <AddToCartButton 
                  productId={product.id}
                  productStock={product.inStock ? 10 : 0} // Mock stock amount
                  disabled={!product.inStock}
                  className="flex-1"
                />
                <button className="h-12 w-12 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-500 transition-colors flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </button>
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
                    Dieses Produkt wurde mit den neuesten Technologien der Marke {product.brand.name} hergestellt. 
                    Als führendes Produkt in der Kategorie {product.category.name} wurde es mit Fokus auf 
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
                    {product.description} Dieses Produkt ist aus hochwertigen Materialien gefertigt und 
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
                        <li><strong>Marke:</strong> {product.brand.name}</li>
                        <li><strong>Kategorie:</strong> {product.category.name}</li>
                        <li><strong>Preis:</strong> {formatPrice(product.price)}</li>
                        <li><strong>Verfügbarkeit:</strong> {product.inStock ? 'Verfügbar' : 'Ausverkauft'}</li>
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
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {product.brand.name} - Weitere Produkte
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Link key={relatedProduct.id} href={generateProductURLFromObject(relatedProduct)}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Produktbild</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {relatedProduct.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {relatedProduct.category.name}
                        </p>
                        <p className="text-lg font-bold" style={{color: '#F39236'}}>
                          {formatPrice(relatedProduct.price)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 