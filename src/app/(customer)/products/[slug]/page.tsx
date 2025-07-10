import { getProductBySlug } from '@/lib/mock-data'
import { generateProductURLFromObject } from '@/lib/url-utils'
import { redirect, notFound } from 'next/navigation'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug)
  
  if (!product) {
    notFound()
  }

  // Redirect to hierarchical URL
  const hierarchicalURL = generateProductURLFromObject(product)
  redirect(hierarchicalURL)
} 