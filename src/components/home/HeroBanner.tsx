'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const bannerData = [
  {
    id: 1,
    title: "Hochwertige Bauprodukte",
    subtitle: "Die zuverlässigsten Marken zu den besten Preisen",
    ctaText: "Alle Produkte ansehen",
    ctaLink: "/products",
    secondaryCtaText: "Kategorien entdecken",
    secondaryCtaLink: "/categories",
    bgGradient: "linear-gradient(to right, #F39236, #F39236)"
  },
  {
    id: 2,
    title: "Professionelle Baumaterialien",
    subtitle: "Mit unserem Expertenteam bieten wir Ihnen die beste Lösung",
    ctaText: "Expertenberatung",
    ctaLink: "/contact",
    secondaryCtaText: "Produktkatalog",
    secondaryCtaLink: "/products",
    bgGradient: "linear-gradient(to right, #2563eb, #1d4ed8)"
  },
  {
    id: 3,
    title: "Exklusive Rabattangebote",
    subtitle: "Begrenzte Zeit! Bis zu 30% Rabatt auf ausgewählte Produkte",
    ctaText: "Rabatte ansehen",
    ctaLink: "/products?discount=true",
    secondaryCtaText: "Kampagnendetails",
    secondaryCtaLink: "/campaigns",
    bgGradient: "linear-gradient(to right, #dc2626, #b91c1c)"
  }
]

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerData.length)
    }, 5000) // 5 saniyede bir otomatik geçiş

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerData.length)
    setIsAutoPlaying(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerData.length) % bannerData.length)
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
  }

  const currentBanner = bannerData[currentSlide]

  return (
    <section className="relative py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Container */}
        <div 
          className="relative h-80 lg:h-96 w-full rounded-2xl flex items-center justify-center text-white transition-all duration-500 ease-in-out overflow-hidden"
          style={{ background: currentBanner.bgGradient }}
        >
          <div className="max-w-5xl mx-auto px-6 w-full">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {currentBanner.title}
            </h1>
            <p className="text-lg md:text-xl mb-6 text-white/90">
              {currentBanner.subtitle}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={currentBanner.ctaLink}
                className="bg-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-gray-900"
              >
                {currentBanner.ctaText}
              </Link>
              <Link 
                href={currentBanner.secondaryCtaLink}
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors inline-block"
              >
                {currentBanner.secondaryCtaText}
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {bannerData.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      </div>
    </section>
  )
} 