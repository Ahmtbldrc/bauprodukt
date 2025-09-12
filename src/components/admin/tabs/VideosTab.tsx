'use client'

import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  openDeleteDialog: (index: number) => void
  productId: string
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

export default function VideosTab({ videos, setVideos, openDeleteDialog, productId }: VideosTabProps) {
  const [toast, setToast] = useState<{
    isVisible: boolean
    message: string
    type: 'success' | 'error'
  }>({ isVisible: false, message: '', type: 'success' })
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Function to refresh videos from API
  const refreshVideos = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/videos`)
      if (response.ok) {
        const data = await response.json()
        const refreshedVideos = (data.data || []).map((video: { id: string; title: string; video_url?: string; thumbnail_url?: string; duration?: number; file_size?: number }) => ({
          id: video.id,
          title: video.title,
          file: null,
          description: '',
          previewUrl: video.video_url,
          video_url: video.video_url,
          thumbnail_url: video.thumbnail_url,
          duration: video.duration,
          file_size: video.file_size
        }))
        console.log('Refreshing videos from API:', refreshedVideos)
        setVideos(refreshedVideos)
      }
    } catch (error) {
      console.error('Error refreshing videos:', error)
    }
  }

  // Debug: Log videos state changes
  useEffect(() => {
    console.log('Videos state changed:', videos)
  }, [videos])

  const isYouTubeUrl = (url: string) => {
    try {
      const u = new URL(url)
      return (
        (u.hostname.includes('youtube.com') && !!u.searchParams.get('v')) ||
        u.hostname.includes('youtu.be')
      )
    } catch {
      return false
    }
  }

  const getYouTubeId = (url: string): string | null => {
    try {
      const u = new URL(url)
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.replace('/', '') || null
      }
      if (u.hostname.includes('youtube.com')) {
        return u.searchParams.get('v')
      }
      return null
    } catch {
      return null
    }
  }

  const handleAddYouTube = async () => {
    setIsAdding(true)
    if (!productId) {
      showToast('Produkt-ID fehlt. Speichern nicht möglich.', 'error')
      setIsAdding(false)
      return
    }
    if (!newTitle.trim() || !newUrl.trim()) {
      showToast('Titel und YouTube-Link erforderlich.', 'error')
      setIsAdding(false)
      return
    }
    if (!isYouTubeUrl(newUrl)) {
      showToast('Bitte einen gültigen YouTube-Link eingeben.', 'error')
      setIsAdding(false)
      return
    }
    const videoId = getYouTubeId(newUrl)
    if (!videoId) {
      showToast('YouTube-Video-ID konnte nicht ermittelt werden.', 'error')
      return
    }
    try {
      const response = await fetch(`/api/products/${productId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        })
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Fehler beim Speichern des YouTube-Videos')
      }
      showToast('YouTube-Video hinzugefügt!', 'success')
      setNewTitle('')
      setNewUrl('')
      await refreshVideos()
    } catch (err) {
      console.error(err)
      showToast('YouTube-Video konnte nicht gespeichert werden.', 'error')
    }
    setIsAdding(false)
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isVisible: true, message, type })
    setTimeout(() => {
      setToast({ isVisible: false, message: '', type: 'success' })
    }, 4000)
  }

  // Remove local dialog management functions since they're no longer needed

  const removeVideo = (index: number) => {
    // Use the parent's openDeleteDialog function instead of local state
    openDeleteDialog(index)
  }

  const handleDragEnd = async (event: any) => {
    try {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = videos.findIndex(v => v.id === active.id)
      const newIndex = videos.findIndex(v => v.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const prev = videos
      const reordered = arrayMove(videos, oldIndex, newIndex)
      setVideos(reordered)

      if (!productId) return
      const response = await fetch(`/api/products/${productId}/videos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: reordered.map(v => v.id) })
      })
      if (!response.ok) {
        setVideos(prev)
        showToast('Sıralama kaydedilemedi.', 'error')
      } else {
        showToast('Sortierung aktualisiert.', 'success')
      }
    } catch (e) {
      console.error(e)
      showToast('Sıralama sırasında bir hata oluştu.', 'error')
    }
  }

  function SortableVideoCard({ video, index }: { video: Video; index: number }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: video.id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition
    } as React.CSSProperties
    const vid = getYouTubeId(video.previewUrl || video.video_url || '')
    const embedUrl = vid ? `https://www.youtube.com/embed/${vid}` : ''
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="aspect-video bg-gray-100 cursor-move">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeVideo(index)}
          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
          title="Video löschen"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Play className="h-6 w-6 text-[#F39236]" />
        <h3 className="text-xl font-semibold text-gray-900">Produktvideos</h3>
        <div className="ml-auto text-sm text-gray-500">
          {videos.length} video{videos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* YouTube Link Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
              style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
              placeholder="z.B. Produktdemo"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">YouTube-Link</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent transition-all duration-200"
              style={{'--tw-ring-color': '#F39236'} as React.CSSProperties}
              placeholder="https://www.youtube.com/watch?v=... oder https://youtu.be/..."
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddYouTube() }}
            disabled={isAdding || !productId}
            className="px-6 py-3 bg-[#F39236] text-white rounded-md hover:bg-[#E67E22] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAdding ? 'Wird gespeichert...' : 'YouTube-Video hinzufügen'}
          </button>
        </div>
        {!productId && (
          <p className="text-xs text-gray-500 mt-2">Hinweis: Zum Speichern wird eine gültige Produkt-ID benötigt.</p>
        )}
      </div>

      {/* Videos Grid with Drag-and-Drop */}
      <div className="w-full">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={videos.map(v => v.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video, index) => (
                <SortableVideoCard key={video.id} video={video} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Remove the local ConfirmDialog since it's now managed by parent */}

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
