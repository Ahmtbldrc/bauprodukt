import Link from 'next/link'

interface CategoryDetailPageProps {
  params: {
    id: string
  }
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/categories"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Geri
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kategori Detayı</h1>
            <p className="text-gray-600">ID: {params.id}</p>
          </div>
        </div>
        
        <Link 
          href={`/admin/categories/${params.id}/edit`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Düzenle
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Kategori detay bilgileri buraya gelecek.</p>
      </div>
    </div>
  )
} 