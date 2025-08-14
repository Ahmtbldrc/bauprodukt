'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Mail, Bell, HelpCircle, Settings, LogOut, Search, Plus, Users, Package, ShoppingCart, BarChart3 } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useAdminSearch } from '@/contexts/AdminSearchContext'
import { useRouter, usePathname } from 'next/navigation'

export function AdminHeader() {
  const [activeFilter, setActiveFilter] = useState('Dieser Monat')
  const { user, logout } = useAdminAuth()
  const { searchQuery, setSearchQuery } = useAdminSearch()
  const router = useRouter()
  const pathname = usePathname()
  
  const timeFilters = ['Heute', 'Diese Woche', 'Dieser Monat', 'Berichte']

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/admin-login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Sayfa bazında header içeriğini belirle
  const getHeaderContent = () => {
    // Dashboard
    if (pathname === '/admin') {
      return {
        showTimeFilters: true,
        centerContent: (
          <div className="flex items-center space-x-1">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-8 py-3 text-sm font-medium rounded-full border border-gray-300 transition-all duration-200 ${
                  activeFilter === filter
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                style={{ fontFamily: 'var(--font-blinker)' }}
              >
                {filter}
              </button>
            ))}
          </div>
        )
      }
    }

    // Products sayfası
    if (pathname.startsWith('/admin/products')) {
      // Ürün detay sayfası veya yeni ürün sayfası ise ortada hiçbir şey gösterme
      if (pathname.includes('/admin/products/') || pathname === '/admin/products/new') {
        return {
          showTimeFilters: false,
          centerContent: null
        }
      }
      
      // Sadece ana products sayfasında search ve yeni ürün butonu göster
      return {
        showTimeFilters: false,
        centerContent: (
          <div className="flex items-center space-x-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Produkt suchen..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                style={{ fontFamily: 'var(--font-blinker)' }}
              />
            </div>
            <Link
              href="/admin/products/new"
              className="px-8 py-3 text-sm font-medium rounded-full border border-gray-300 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 shadow-sm flex items-center gap-2"
              style={{ fontFamily: 'var(--font-blinker)' }}
            >
              <Plus className="h-4 w-4" />
              Neues Produkt
            </Link>
          </div>
        )
      }
    }

    // Categories sayfası
    if (pathname.startsWith('/admin/categories')) {
      return {
        showTimeFilters: false,
        centerContent: (
          <div className="flex items-center space-x-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Kategorie suchen..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                style={{ fontFamily: 'var(--font-blinker)' }}
              />
            </div>
            <Link
              href="/admin/categories/new"
              className="px-8 py-3 text-sm font-medium rounded-full border border-gray-300 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 shadow-sm flex items-center gap-2"
              style={{ fontFamily: 'var(--font-blinker)' }}
            >
              <Plus className="h-4 w-4" />
              Neue Kategorie
            </Link>
          </div>
        )
      }
    }

    // Brands sayfası
    if (pathname.startsWith('/admin/brands')) {
      return {
        showTimeFilters: false,
        centerContent: (
          <div className="flex items-center space-x-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Marke suchen..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                style={{ fontFamily: 'var(--font-blinker)' }}
              />
            </div>
          </div>
        )
      }
    }

    // Orders sayfası
    if (pathname.startsWith('/admin/orders')) {
      return {
        showTimeFilters: false,
        centerContent: (
          <div className="flex items-center space-x-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Bestellung suchen..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                style={{ fontFamily: 'var(--font-blinker)' }}
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Package className="h-4 w-4" />
              <span>Bestellverwaltung</span>
            </div>
          </div>
        )
      }
    }

    // Banners sayfası
    if (pathname.startsWith('/admin/banners')) {
      return {
        showTimeFilters: false,
        centerContent: (
          <div className="flex items-center space-x-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Banner suchen..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                style={{ fontFamily: 'var(--font-blinker)' }}
              />
            </div>
            <Link
              href="/admin/banners/new"
              className="px-8 py-3 text-sm font-medium rounded-full border border-gray-300 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 shadow-sm flex items-center gap-2"
              style={{ fontFamily: 'var(--font-blinker)' }}
            >
              <Plus className="h-4 w-4" />
              Neuer Banner
            </Link>
          </div>
        )
      }
    }

    // Images sayfası
    if (pathname.startsWith('/admin/images')) {
      return {
        showTimeFilters: false,
        centerContent: (
          <div className="flex items-center space-x-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Bild suchen..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                style={{ fontFamily: 'var(--font-blinker)' }}
              />
            </div>
            <Link
              href="/admin/images/upload"
              className="px-8 py-3 text-sm font-medium rounded-full border border-gray-300 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 shadow-sm flex items-center gap-2"
              style={{ fontFamily: 'var(--font-blinker)' }}
            >
              <Plus className="h-4 w-4" />
              Bild hochladen
            </Link>
          </div>
        )
      }
    }

    // Default - diğer sayfalar için
    return {
      showTimeFilters: false,
      centerContent: (
        <div className="flex items-center space-x-2 text-gray-600">
          <BarChart3 className="h-5 w-5" />
          <span className="text-lg font-medium">Admin Panel</span>
        </div>
      )
    }
  }

  const headerContent = getHeaderContent()

  return (
    <header className="py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Logo */}
        <div className="flex-1 flex justify-start -ml-12">
          <Link href="/admin" className="flex items-center">
            <div className="relative">
              <Image 
                src="/Bauprodukt-Logo.svg" 
                alt="Bauprodukt" 
                width={192}
                height={48}
                className="w-48 h-auto block"
                style={{ maxWidth: '192px', height: 'auto' }}
              />
              <span 
                className="text-xl font-bold text-gray-900 absolute top-0 left-0 hidden"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                Bauprodukt
              </span>
            </div>
          </Link>
        </div>
        
        {/* Center Section - Dynamic Content */}
        <div className="flex-1 flex justify-center">
          {headerContent.centerContent}
        </div>
        
        {/* Right Section - User */}
        <div className="flex-1 flex items-center justify-end space-x-2 pr-6">
          {/* Mail Button */}
          <button className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200">
            <Mail size={20} />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#eeeeee]"></div>
          </button>

          {/* Bell Notification Button */}
          <button className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200">
            <Bell size={20} />
          </button>

          {/* Help Button */}
          <button className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200">
            <HelpCircle size={20} />
          </button>

          {/* Settings Button */}
          <button className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200">
            <Settings size={20} />
          </button>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-sm transition-all duration-200"
            title="Abmelden"
          >
            <LogOut size={20} />
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 ml-2">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Benutzer-Avatar"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <p className="text-base font-medium text-gray-900" style={{ fontFamily: 'var(--font-blinker)' }}>
                {user?.fullName || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-blinker)' }}>Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 