'use client'

import { Play } from 'lucide-react'

interface Video {
  id: string
  title: string
  file: File | null
  description: string
  previewUrl: string
}

interface VideoDialogProps {
  isOpen: boolean
  video: Video | null
  onClose: () => void
}

export default function VideoDialog({ isOpen, video, onClose }: VideoDialogProps) {
  if (!isOpen || !video) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-md bg-gray-900/20 transition-all duration-300 opacity-100"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 transform opacity-100 scale-100 translate-y-0 border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <Play className="h-6 w-6" style={{color: '#F39236'}} />
          <h2 className="text-xl font-semibold text-gray-900">
            {video.title}
          </h2>
        </div>
        
        {/* Video Player */}
        <div className="mb-6">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <video
              controls
              className="w-full h-full"
              autoPlay
            >
              <source src={video.previewUrl} type="video/mp4" />
              <source src={video.previewUrl} type="video/webm" />
              <source src={video.previewUrl} type="video/ogg" />
              Ihr Browser unterstützt keine Videowiedergabe.
            </video>
          </div>
        </div>
        
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#F39236] text-white font-medium rounded-lg hover:bg-[#E67E22] transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}
