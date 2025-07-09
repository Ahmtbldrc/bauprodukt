import Link from 'next/link'

export default function CreateCategoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link 
          href="/admin/categories"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Geri
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yeni Kategori Ekle</h1>
          <p className="text-gray-600">Yeni kategori oluştur</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Kategori oluşturma formu buraya gelecek.</p>
      </div>
    </div>
  )
} 