import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import BrandsPageContent from './BrandsPageContent'

export default function BrandsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BrandsPageContent />
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 