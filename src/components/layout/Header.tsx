import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Bauprodukt
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-gray-900">
              Ürünler
            </Link>
            <Link href="/brands" className="text-gray-700 hover:text-gray-900">
              Markalar
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-gray-900">
              Kategoriler
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <input
                type="search"
                placeholder="Ürün ara..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 