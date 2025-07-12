import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CategoryPageContent } from './CategoryPageContent'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <CategoryPageContent slug={slug} />
      </main>
      <Footer />
    </div>
  )
} 

 