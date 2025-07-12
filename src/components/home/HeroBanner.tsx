'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useActiveBanners } from '@/hooks/useBanners'

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { data: bannersResponse, isLoading, error, refetch } = useActiveBanners()

  console.log('🏠 HeroBanner render - bannersResponse:', bannersResponse)
  console.log('📊 Is loading:', isLoading, 'Error:', error)

  // Filter banners to only show those with images
  const banners = bannersResponse?.data?.filter(banner => banner.image_url) || []
  
  console.log('🎨 Filtered banners (with images):', banners)
  console.log('📱 Banner count after filtering:', banners.length)

  // Reset current index if it's out of bounds
  useEffect(() => {
    if (banners.length > 0 && currentIndex >= banners.length) {
      console.log('🔄 Resetting currentIndex from', currentIndex, 'to 0')
      setCurrentIndex(0)
    }
  }, [banners.length, currentIndex])

  // Auto-rotate banners every 5 seconds if there are multiple
  useEffect(() => {
    if (banners.length <= 1) {
      console.log('⏸️ Not starting auto-rotation - only', banners.length, 'banner(s)')
      return
    }

    console.log('▶️ Starting auto-rotation for', banners.length, 'banners')
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length
        console.log('🔄 Auto-rotating from', prevIndex, 'to', nextIndex)
        return nextIndex
      })
    }, 5000)

    return () => {
      console.log('⏹️ Clearing auto-rotation interval')
      clearInterval(interval)
    }
  }, [banners.length])

  const nextBanner = () => {
    const nextIndex = (currentIndex + 1) % banners.length
    console.log('➡️ Next button clicked - moving from', currentIndex, 'to', nextIndex)
    setCurrentIndex(nextIndex)
  }

  const prevBanner = () => {
    const nextIndex = (currentIndex - 1 + banners.length) % banners.length
    console.log('⬅️ Previous button clicked - moving from', currentIndex, 'to', nextIndex)
    setCurrentIndex(nextIndex)
  }

  if (isLoading) {
    console.log('⏳ Showing loading skeleton')
    return (
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative h-80 lg:h-96 w-full rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-8 bg-gray-300 rounded w-64 mx-auto"></div>
                <div className="h-6 bg-gray-300 rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    console.error('❌ Error in HeroBanner:', error)
    return (
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative h-80 lg:h-96 w-full rounded-2xl bg-red-50 border border-red-200 overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <h3 className="text-xl font-semibold text-red-800 mb-2">
                Banner Yüklenemedi
              </h3>
              <p className="text-red-600 mb-4">
                Banner bilgileri yüklenirken bir hata oluştu.
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!banners || banners.length === 0) {
    console.log('📭 No banners available - showing empty state')
    return (
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative h-80 lg:h-96 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Bauprodukt'a Hoş Geldiniz</h2>
                <p className="text-xl">Kaliteli yapı malzemeleri için doğru adres</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const currentBanner = banners[currentIndex]
  console.log('🎯 Current banner being displayed:', currentBanner)
  console.log('🖼️ Current banner image URL:', currentBanner?.image_url)

  return (
    <section className="relative py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Container */}
        <div className="relative h-80 lg:h-96 w-full rounded-2xl overflow-hidden">
          {/* Banner Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${currentBanner.image_url})`,
            }}
          >
          </div>

          {/* Banner Content */}
          <div className="relative z-10 h-full flex items-center justify-center text-white">
            <div className="max-w-5xl mx-auto px-6 w-full">
              <div className="text-center">
                <h1 className="text-3xl md:text-5xl font-bold mb-6 drop-shadow-lg">
                  {currentBanner.title}
                </h1>
                {currentBanner.link && (
                  <div className="flex justify-center">
                    <a
                      href={currentBanner.link}
                      className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block shadow-lg"
                    >
                      Detayları Gör
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Arrows - Only show if there are multiple banners */}
          {banners.length > 1 && (
            <>
              <button
                onClick={prevBanner}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors z-20"
                aria-label="Previous banner"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors z-20"
                aria-label="Next banner"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      console.log('🎯 Dot clicked - moving to index', index)
                      setCurrentIndex(index)
                    }}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentIndex 
                        ? 'bg-white'
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
} 