'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Tags, 
  FolderTree, 
  Package, 
  ShoppingCart, 
  Users, 
  Home, 
  Image as ImageIcon, 
  Star, 
  MessageCircle, 
  BarChart3, 
  Mail 
} from 'lucide-react'

export function AdminSidebar() {
  const pathname = usePathname()
  
  const menuItems = [
    { 
      name: 'Dashboard', 
      href: '/admin', 
      icon: <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname === '/admin'
    },
    { 
      name: 'Brands', 
      href: '/admin/brands', 
      icon: <Tags className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/brands')
    },
    { 
      name: 'Categories', 
      href: '/admin/categories', 
      icon: <FolderTree className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/categories')
    },
    { 
      name: 'Products', 
      href: '/admin/products', 
      icon: <Package className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/products')
    },
    { 
      name: 'Orders', 
      href: '/admin/orders', 
      icon: <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/orders')
    },
    { 
      name: 'Users', 
      href: '/admin/users', 
      icon: <Users className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/users')
    },
    { 
      name: 'Home Sections', 
      href: '/admin/home-sections', 
      icon: <Home className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/home-sections')
    },
    { 
      name: 'Banners', 
      href: '/admin/banners', 
      icon: <ImageIcon className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/banners')
    },
    { 
      name: 'Featured Brands', 
      href: '/admin/featured-brands', 
      icon: <Star className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/featured-brands')
    },
    { 
      name: 'Messages', 
      href: '/admin/messages', 
      icon: <MessageCircle className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/messages'),
      hasNotification: true
    },
    { 
      name: 'Analytics', 
      href: '/admin/analytics', 
      icon: <BarChart3 className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/analytics')
    },
    { 
      name: 'Mail', 
      href: '/admin/mail', 
      icon: <Mail className="w-5 h-5" strokeWidth={1.5} />,
      current: pathname.startsWith('/admin/mail')
    }
  ]

  return (
    <aside className="w-16 min-h-screen flex flex-col">
      {/* Header space to align with navbar */}
      <div className="h-20"></div>
      
      {/* Navigation */}
      <nav className="flex-1 pt-12">
        <div className="space-y-1 pl-8 pr-4">
          {menuItems.map((item) => (
            <div key={item.name} className="relative group">
              <Link 
                href={item.href}
                className={`
                  relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200
                  ${item.current 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-md shadow-sm'
                  }
                `}
              >
                {item.icon}
                {item.hasNotification && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#eeeeee]"></div>
                )}
              </Link>
              
              {/* Tooltip */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-6 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                {item.name}
                {/* Arrow */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
} 