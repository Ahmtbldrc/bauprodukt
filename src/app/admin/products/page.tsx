import Link from 'next/link'

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-gray-600">Ürün yönetimi</p>
        </div>
        
        <Link 
          href="/admin"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Yeni Ürün Ekle
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <p className="text-gray-500">Henüz ürün bulunmuyor.</p>
        </div>
      </div>
    </div>
  )
} 