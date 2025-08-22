'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useProductById, useProductVariants, useProductImages } from '@/hooks/useProducts'
import { useAllBrands } from '@/hooks/useBrands'
import { useAllCategories } from '@/hooks/useCategories'
import { Info, Settings, Package, ImageIcon, FileText, Calculator, Play } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import GeneralTab from '@/components/admin/tabs/GeneralTab'
import SpecificationsTab from '@/components/admin/tabs/SpecificationsTab'
import VariantsTab from '@/components/admin/tabs/VariantsTab'
import ImagesTab from '@/components/admin/tabs/ImagesTab'
import DocumentsTab from '@/components/admin/tabs/DocumentsTab'
import ConversionTab from '@/components/admin/tabs/ConversionTab'
import VideosTab from '@/components/admin/tabs/VideosTab'
import PageHeader from '@/components/admin/PageHeader'
import WaitlistAlert from '@/components/admin/WaitlistAlert'
import TabNavigation from '@/components/admin/TabNavigation'
import VideoDialog from '@/components/admin/VideoDialog'
import LoadingState from '@/components/admin/LoadingState'
import ErrorState from '@/components/admin/ErrorState'
import FormActions from '@/components/admin/FormActions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { 
  Variant, 
  ProductImage, 
  VariantResponse, 
  ImageResponse,
  FormData,
  Specifications,
  Document,
  ProductDocument,
  ConversionFactors,
  ProductConversionFactors,
  Video,
  ProductVideo,
  WaitlistInfo,
  ActiveTab
} from '@/types/admin/product-edit'

// Import TechnicalSpec type for the specifications
type TechnicalSpec = {
  id?: string
  title: string
  description: string
  sort_order: number
}

// DocumentImage type for documents tab
type DocumentImage = {
  id: string
  file: File
  previewUrl: string
  name: string
  file_url?: string
  file_type?: string
  file_size?: number
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const { data: product, isLoading: isProductLoading, error: productError } = useProductById(productId)
  const { data: variantsResponse, isLoading: isVariantsLoading } = useProductVariants(productId)
  const { data: imagesResponse, isLoading: isImagesLoading, refetch: refetchImages } = useProductImages(productId)
  const { data: brandsResponse } = useAllBrands()
  const { data: categoriesResponse } = useAllCategories()
  
  const brands = brandsResponse?.data || []
  const categories = categoriesResponse?.data || []

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '',
    stock_code: '',
    art_nr: '',
    hersteller_nr: '',
    image_url: '',
    brand_id: '',
    category_id: '',
    technical_specs: [],
    general_technical_specs: []
  })

  const [variants, setVariants] = useState<Variant[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('general')
  const [isSavingGeneral, setIsSavingGeneral] = useState(false)
  const [isSavingConversion, setIsSavingConversion] = useState(false)
  const [isSavingSpecifications, setIsSavingSpecifications] = useState(false)
  const [isSavingVariants, setIsSavingVariants] = useState(false)


  // New state for additional tabs
  const [specifications, setSpecifications] = useState<Specifications>({
    technical_specs: [],
    general_technical_specs: []
  })

  const [documents, setDocuments] = useState<DocumentImage[]>([])

  const [conversionFactors, setConversionFactors] = useState<ConversionFactors>({
    length_units: true,
    weight_units: true,
    volume_units: false,
    temperature_units: false
  })

  const [videos, setVideos] = useState<ProductVideo[]>([])



  // Video dialog state
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  // Dialog state'leri için
  const [specificationsDeleteDialog, setSpecificationsDeleteDialog] = useState<{
    isOpen: boolean
    index: number | null
  }>({
    isOpen: false,
    index: null
  })

  const [variantsDeleteDialog, setVariantsDeleteDialog] = useState<{
    isOpen: boolean
    index: number | null
  }>({
    isOpen: false,
    index: null
  })

  const [imagesDeleteDialog, setImagesDeleteDialog] = useState<{
    isOpen: boolean
    index: number | null
  }>({
    isOpen: false,
    index: null
  })

  const [documentsDeleteDialog, setDocumentsDeleteDialog] = useState<{
    isOpen: boolean
    index: number | null
  }>({
    isOpen: false,
    index: null
  })

  const [videosDeleteDialog, setVideosDeleteDialog] = useState<{
    isOpen: boolean
    index: number | null
  }>({
    isOpen: false,
    index: null
  })


  // Waitlist durumu için state
  const [waitlistInfo, setWaitlistInfo] = useState<WaitlistInfo | null>(null)

  // Dialog yönetim fonksiyonları
  const openSpecificationsDeleteDialog = (index: number) => {
    setSpecificationsDeleteDialog({ isOpen: true, index })
  }

  const closeSpecificationsDeleteDialog = () => {
    setSpecificationsDeleteDialog({ isOpen: false, index: null })
  }

  const confirmSpecificationsDelete = async () => {
    if (specificationsDeleteDialog.index === null) return
    
    try {
      // API call to delete the specification
      const specToDelete = specifications.technical_specs[specificationsDeleteDialog.index]
      
      // If the spec has an ID, call API to delete from database
      if (specToDelete.id) {
        const response = await fetch(`/api/admin/products/specifications/${specToDelete.id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete specification')
        }
      }
      
      // Remove from local state
      const newSpecs = specifications.technical_specs.filter((_, i) => i !== specificationsDeleteDialog.index)
      setSpecifications({
        ...specifications,
        technical_specs: newSpecs
      })
      
      closeSpecificationsDeleteDialog()
      toast.success('Spezifikation erfolgreich gelöscht!')
    } catch (error) {
      console.error('Error deleting specification:', error)
      toast.error('Fehler beim Löschen der Spezifikation')
    }
  }

  const openVariantsDeleteDialog = (index: number) => {
    setVariantsDeleteDialog({ isOpen: true, index })
  }

  const closeVariantsDeleteDialog = () => {
    setVariantsDeleteDialog({ isOpen: false, index: null })
  }

  const confirmVariantsDelete = async () => {
    if (variantsDeleteDialog.index === null) return
    
    try {
      // Remove from local state
      const newVariants = variants.filter((_, i) => i !== variantsDeleteDialog.index)
      setVariants(newVariants)
      
      closeVariantsDeleteDialog()
      toast.success('Variante erfolgreich gelöscht!')
    } catch (error) {
      console.error('Error deleting variant:', error)
      toast.error('Fehler beim Löschen der Variante')
    }
  }

  const openImagesDeleteDialog = (index: number) => {
    setImagesDeleteDialog({ isOpen: true, index })
  }

  const closeImagesDeleteDialog = () => {
    setImagesDeleteDialog({ isOpen: false, index: null })
  }

  const confirmImagesDelete = async () => {
    if (imagesDeleteDialog.index === null) return
    
    try {
      // Remove from local state
      const newImages = images.filter((_, i) => i !== imagesDeleteDialog.index)
      setImages(newImages)
      
      closeImagesDeleteDialog()
      toast.success('Bild erfolgreich gelöscht!')
      refetchImages() // Refresh images from API
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Fehler beim Löschen des Bildes')
    }
  }

  const openDocumentsDeleteDialog = (index: number) => {
    setDocumentsDeleteDialog({ isOpen: true, index })
  }

  const closeDocumentsDeleteDialog = () => {
    setDocumentsDeleteDialog({ isOpen: false, index: null })
  }

  const confirmDocumentsDelete = async () => {
    if (documentsDeleteDialog.index === null) return
    
    try {
      const documentToDelete = documents[documentsDeleteDialog.index]
      
      // Make API call to delete the document from database
      if (documentToDelete.id) {
        const response = await fetch(`/api/products/${productId}/documents/${documentToDelete.id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete document')
        }
      }
      
      // Remove from local state
      const newDocuments = documents.filter((_, i) => i !== documentsDeleteDialog.index)
      setDocuments(newDocuments)
      
      closeDocumentsDeleteDialog()
      toast.success('Dokument erfolgreich gelöscht!')
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Fehler beim Löschen des Dokuments')
    }
  }

  const openVideosDeleteDialog = (index: number) => {
    setVideosDeleteDialog({ isOpen: true, index })
  }

  const closeVideosDeleteDialog = () => {
    setVideosDeleteDialog({ isOpen: false, index: null })
  }

  const confirmVideosDelete = async () => {
    if (videosDeleteDialog.index === null) return
    
    try {
      const videoToDelete = videos[videosDeleteDialog.index]
      
      // Make API call to delete the video from database
      if (videoToDelete.id) {
        const response = await fetch(`/api/products/${productId}/videos/${videoToDelete.id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete video')
        }
      }
      
      // Remove from local state
      const newVideos = videos.filter((_, i) => i !== videosDeleteDialog.index)
      setVideos(newVideos)
      
      closeVideosDeleteDialog()
      toast.success('Video erfolgreich gelöscht!')
    } catch (error) {
      console.error('Error deleting video:', error)
      toast.error('Fehler beim Löschen des Videos')
    }
  }

  // Populate form when product data is loaded
  useEffect(() => {
    if (product) {
      console.log('Product loaded, setting form data:', product)
      console.log('art_nr in product:', product.art_nr)
      console.log('hersteller_nr in product:', product.hersteller_nr)
      
              setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          discount_price: product.discount_price?.toString() || '',
          stock: product.stock?.toString() || '',
          stock_code: product.stock_code || '',
          art_nr: product.art_nr || '',
          hersteller_nr: product.hersteller_nr || '',
          image_url: product.image_url || '',
          brand_id: product.brand_id || '',
          category_id: product.category_id || '',
          technical_specs: [],
          general_technical_specs: Array.isArray(product.general_technical_specs) ? product.general_technical_specs : []
        })
    }
  }, [product])

  // Debug: Form data değişikliklerini izle
  useEffect(() => {
    console.log('Form data changed:', formData)
  }, [formData])

  // Debug: Specifications değişikliklerini izle
  useEffect(() => {
    console.log('Specifications changed:', specifications)
  }, [specifications])

  // Load variants when variants data is loaded
  useEffect(() => {
    console.log('🔄 Variants useEffect triggered')
    console.log('variantsResponse:', variantsResponse)
    console.log('variantsResponse?.variants:', variantsResponse?.variants)
    
    if (variantsResponse?.variants) {
      console.log('✅ Loading variants from response')
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
        position: variant.position || 0,
        attributes: []
      }))
      console.log('📋 Loaded variants:', loadedVariants)
      setVariants(loadedVariants)
    } else {
      console.log('❌ No variants in response or response is empty')
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

  // Load additional data when product is loaded
  useEffect(() => {
    if (product) {
      // Load specifications from specifications_data if available
      console.log('Product specifications_data:', product.specifications_data)
      console.log('Product specifications_data type:', typeof product.specifications_data)
      console.log('Product specifications_data keys:', product.specifications_data ? Object.keys(product.specifications_data) : 'undefined')
      
      // Load general_technical_specs directly from product
      console.log('Product general_technical_specs:', product.general_technical_specs)
      console.log('Product general_technical_specs type:', typeof product.general_technical_specs)
      console.log('Product general_technical_specs is array:', Array.isArray(product.general_technical_specs))
      
      if (product.specifications_data && typeof product.specifications_data === 'object') {
        const specs = product.specifications_data as any
        console.log('Parsed specs:', specs)
        console.log('Technical specs array:', specs.technical_specs)
        console.log('Technical specs type:', typeof specs.technical_specs)
        console.log('Technical specs is array:', Array.isArray(specs.technical_specs))
        
        setSpecifications({
          technical_specs: Array.isArray(specs.technical_specs) ? specs.technical_specs : [],
          general_technical_specs: Array.isArray(specs.general_technical_specs) ? specs.general_technical_specs : []
        })
        
        // Load general technical specs from specifications_data if available
        if (specs.general_technical_specs) {
          setFormData(prev => ({
            ...prev,
            general_technical_specs: specs.general_technical_specs
          }))
        }
      } else {
        console.log('No specifications_data found or not an object')
      }
      
      // Load general_technical_specs directly from product if not in specifications_data
      if (product.general_technical_specs && Array.isArray(product.general_technical_specs)) {
        console.log('Loading general_technical_specs directly from product:', product.general_technical_specs)
        setFormData(prev => ({
          ...prev,
          general_technical_specs: product.general_technical_specs as any
        }))
      } else {
        console.log('No general_technical_specs found in product or not an array')
      }

      // Load conversion factors from API
      const loadConversionFactors = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}/conversion-factors`)
          if (response.ok) {
            const data = await response.json()
            setConversionFactors(data)
          }
        } catch (error) {
          console.log('No conversion factors found, using defaults')
        }
      }

      loadConversionFactors()

      // Load documents from API
      const loadDocuments = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}/documents`)
          if (response.ok) {
            const data = await response.json()
            // Convert ProductDocument to DocumentImage format
            const convertedDocuments = (data.data || []).map((doc: any) => ({
              id: doc.id,
              file: null, // We don't have the actual file, just the URL
              previewUrl: doc.file_url,
              name: doc.title,
              file_url: doc.file_url,
              file_type: doc.file_type,
              file_size: doc.file_size
            }))
            setDocuments(convertedDocuments)
          }
        } catch (error) {
          console.log('No documents found')
        }
      }

      // Load videos from API
      const loadVideos = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}/videos`)
          if (response.ok) {
            const data = await response.json()
            setVideos(data.data || [])
          }
        } catch (error) {
          console.log('No videos found')
        }
      }

      loadDocuments()
      loadVideos()
    }
  }, [product])

  // Ürünün waitlist durumunu kontrol et
  useEffect(() => {
    const checkWaitlistStatus = async () => {
      if (product) {
        try {
          const { data } = await supabase
            .from('waitlist_updates')
            .select('*')
            .eq('product_id', product.id)
            .single()
          
          setWaitlistInfo(data)
        } catch {
          // Ürün için waitlist entry yoksa hata olur, bu normal
          setWaitlistInfo(null)
        }
      }
    }
    
    checkWaitlistStatus()
  }, [product])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | any) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }



  // New handler functions for additional tabs
  const handleSpecificationChange = (field: string, value: string | TechnicalSpec[]) => {
    setSpecifications(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Specifications için kaydetme fonksiyonu
  const handleSaveSpecifications = async () => {
    setIsSavingSpecifications(true)
    try {
      // specifications_data'yı güncelle
      const specificationsData = {
        technical_specs: specifications.technical_specs
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specifications_data: specificationsData
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Spezifikationen konnten nicht gespeichert werden')
      }

      toast.success('Technische Spezifikationen erfolgreich gespeichert!')
    } catch (error) {
      console.error('Specifications save error:', error)
      toast.error(error instanceof Error ? error.message : 'Technische Spezifikationen konnten nicht gespeichert werden')
    } finally {
      setIsSavingSpecifications(false)
    }
  }


  const openVideoDialog = (video: Video) => {
    setSelectedVideo(video)
    setShowVideoDialog(true)
  }


  // Genel bilgiler için kaydetme fonksiyonu
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingGeneral(true)

    try {
      console.log('FormData:', formData)
      console.log('ProductId:', productId)
      
      const requestBody = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        stock_code: formData.stock_code || null,
        art_nr: formData.art_nr || null,
        hersteller_nr: formData.hersteller_nr || null,
        image_url: formData.image_url || null,
        brand_id: formData.brand_id || null,
        category_id: formData.category_id || null,
        general_technical_specs: formData.general_technical_specs || null,
      }
      
      console.log('Request Body:', requestBody)
      console.log('general_technical_specs value:', formData.general_technical_specs)
      
      // Update main product with additional data
      const productResponse = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!productResponse.ok) {
        const errorText = await productResponse.text()
        console.error('API Error Response Text:', errorText)
        console.error('Response status:', productResponse.status)
        console.error('Response headers:', Object.fromEntries(productResponse.headers.entries()))
        
        let error
        try {
          error = JSON.parse(errorText)
        } catch (e) {
          error = { message: errorText }
        }
        
        // Daha detaylı error mesajı
        let errorMessage = 'Bilinmeyen API hatası'
        if (error.message) {
          errorMessage = error.message
        } else if (error.error) {
          errorMessage = error.error
        } else if (error.details) {
          errorMessage = `Validation hatası: ${JSON.stringify(error.details)}`
        }
        
        throw new Error(errorMessage)
      }

      // Başarılı kayıttan sonra form state'ini güncelle
      const updatedProduct = await productResponse.json()
      console.log('Updated product from API:', updatedProduct)
      console.log('art_nr from API:', updatedProduct.art_nr)
      console.log('hersteller_nr from API:', updatedProduct.hersteller_nr)
      
      // Form state'ini güncelle - sadece gerekli field'ları
      setFormData(prev => {
        console.log('Previous form data:', prev)
        
        const newFormData = {
          ...prev,
          name: updatedProduct.name || prev.name,
          slug: updatedProduct.slug || prev.slug,
          description: updatedProduct.description || prev.description,
          price: updatedProduct.price?.toString() || prev.price,
          discount_price: updatedProduct.discount_price?.toString() || prev.discount_price,
          stock: updatedProduct.stock?.toString() || prev.stock,
          stock_code: updatedProduct.stock_code || prev.stock_code,
          art_nr: updatedProduct.art_nr || prev.art_nr,
          hersteller_nr: updatedProduct.hersteller_nr || prev.hersteller_nr,
          image_url: updatedProduct.image_url || prev.image_url,
          brand_id: updatedProduct.brand_id || prev.brand_id,
          category_id: updatedProduct.category_id || prev.category_id
        }
        console.log('New form data:', newFormData)
        console.log('art_nr in new form:', newFormData.art_nr)
        console.log('hersteller_nr in new form:', newFormData.hersteller_nr)
        return newFormData
      })

      toast.success('Allgemeine Informationen erfolgreich gespeichert!')
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsSavingGeneral(false)
    }
  }

  // Umrechnungsfaktoren speichern Funktion
  const handleSaveConversion = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingConversion(true)

    try {
      // Update conversion factors
      const conversionFactorsResponse = await fetch(`/api/products/${productId}/conversion-factors`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversionFactors),
      })

      if (!conversionFactorsResponse.ok) {
        const error = await conversionFactorsResponse.json()
        throw new Error(`Fehler beim Aktualisieren der Umrechnungsfaktoren: ${error.message}`)
      }

      // Başarılı kayıttan sonra conversion factors state'ini güncelle
      const updatedConversionFactors = await conversionFactorsResponse.json()
      setConversionFactors(updatedConversionFactors)

      toast.success('Umrechnungsfaktoren erfolgreich gespeichert!')
    } catch (error) {
      console.error('Error updating conversion factors:', error)
      toast.error(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsSavingConversion(false)
    }
  }



  if (isProductLoading || isVariantsLoading || isImagesLoading) {
          return <LoadingState message="Produktinformationen werden geladen..." />
  }

  if (productError || !product) {
          return (
        <ErrorState 
          error={productError}
          title="Produkt nicht gefunden"
          backUrl="/admin/products"
          message={productError?.message || 'Produkt wurde nicht gefunden oder es ist ein Fehler beim Laden aufgetreten.'}
        />
      )
  }

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'general', label: 'Allgemeine Informationen', icon: Info },
    { id: 'specifications', label: 'Technische Spezifikationen', icon: Settings },
    { id: 'variants', label: 'Varianten', icon: Package },
    { id: 'images', label: 'Bilder', icon: ImageIcon },
    { id: 'documents', label: 'Dokumente', icon: FileText },
    { id: 'conversion', label: 'Umrechnungsfaktoren', icon: Calculator },
    { id: 'videos', label: 'Videos', icon: Play }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Produkt bearbeiten"
        subtitle={`Produkt "${product.name}" bearbeiten`}
        backUrl="/admin/products"
      />

      {/* Waitlist Status */}
      {waitlistInfo && (
        <WaitlistAlert 
          waitlistInfo={waitlistInfo}
          productId={product.id}
        />
      )}

      {/* Tabs */}
      <TabNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId: string) => setActiveTab(tabId as ActiveTab)}
      />

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        <form className="p-6">
          {/* General Tab */}
                    {activeTab === 'general' && (
            <GeneralTab
              formData={formData}
              brands={brands}
              categories={categories}
              handleInputChange={handleInputChange}
            />
          )}

          {/* Specifications Tab */}
          {activeTab === 'specifications' && (
            <SpecificationsTab
              specifications={specifications}
              handleSpecificationChange={handleSpecificationChange}
              onSave={handleSaveSpecifications}
              isSaving={isSavingSpecifications}
              openDeleteDialog={openSpecificationsDeleteDialog}
            />
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <VariantsTab
              variants={variants}
              setVariants={setVariants}
              productId={productId}
              isSaving={isSavingVariants}
              openDeleteDialog={openVariantsDeleteDialog}
            />
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <ImagesTab
              images={images}
              setImages={setImages}
              refetchImages={refetchImages}
              openDeleteDialog={openImagesDeleteDialog}
            />
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <DocumentsTab
              documents={documents}
              setDocuments={setDocuments}
              openDeleteDialog={openDocumentsDeleteDialog}
            />
          )}


          {/* Conversion Factors Tab */}
          {activeTab === 'conversion' && (
            <ConversionTab
              conversionFactors={conversionFactors}
              setConversionFactors={setConversionFactors}
            />
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <VideosTab
              videos={videos.map(video => ({
                id: video.id,
                title: video.title,
                file: new File([], video.title), // Placeholder file
                description: '',
                previewUrl: video.video_url,
                video_url: video.video_url,
                thumbnail_url: video.thumbnail_url,
                duration: video.duration,
                file_size: video.file_size
              }))}
              setVideos={(newVideos) => {
                // Transform the videos back to the main page's format
                const transformedVideos = newVideos.map(video => ({
                  id: video.id,
                  product_id: productId,
                  title: video.title,
                  video_url: video.previewUrl,
                  thumbnail_url: video.thumbnail_url,
                  duration: video.duration,
                  file_size: video.file_size,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }))
                console.log('Main page: Updating videos state:', transformedVideos)
                setVideos(transformedVideos)
              }}
              openVideoDialog={openVideoDialog}
              openDeleteDialog={openVideosDeleteDialog}
              productId={productId}
            />
          )}

          {/* SEO Settings Tab */}



        </form>
        
        {/* Form Actions - Genel bilgiler için */}
        {activeTab === 'general' && (
          <div className="px-6 pb-6">
            <FormActions 
              isSaving={isSavingGeneral}
              cancelUrl="/admin/products"
              onSubmit={handleSaveGeneral}
            />
          </div>
        )}

        {/* Form Actions - Dönüşüm faktörleri için */}
        {activeTab === 'conversion' && (
          <div className="px-6 pb-6">
            <FormActions 
              isSaving={isSavingConversion}
              cancelUrl="/admin/products"
              onSubmit={handleSaveConversion}
            />
          </div>
        )}
      </div>

      {/* Video Dialog */}
      <VideoDialog 
        isOpen={showVideoDialog}
        video={selectedVideo}
        onClose={() => setShowVideoDialog(false)}
      />

      {/* Specifications Delete Dialog */}
      <ConfirmDialog
        isOpen={specificationsDeleteDialog.isOpen}
        onClose={closeSpecificationsDeleteDialog}
        onConfirm={confirmSpecificationsDelete}
        title="Spezifikation löschen"
        message="Sind Sie sicher, dass Sie diese technische Spezifikation löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Ja, löschen"
        cancelText="Abbrechen"
        variant="danger"
      />

      {/* Variants Delete Dialog */}
      <ConfirmDialog
        isOpen={variantsDeleteDialog.isOpen}
        onClose={closeVariantsDeleteDialog}
        onConfirm={confirmVariantsDelete}
        title="Variante löschen"
        message="Sind Sie sicher, dass Sie diese Variante löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Ja, löschen"
        cancelText="Abbrechen"
        variant="danger"
      />

      {/* Images Delete Dialog */}
      <ConfirmDialog
        isOpen={imagesDeleteDialog.isOpen}
        onClose={closeImagesDeleteDialog}
        onConfirm={confirmImagesDelete}
        title="Bild löschen"
        message="Sind Sie sicher, dass Sie dieses Bild löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Ja, löschen"
        cancelText="Abbrechen"
        variant="danger"
      />

      {/* Documents Delete Dialog */}
      <ConfirmDialog
        isOpen={documentsDeleteDialog.isOpen}
        onClose={closeDocumentsDeleteDialog}
        onConfirm={confirmDocumentsDelete}
        title="Dokument löschen"
        message="Sind Sie sicher, dass Sie dieses Dokument löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Ja, löschen"
        cancelText="Abbrechen"
        variant="danger"
      />

      {/* Videos Delete Dialog */}
      <ConfirmDialog
        isOpen={videosDeleteDialog.isOpen}
        onClose={closeVideosDeleteDialog}
        onConfirm={confirmVideosDelete}
        title="Video löschen"
        message="Sind Sie sicher, dass Sie dieses Video löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Ja, löschen"
        cancelText="Abbrechen"
        variant="danger"
      />

    </div>
  )
}
