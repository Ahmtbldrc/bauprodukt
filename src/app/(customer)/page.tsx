import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import HeroBanner from '@/components/home/HeroBanner'
import { RecommendedProducts } from '@/components/home/RecommendedProducts'
import { BrandsSection } from '@/components/home/BrandsSection'
import { BestsellerProducts } from '@/components/home/BestsellerProducts'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { DiscountedProducts } from '@/components/home/DiscountedProducts'
import { Newsletter } from '@/components/home/Newsletter'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Banner Section */}
        <HeroBanner />
        
        {/* Senin İçin Seçtiklerimiz */}
        <RecommendedProducts />
        
        {/* Markalar */}
        <BrandsSection />
        
        {/* Topseller */}
        <BestsellerProducts />
        
        {/* Kategoriler */}
        <CategoriesSection />
        
        {/* Kuponlu Ürünler */}
        <DiscountedProducts />
        
        {/* Bülten */}
        <Newsletter />
      </main>
      
      <Footer />
    </div>
  )
}
