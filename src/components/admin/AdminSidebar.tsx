import Link from 'next/link'

export function AdminSidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>
      
      <nav className="space-y-2">
        <Link 
          href="/admin" 
          className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Dashboard
        </Link>
        
        <Link 
          href="/admin/products" 
          className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Ürünler
        </Link>
        
        <Link 
          href="/admin/brands" 
          className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Markalar
        </Link>
        
        <Link 
          href="/admin/categories" 
          className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Kategoriler
        </Link>
        
        <Link 
          href="/admin/banners" 
          className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Bannerlar
        </Link>
        
        <Link 
          href="/admin/images" 
          className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Resim Galerisi
        </Link>
      </nav>
    </aside>
  )
} 