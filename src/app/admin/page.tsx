export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Admin panel ana sayfası</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Toplam Ürünler</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">-</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Toplam Markalar</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">-</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Toplam Kategoriler</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">-</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Aktif Bannerlar</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">-</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Son Aktiviteler</h2>
        <p className="text-gray-500">Henüz aktivite bulunmuyor.</p>
      </div>
    </div>
  )
} 