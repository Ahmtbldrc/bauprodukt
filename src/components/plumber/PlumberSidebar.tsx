'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calculator, History, HomeIcon } from 'lucide-react'

export function PlumberSidebar() {
  const pathname = usePathname()

  const menuItems = [
    { name: 'Übersicht', href: '/plumber', icon: <HomeIcon className="w-5 h-5" strokeWidth={1.5} />, current: pathname === '/plumber' },
    { name: 'Hesaplama A', href: '/plumber/calculator-a', icon: <Calculator className="w-5 h-5" strokeWidth={1.5} />, current: pathname.startsWith('/plumber/calculator-a') },
    { name: 'Hesaplama B', href: '/plumber/calculator-b', icon: <Calculator className="w-5 h-5" strokeWidth={1.5} />, current: pathname.startsWith('/plumber/calculator-b') },
    { name: 'Geçmiş', href: '/plumber/history', icon: <History className="w-5 h-5" strokeWidth={1.5} />, current: pathname.startsWith('/plumber/history') },
  ]

  return (
    <aside className="w-16 min-h-screen flex flex-col">
      <div className="h-20"></div>
      <nav className="flex-1 pt-12">
        <div className="space-y-1 pl-8 pr-4">
          {menuItems.map((item) => (
            <div key={item.name} className="relative group">
              <Link
                href={item.href}
                className={`
                  relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200
                  ${item.current ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-md shadow-sm'}
                `}
              >
                {item.icon}
              </Link>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-6 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                {item.name}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
}


