'use client'

import { useState } from 'react'
import { Play, Upload, Loader2, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { validateFile } from '@/lib/upload'

interface Video {
  id: string
  title: string
  file: File | null
  description: string
  previewUrl: string
  video_url?: string
  thumbnail_url?: string
  duration?: number
  file_size?: number
}

interface VideosTabProps {
  videos: Video[]
  setVideos: (videos: Video[]) => void
  openVideoDialog: (video: Video) => void
}

// Simple Toast Component for VideosTab
function Toast({ message, type, isVisible, onClose }: {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
  onClose: () => void
}) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-2">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 min-w-[300px] ${
        type === 'success' 
          ? 'bg-green-50 border-green-500 text-green-800' 
          : 'bg-red-50 border-red-500 text-red-800'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function VideosTab({ videos, setVideos, openVideoDialog }: VideosTabProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  
  // State for dialog and toast
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    index: number | null
  }>({ isOpen: false, index: null })
  
  const [toast, setToast] = useState<{
    isVisible: boolean
    message: string
    type: 'success' | 'error'
  }>({ isVisible: false, message: '', type: 'success' })

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
    const videoFiles = files.filter(file => 
      file.type.startsWith('video/') || 
      file.name.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)
    )
    
    if (videoFiles.length > 0) {
      videoFiles.forEach(file => handleVideoFileUpload(file))
    } else {
      showToast('Lütfen geçerli bir video dosyası sürükleyin', 'error')
    }
  }

  const handleVideoFileUpload = async (file: File) => {
    setUploadingVideo(true)
    try {
      // Validate file before upload
      const validation = validateFile(file, 500 * 1024 * 1024, ['video/mp4', 'video/webm', 'video/avi', 'video/mov'])
      if (!validation.valid) {
        throw new Error(validation.error || 'File validation failed')
      }

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file_0', file)
      formData.append('title_0', file.name.replace(/\.[^/.]+$/, ''))
      
      // Upload to API
      const response = await fetch(`/api/products/${window.location.pathname.split('/')[3]}/videos/bulk`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      const result = await response.json()
      
      // Create new video entry from uploaded data
      const newVideo: Video = {
        id: result.data[0].id,
        title: result.data[0].title,
        file: file,
        description: '',
        previewUrl: result.data[0].video_url || URL.createObjectURL(file),
        video_url: result.data[0].video_url,
        thumbnail_url: result.data[0].thumbnail_url,
        duration: result.data[0].duration,
        file_size: result.data[0].file_size
      }
      
      setVideos([...videos, newVideo])
      showToast('Video başarıyla yüklendi!', 'success')
    } catch (error) {
      console.error('Video upload error:', error)
      showToast(`Video yüklenirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 'error')
    } finally {
      setUploadingVideo(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isVisible: true, message, type })
    setTimeout(() => {
      setToast({ isVisible: false, message: '', type: 'success' })
    }, 4000)
  }

  const openDeleteDialog = (index: number) => {
    setDeleteDialog({ isOpen: true, index })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, index: null })
  }

  const confirmDelete = () => {
    if (deleteDialog.index !== null) {
      const index = deleteDialog.index
      setVideos(videos.filter((_, i) => i !== index))
      closeDeleteDialog()
      showToast('Video başarıyla silindi!', 'success')
    }
  }

  const removeVideo = (index: number) => {
    openDeleteDialog(index)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Play className="h-6 w-6 text-[#F39236]" />
        <h3 className="text-xl font-semibold text-gray-900">Ürün Videoları</h3>
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
        {uploadingVideo ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#F39236] text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </div>
            <h4 className="text-lg font-medium text-gray-900">Video yükleniyor...</h4>
          </div>
        ) : videos.length === 0 ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                <Play className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Video dosyalarını buraya sürükleyin
              </h4>
              <p className="text-gray-600 mb-4">
                MP4, AVI, MOV, WMV, FLV, WebM, MKV formatlarını destekler
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-sm text-gray-500">
                  veya
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      files.forEach(file => handleVideoFileUpload(file))
                    }}
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-[#F39236] text-white rounded-lg hover:bg-[#E67E22] transition-colors">
                    Dosya Seç
                  </span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {/* Uploaded Videos Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {videos.map((video, index) => (
                <div key={index} className="relative group">
                  {/* Video Preview Card */}
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-[#F39236] transition-colors cursor-pointer" onClick={() => openVideoDialog(video)}>
                    {video.file || video.previewUrl ? (
                      <div className="relative w-full h-full">
                        <video
                          className="w-full h-full object-cover"
                          poster={video.previewUrl}
                          muted
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                        >
                          <source src={video.previewUrl} type="video/mp4" />
                          <source src={video.previewUrl} type="video/webm" />
                          <source src={video.previewUrl} type="video/ogg" />
                        </video>
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <Play className="h-4 w-4 text-[#F39236]" />
                          </div>
                        </div>
                        
                        {/* Video Title */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                          <p className="text-xs font-medium text-white truncate">{video.title}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Videoyu sil"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            {/* Daha Fazla Video Ekle Butonu */}
            <div className="mt-4 flex justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    files.forEach(file => handleVideoFileUpload(file))
                  }}
                  className="hidden"
                />
                <span className="px-6 py-3 bg-[#F39236] text-white rounded-lg hover:bg-[#E67E22] transition-colors flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Daha Fazla Video Ekle
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title="Videoyu Sil"
        message="Bu videoyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="İptal"
        variant="danger"
      />

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ isVisible: false, message: '', type: 'success' })}
      />
    </div>
  )
}
