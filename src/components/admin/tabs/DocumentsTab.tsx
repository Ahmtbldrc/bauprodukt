'use client'

import { useState } from 'react'
import { FileText, Upload, Trash2, Image as ImageIcon } from 'lucide-react'
import { validateFile } from '@/lib/upload'

interface DocumentImage {
  id: string
  file: File
  previewUrl: string
  name: string
  file_url?: string
  file_type?: string
  file_size?: number
}



interface DocumentsTabProps {
  documents: DocumentImage[]
  setDocuments: (documents: DocumentImage[]) => void
  openDeleteDialog: (index: number) => void
}

export default function DocumentsTab({ documents, setDocuments, openDeleteDialog }: DocumentsTabProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
    )
    
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => handleImageUpload(file))
    } else {
      alert('Bitte ziehen Sie eine gültige Bilddatei hierher')
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      // Validate file before upload
      const validation = validateFile(file, 100 * 1024 * 1024, ['application/pdf', 'image/*'])
      if (!validation.valid) {
        throw new Error(validation.error || 'File validation failed')
      }

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file_0', file)
      formData.append('title_0', file.name.replace(/\.[^/.]+$/, ''))
      
      // Upload to API
      const response = await fetch(`/api/products/${window.location.pathname.split('/')[3]}/documents/bulk`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      const result = await response.json()
      
      // Create new image entry from uploaded data
      const newImage: DocumentImage = {
        id: result.data[0].id,
        file: file,
        previewUrl: result.data[0].file_url,
        name: result.data[0].title
      }
      
      setDocuments([...documents, newImage])
    } catch (error) {
      console.error('Image upload error:', error)
      alert(`Fehler beim Hochladen des Bildes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (index: number) => {
    // Use the parent's openDeleteDialog function instead of local state
    openDeleteDialog(index)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-[#F39236]" />
          <h3 className="text-xl font-semibold text-gray-900">Produktdokumente</h3>
        </div>
        {documents.length > 0 && (
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
            {documents.length} Bilder hochgeladen
          </div>
        )}
      </div>

      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-16 text-center transition-all duration-200 min-h-[400px] flex items-center justify-center ${
          isDragOver 
            ? 'border-[#F39236] bg-[#FFF0E2]' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadingImage ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#F39236] text-white">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <h4 className="text-lg font-medium text-gray-900">Bild wird hochgeladen...</h4>
          </div>
        ) : documents.length === 0 ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Bilddateien hierher ziehen
              </h4>
              <p className="text-gray-600 mb-4">
                Unterstützt JPG, PNG, GIF, BMP, WebP, SVG Formate
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-sm text-gray-500">
                  oder
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      files.forEach(file => handleImageUpload(file))
                    }}
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-[#F39236] text-white rounded-lg hover:bg-[#E67E22] transition-colors">
                    Bild auswählen
                  </span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {/* Uploaded Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
              {documents.map((image, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 hover:border-[#F39236] transition-colors overflow-hidden">
                  {/* Image Preview */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={image.previewUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Image Info */}
                  <div className="p-2">
                    <h5 className="font-medium text-gray-900 truncate text-sm mb-1">{image.name}</h5>
                    <div className="space-y-0.5 text-xs text-gray-600">
                      <p>{image.file_size ? (image.file_size / 1024 / 1024).toFixed(1) : 'Bilinmiyor'} MB</p>
                      <p>{image.file_type ? image.file_type.toUpperCase() : 'Bilinmiyor'}</p>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="mt-2 w-full px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded text-xs transition-colors border border-red-200 hover:border-red-300"
                      title="Bild löschen"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Weitere Bilder hinzufügen Butonu */}
            <div className="mt-4 flex justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    files.forEach(file => handleImageUpload(file))
                  }}
                  className="hidden"
                />
                <span className="px-6 py-3 bg-[#F39236] text-white rounded-lg hover:bg-[#E67E22] transition-colors flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Weitere Bilder hinzufügen
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
