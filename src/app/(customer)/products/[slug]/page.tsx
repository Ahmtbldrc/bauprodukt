import { getProductBySlug } from '@/lib/mock-data'
import { generateProductURLFromObject } from '@/lib/url-utils'
import { redirect, notFound } from 'next/navigation'

type PageProps = {
  params: {
    slug: string
  }
}

export default function Page({ params }: PageProps) {
  const product = getProductBySlug(params.slug)
  
  if (!product) {
    notFound()
  }

  // Redirect to hierarchical URL
  const hierarchicalURL = generateProductURLFromObject(product)
  redirect(hierarchicalURL)
} 