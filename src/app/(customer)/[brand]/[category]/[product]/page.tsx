import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import ProductPageContent from '@/app/(customer)/[brand]/[category]/[product]/ProductPageContent'

interface DynamicProductPageProps {
  params: Promise<{
    brand: string
    category: string
    product: string
  }>
}

export default async function DynamicProductPage({ params }: DynamicProductPageProps) {
  const resolvedParams = await params

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ProductPageContent 
        brandSlug={resolvedParams.brand}
        categorySlug={resolvedParams.category}
        productSlug={resolvedParams.product}
      />
      <Footer />
    </div>
  )
} 