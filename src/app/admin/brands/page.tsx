import Link from 'next/link'

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Markalar</h1>
          <p className="text-gray-600">Marka yönetimi</p>
        </div>
        
        <Link 
          href="/admin/brands/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Yeni Marka Ekle
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <p className="text-gray-500">Henüz marka bulunmuyor.</p>
        </div>
      </div>
    </div>
  )
} 