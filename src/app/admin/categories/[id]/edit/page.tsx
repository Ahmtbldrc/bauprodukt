import Link from 'next/link'

interface EditCategoryPageProps {
  params: {
    id: string
  }
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link 
          href={`/admin/categories/${params.id}`}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Geri
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kategori Düzenle</h1>
          <p className="text-gray-600">ID: {params.id}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Kategori düzenleme formu buraya gelecek.</p>
      </div>
    </div>
  )
} 