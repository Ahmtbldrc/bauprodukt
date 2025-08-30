'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Info, Settings, Package, ImageIcon, FileText, Calculator, Play } from 'lucide-react'

import { 
  Variant, 
  ProductImage, 
  VariantResponse, 
  ImageResponse,
  FormData,
  Specifications,
  ConversionFactors,
  Video,
  ProductVideo,
  ActiveTab,
  DocumentImage,
  ProductDocument
} from '@/types/admin/product-edit'
import { useAllBrands } from '@/hooks/useBrands'
import { useAllCategories } from '@/hooks/useCategories'
import PageHeader from '@/components/admin/PageHeader'
import TabNavigation from '@/components/admin/TabNavigation'
import LoadingState from '@/components/admin/LoadingState'
import ErrorState from '@/components/admin/ErrorState'
import FormActions from '@/components/admin/FormActions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import GeneralTab from '@/components/admin/tabs/GeneralTab'
import SpecificationsTab from '@/components/admin/tabs/SpecificationsTab'
import VariantsTab from '@/components/admin/tabs/VariantsTab'
import ImagesTab from '@/components/admin/tabs/ImagesTab'
import DocumentsTab from '@/components/admin/tabs/DocumentsTab'
import ConversionTab from '@/components/admin/tabs/ConversionTab'
import VideosTab from '@/components/admin/tabs/VideosTab'
import VideoDialog from '@/components/admin/VideoDialog'

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// Import TechnicalSpec type for the specifications
type TechnicalSpec = {
  id?: string
  title: string
  description: string
  sort_order: number
}

// Additional types to replace any usage
interface SpecificationsData {
  technical_specs?: TechnicalSpec[]
  general_technical_specs?: TechnicalSpec[]
}

interface WaitlistProductData {
  id?: string
  name: string
  slug: string
  description: string
  price: number
  discount_price?: number
  stock: number
  stock_code?: string
  art_nr?: string
  hersteller_nr?: string
  image_url?: string
  brand_id?: string
  category_id?: string
  specifications_data?: Record<string, unknown>
  general_technical_specs?: TechnicalSpec[]
}

interface WaitlistEntry {
  id: string
  product_slug: string
  product_id?: string
  payload_json: WaitlistProductData
  diff_summary?: Record<string, unknown>
  created_at: string
  updated_at?: string
  created_by: string
  version: number
  reason: string
  is_valid: boolean
  validation_errors: string[]
  requires_manual_review: boolean
  price_drop_percentage?: number
  has_invalid_discount: boolean
  current_product?: WaitlistProductData
}

export default function WaitlistProductDetailPage() {
  const params = useParams()
  const entryId = params.id as string

  const [entry, setEntry] = useState<WaitlistEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
    allow_manual_stock_edit: false,
    technical_specs: [],
    general_technical_specs: []
  })

  const [variants, setVariants] = useState<Variant[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('general')
  const [isSavingGeneral, setIsSavingGeneral] = useState(false)
  const [isSavingConversion, setIsSavingConversion] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)

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
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  // Dialog states
  const [specificationsDeleteDialog, setSpecificationsDeleteDialog] = useState<{
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

  // Load waitlist entry function
  const loadWaitlistEntry = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log('Loading waitlist entry:', entryId)
      const response = await fetch(`/api/waitlist/${entryId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch waitlist entry')
      }

      const result = await response.json()
      const entryData = result.data
      console.log('Loaded entry data:', entryData)
      setEntry(entryData)

      // Populate form with product data from payload_json
      if (entryData.payload_json) {
        const productData = entryData.payload_json
        console.log('Setting form data from payload:', productData)
        console.log('General technical specs:', productData.general_technical_specs)
        setFormData({
          name: productData.name || '',
          slug: productData.slug || '',
          description: productData.description || '',
          price: productData.price?.toString() || '',
          discount_price: productData.discount_price?.toString() || '',
          stock: productData.stock?.toString() || '',
          stock_code: productData.stock_code || '',
          art_nr: productData.art_nr || '',
          hersteller_nr: productData.hersteller_nr || '',
          image_url: productData.image_url || '',
          brand_id: productData.brand_id || '',
          category_id: productData.category_id || '',
          allow_manual_stock_edit: (productData as any).allow_manual_stock_edit ?? false,
          technical_specs: [],
          general_technical_specs: Array.isArray(productData.general_technical_specs) ? productData.general_technical_specs : []
        })

        // Load specifications if available
        if (productData.specifications_data && typeof productData.specifications_data === 'object') {
          const specs = productData.specifications_data as SpecificationsData
          console.log('Setting specifications from payload:', specs)
          setSpecifications({
            technical_specs: Array.isArray(specs.technical_specs) ? specs.technical_specs : [],
            general_technical_specs: Array.isArray(specs.general_technical_specs) ? specs.general_technical_specs : []
          })
        }
      }

      // If this is an existing product, load its data
      if (entryData.product_id) {
        // Load variants
        try {
          const variantsResponse = await fetch(`/api/products/${entryData.product_id}/variants`)
          if (variantsResponse.ok) {
            const variantsData = await variantsResponse.json()
            if (variantsData.variants) {
              const loadedVariants: Variant[] = variantsData.variants.map((variant: VariantResponse) => ({
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
              setVariants(loadedVariants)
            }
          }
        } catch {
          console.log('No variants found')
        }

        // Load images
        try {
          const imagesResponse = await fetch(`/api/products/${entryData.product_id}/images`)
          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json()
            if (imagesData.data) {
              const loadedImages: ProductImage[] = imagesData.data.map((image: ImageResponse) => ({
                id: image.id,
                image_url: image.image_url || '',
                is_cover: image.is_cover || false
              }))
              setImages(loadedImages)
            }
          }
        } catch {
          console.log('No images found')
        }

        // Load documents
        try {
          const documentsResponse = await fetch(`/api/products/${entryData.product_id}/documents`)
          if (documentsResponse.ok) {
            const documentsData = await documentsResponse.json()
            const convertedDocuments = (documentsData.data || []).map((doc: ProductDocument) => ({
              id: doc.id,
              file: new File([], doc.title),
              previewUrl: doc.file_url,
              name: doc.title,
              file_url: doc.file_url,
              file_type: doc.file_type,
              file_size: doc.file_size
            }))
            setDocuments(convertedDocuments)
          }
        } catch {
          console.log('No documents found')
        }

        // Load videos
        try {
          const videosResponse = await fetch(`/api/products/${entryData.product_id}/videos`)
          if (videosResponse.ok) {
            const videosData = await videosResponse.json()
            setVideos(videosData.data || [])
          }
        } catch {
          console.log('No videos found')
        }

        // Load conversion factors
        try {
          const conversionResponse = await fetch(`/api/products/${entryData.product_id}/conversion-factors`)
          if (conversionResponse.ok) {
            const conversionData = await conversionResponse.json()
            setConversionFactors(conversionData)
          }
        } catch {
          console.log('No conversion factors found')
        }
      }

    } catch (err) {
      console.error('Error loading waitlist entry:', err)
      setError(err instanceof Error ? err.message : 'Failed to load waitlist entry')
    } finally {
      setIsLoading(false)
    }
  }, [entryId])

  // Load waitlist entry
  useEffect(() => {
    if (entryId) {
      loadWaitlistEntry()
    }
  }, [entryId, loadWaitlistEntry])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    const { name } = target
    const value = (target as HTMLInputElement).type === 'checkbox'
      ? (target as HTMLInputElement).checked
      : target.value
    setFormData(prev => ({
      ...prev,
      [name]: value as any
    }))
  }

  // Debounced auto-save function for specifications
  const debouncedAutoSave = useCallback(
    (field: string, value: string | TechnicalSpec[]) => debounce(async () => {
      try {
        setIsAutoSaving(true)
        console.log('Debounced auto-saving specifications:', { field, value })
        const specificationsData = {
          technical_specs: field === 'technical_specs' ? value : specifications.technical_specs
        }

        const updatedPayload = {
          ...entry?.payload_json,
          specifications_data: specificationsData
        }

        console.log('Debounced auto-saving payload for specifications:', updatedPayload)

        const response = await fetch(`/api/waitlist/${entryId}/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payload_json: updatedPayload
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to auto-save specifications')
        }

        const responseData = await response.json()
        console.log('Debounced auto-save response:', responseData)
        
        // Show success toast for auto-save
        toast.success('Automatisch gespeichert!')
        
      } catch (error) {
        console.error('Debounced auto-save specifications error:', error)
        toast.error('Automatisches Speichern fehlgeschlagen')
      } finally {
        setIsAutoSaving(false)
      }
    }, 1000), // 1 second delay
    [entry?.payload_json, specifications, entryId]
  )

  const handleSpecificationChange = async (field: string, value: string | TechnicalSpec[]) => {
    // Update local state first
    setSpecifications(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Trigger debounced auto-save
    debouncedAutoSave(field, value)
  }

  

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingGeneral(true)

    try {
      console.log('Saving general data:', formData)
      // Update the waitlist entry payload with new data
      const updatedPayload = {
        ...entry?.payload_json,
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
        allow_manual_stock_edit: formData.allow_manual_stock_edit ?? false,
      }

      console.log('Updated payload:', updatedPayload)

      const response = await fetch(`/api/waitlist/${entryId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload_json: updatedPayload
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update waitlist entry`)
      }

      const responseData = await response.json()
      console.log('Save response:', responseData)

      toast.success('Allgemeine Informationen erfolgreich gespeichert!')
      
      // Reload data from API to ensure UI is in sync
      await loadWaitlistEntry()
    } catch (error) {
      console.error('Error updating waitlist entry:', error)
      toast.error(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsSavingGeneral(false)
    }
  }

  const handleSaveConversion = async () => {
    setIsSavingConversion(true)
    try {
      // For waitlist entries, conversion factors would be saved when the product is approved
      toast.success('Umrechnungsfaktoren werden beim Genehmigen gespeichert!')
    } catch (error) {
      console.error('Error saving conversion factors:', error)
      toast.error('Fehler beim Speichern der Umrechnungsfaktoren')
    } finally {
      setIsSavingConversion(false)
    }
  }

  const openVideoDialog = (video: Video) => {
    setSelectedVideo(video)
    setShowVideoDialog(true)
  }

  // Dialog management functions
  const openSpecificationsDeleteDialog = (index: number) => {
    setSpecificationsDeleteDialog({ isOpen: true, index })
  }

  const closeSpecificationsDeleteDialog = () => {
    setSpecificationsDeleteDialog({ isOpen: false, index: null })
  }

  const confirmSpecificationsDelete = async () => {
    if (specificationsDeleteDialog.index === null) return
    
    try {
      const newSpecs = specifications.technical_specs.filter((_, i) => i !== specificationsDeleteDialog.index)
      
      // This will trigger automatic saving
      await handleSpecificationChange('technical_specs', newSpecs)
      
      closeSpecificationsDeleteDialog()
      toast.success('Spezifikation erfolgreich gelöscht!')
      
    } catch (error) {
      console.error('Error deleting specification:', error)
      toast.error('Fehler beim Löschen der Spezifikation')
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
      const newImages = images.filter((_, i) => i !== imagesDeleteDialog.index)
      setImages(newImages)
      
      closeImagesDeleteDialog()
      toast.success('Bild erfolgreich gelöscht!')
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
      const newVideos = videos.filter((_, i) => i !== videosDeleteDialog.index)
      setVideos(newVideos)
      
      closeVideosDeleteDialog()
      toast.success('Video erfolgreich gelöscht!')
    } catch (error) {
      console.error('Error deleting video:', error)
      toast.error('Fehler beim Löschen des Videos')
    }
  }

  if (isLoading) {
    return <LoadingState message="Warteliste-Eintrag wird geladen..." />
  }

  if (error || !entry) {
    return (
      <ErrorState 
        error={{ message: error || 'Entry not found', name: 'WaitlistError' }}
        title="Warteliste-Eintrag nicht gefunden"
        backUrl="/admin/waitlist"
        message={error || 'Warteliste-Eintrag wurde nicht gefunden oder es ist ein Fehler beim Laden aufgetreten.'}
      />
    )
  }

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'general', label: 'Allgemeine Informationen', icon: Info },
    { id: 'specifications', label: 'Technische Details', icon: Settings },
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
        title="Warteliste-Produkt bearbeiten"
        subtitle={`${entry.product_id ? 'Produkt-Update' : 'Neues Produkt'} - "${entry.payload_json?.name || entry.product_slug}"`}
        backUrl="/admin/waitlist"
      />

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
              openDeleteDialog={openSpecificationsDeleteDialog}
              isAutoSaving={isAutoSaving}
            />
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <VariantsTab
              variants={variants}
              setVariants={setVariants}
              productId={entry.product_id || ''}
              isSaving={false}
            />
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <ImagesTab
              images={images}
              setImages={setImages}
              refetchImages={() => {}}
              openDeleteDialog={openImagesDeleteDialog}
              productId={entry.product_id || ''}
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
                file: new File([], video.title),
                description: '',
                previewUrl: video.video_url,
                video_url: video.video_url,
                thumbnail_url: video.thumbnail_url,
                duration: video.duration,
                file_size: video.file_size
              }))}
              setVideos={(newVideos) => {
                const transformedVideos = newVideos.map((video: { id: string; title: string; previewUrl: string; thumbnail_url?: string; duration?: number; file_size?: number }) => ({
                  id: video.id,
                  product_id: entry.product_id || '',
                  title: video.title,
                  video_url: video.previewUrl,
                  thumbnail_url: video.thumbnail_url,
                  duration: video.duration,
                  file_size: video.file_size,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }))
                setVideos(transformedVideos)
              }}
              openVideoDialog={openVideoDialog}
              openDeleteDialog={openVideosDeleteDialog}
              productId={entry.product_id || ''}
            />
          )}
        </form>
        
        {/* Form Actions - General tab */}
        {activeTab === 'general' && (
          <div className="px-6 pb-6">
            <FormActions 
              isSaving={isSavingGeneral}
              cancelUrl="/admin/waitlist"
              onSubmit={handleSaveGeneral}
            />
          </div>
        )}

        {/* Form Actions - Conversion factors tab */}
        {activeTab === 'conversion' && (
          <div className="px-6 pb-6">
            <FormActions 
              isSaving={isSavingConversion}
              cancelUrl="/admin/waitlist"
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

      {/* Delete Dialogs */}
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