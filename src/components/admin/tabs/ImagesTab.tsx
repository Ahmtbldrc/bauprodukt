'use client'

import { Image as ImageIcon, Plus, Star, Trash2, Upload, GripVertical, X } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'

import { AnimatedList } from '@/components/magicui/animated-list'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ProductImage {
  id?: string
  image_url: string
  is_cover: boolean
  order_index?: number
}

interface ImagesTabProps {
  images: ProductImage[]
  setImages: (images: ProductImage[]) => void
  refetchImages?: () => void
  openDeleteDialog: (index: number) => void
  productId: string
}

// Toast notification item for AnimatedList
function ToastItem({ message, type, onClose }: {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border-l-4 min-w-[320px] max-w-[400px] bg-white/95 backdrop-blur-sm ${
      type === 'success' 
        ? 'border-green-500 text-green-800' 
        : 'border-red-500 text-red-800'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function SortableImageItem({ image, index, onRemove, onSetCover, onImageChange }: {
  image: ProductImage
  index: number
  onRemove: (index: number) => void
  onSetCover: (index: number) => void
  onImageChange: (index: number, imageUrl: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `image-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    if (!image.image_url) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        
        // Create a canvas to resize the image to 120x120
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Set canvas size to 120x120
          canvas.width = 120
          canvas.height = 120
          
          if (ctx) {
            // Draw the resized image maintaining aspect ratio
            ctx.drawImage(img, 0, 0, 120, 120)
            
            // Convert to base64 with consistent quality
            const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.9)
            
            onImageChange(index, resizedImageUrl)
          }
        }
        img.src = result
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative border border-gray-200/60 rounded-xl p-3 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-orange-100/50 hover:border-orange-200/80 hover:bg-white ${
        isDragging ? 'shadow-xl shadow-orange-200/50 scale-105 z-20' : ''
      }`}
    >
      {/* Background gradient overlay - simplified */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/20 via-white/60 to-blue-50/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative z-10">
        <div className="relative mb-3">
          {image.image_url ? (
            <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-200">
              <Image
                src={image.image_url}
                alt={`Ürün resmi ${index + 1}`}
                width={120}
                height={120}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                draggable={false}
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
            </div>
          ) : (
            <div 
              className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300/60 group-hover:border-orange-300/80 transition-all duration-200 cursor-pointer hover:bg-orange-50/30"
              onClick={handleImageClick}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform duration-200">
                  <Upload className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">Klicken Sie, um ein Bild auszuwählen</p>
              </div>
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {/* Drag Handle - optimized */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 bg-gray-800/80 text-white p-1.5 rounded-lg cursor-move hover:bg-gray-700/80 transition-colors duration-150 shadow-lg opacity-0 group-hover:opacity-100"
          >
            <GripVertical className="h-3 w-3" />
          </div>
          
          {/* Cover Badge - simplified */}
          {image.is_cover && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
              <Star className="h-3 w-3 fill-current" />
              Titelbild
            </div>
          )}
          
          {/* Actions - simplified */}
          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {!image.is_cover && (
              <button
                type="button"
                onClick={() => onSetCover(index)}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors duration-150 shadow-lg transform hover:scale-105"
                title="Als Titelbild festlegen"
              >
                <Star className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors duration-150 shadow-lg transform hover:scale-105"
                              title="Bild löschen"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        
        {/* Hidden URL input for functionality - not visible to user */}
        <input
          type="hidden"
          value={image.image_url}
          onChange={() => {}} // Keep for form submission
        />
        
        {/* Cover checkbox - simplified */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <input
              id={`cover_${index}`}
              type="checkbox"
              checked={image.is_cover}
              onChange={(e) => {
                if (e.target.checked) {
                  onSetCover(index)
                }
              }}
              className="sr-only"
            />
            <label 
              htmlFor={`cover_${index}`} 
              className={`flex items-center gap-2.5 cursor-pointer group/checkbox ${
                image.is_cover ? 'text-orange-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 transition-colors duration-150 flex items-center justify-center ${
                image.is_cover 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-gray-300 group-hover/checkbox:border-orange-300'
              }`}>
                {image.is_cover && (
                  <Star className="h-2.5 w-2.5 text-white fill-current" />
                )}
              </div>
                              <span className="text-xs font-medium transition-colors duration-150">
                  Titelbild
                </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ImagesTab({ images, setImages, refetchImages, openDeleteDialog, productId }: ImagesTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State for toast
  
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: 'success' | 'error'
  }>>([])

  const addImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange triggered', e.target.files)
    const file = e.target.files?.[0]
    if (file) {
      try {
        console.log('File selected:', file.name, file.size, file.type)
        console.log('ProductId:', productId)
        
        // Show loading toast
        showToast('Bild wird hochgeladen...', 'success')
        
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('order_index', images.length.toString())
        formData.append('is_cover', (images.length === 0).toString()) // First image becomes cover
        
        console.log('FormData created:', {
          file: file.name,
          order_index: images.length.toString(),
          is_cover: (images.length === 0).toString()
        })
        
        // Upload image to API
        const response = await fetch(`/api/products/${productId}/images`, {
          method: 'POST',
          body: formData,
        })
        
        console.log('API Response status:', response.status)
        console.log('API Response headers:', response.headers)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error response:', errorText)
          const error = await response.json().catch(() => ({ error: 'Failed to parse error' }))
          throw new Error(error.error || 'Failed to upload image')
        }
        
        const result = await response.json()
        console.log('API Success result:', result)
        
        // Update local state with the uploaded image
        if (result.data) {
          setImages([...images, result.data])
          showToast('Bild erfolgreich hochgeladen!', 'success')
        }
        
        // Refresh images from API to ensure consistency
        if (refetchImages) {
          refetchImages()
        }
        
      } catch (error) {
        console.error('Image upload error:', error)
        showToast(`Fehler beim Hochladen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, 'error')
      }
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto remove toast after 4 seconds for better readability
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }



  const removeImage = (index: number) => {
    openDeleteDialog(index)
  }

  const setCoverImage = async (index: number) => {
    try {
      const targetImage = images[index]
      if (!targetImage.id) {
        showToast('Bild-ID nicht gefunden!', 'error')
        return
      }

      // API'ye kapak resmi güncelleme isteği gönder
      const response = await fetch(`/api/products/${productId}/images/${targetImage.id}/cover`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Aktualisieren des Titelbilds')
      }

      const result = await response.json()
      
      // State'i güncellenmiş verilerle güncelle
      if (result.data) {
        setImages(result.data)
      } else {
        // Fallback: Sadece local state'i güncelle
        const newImages = images.map((img, i) => ({
          ...img,
          is_cover: i === index
        }))
        setImages(newImages)
      }
      
      // React Query cache'ini invalidate et ki sayfa yenilendiğinde güncel veriler gelsin
      // Bu sayede veritabanındaki güncel durum frontend'e yansır
      if (refetchImages) {
        refetchImages()
      }
      
      showToast('Titelbild aktualisiert!', 'success')
    } catch (error) {
              console.error('Fehler beim Aktualisieren des Titelbilds:', error)
      showToast(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 'error')
    }
  }

  const handleImageChange = async (index: number, imageUrl: string) => {
    try {
      const newImages = [...images]
      newImages[index] = { ...newImages[index], image_url: imageUrl }
      setImages(newImages)
      
      // If the image has an ID, update it in the API
      if (newImages[index].id) {
        const imagesToUpdate = newImages.map((image, idx) => ({
          image_url: image.image_url,
          is_cover: image.is_cover,
          order_index: idx
        }))
        
        const response = await fetch(`/api/products/${productId}/images`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: imagesToUpdate
          }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update image')
        }
        
        showToast('Bild aktualisiert!', 'success')
        
        // Refresh images from API to ensure consistency
        if (refetchImages) {
          refetchImages()
        }
      } else {
        showToast('Bild aktualisiert!', 'success')
      }
    } catch (error) {
      console.error('Error updating image:', error)
      showToast(`Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, 'error')
      
      // Revert on error
      if (refetchImages) {
        refetchImages()
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().split('-')[1])
      const newIndex = parseInt(over.id.toString().split('-')[1])
      
      try {
        // Update local state immediately for responsive UI
        const newImages = arrayMove(images, oldIndex, newIndex)
        setImages(newImages)
        
        // Prepare images data for API update
        const imagesToUpdate = newImages.map((image, index) => ({
          image_url: image.image_url,
          is_cover: image.is_cover,
          order_index: index
        }))
        
        // Update order in API
        const response = await fetch(`/api/products/${productId}/images`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: imagesToUpdate
          }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update image order')
        }
        
        showToast('Bildreihenfolge aktualisiert!', 'success')
        
        // Refresh images from API to ensure consistency
        if (refetchImages) {
          refetchImages()
        }
        
      } catch (error) {
        console.error('Error updating image order:', error)
        showToast(`Fehler beim Aktualisieren der Reihenfolge: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, 'error')
        
        // Revert to original order on error
        if (refetchImages) {
          refetchImages()
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-6 w-6 text-[#F39236]" />
          <h3 className="text-xl font-semibold text-gray-900">Produktbilder</h3>
        </div>
        <button
          type="button"
          onClick={addImage}
          className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
          style={{backgroundColor: '#F39236'}}
        >
          <Plus className="h-4 w-4" />
                      Bild hinzufügen
        </button>
        {/* Hidden file input for main add button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-900 mb-1">Noch keine Bilder hinzugefügt</p>
            <p className="text-xs">Klicken Sie auf den obigen Button, um ein Bild hinzuzufügen</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((_, index) => `image-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-4">
              {images.map((image, index) => (
                <SortableImageItem
                  key={index}
                  image={image}
                  index={index}
                  onRemove={removeImage}
                  onSetCover={setCoverImage}
                  onImageChange={handleImageChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}



      {/* Toast Notifications using Magic UI AnimatedList */}
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatedList delay={300} className="flex flex-col-reverse items-end gap-3">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatedList>
      </div>
    </div>
  )
}
