import Link from 'next/link'

type PageProps = {
  params: {
    id: string
  }
}

export default function Page({ params }: PageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link 
          href={`/admin/brands/${params.id}`}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Geri
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marka Düzenle</h1>
          <p className="text-gray-600">ID: {params.id}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Marka düzenleme formu buraya gelecek.</p>
      </div>
    </div>
  )
} 