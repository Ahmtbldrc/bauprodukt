'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Mail, Bell, HelpCircle, Settings, LogOut, Search, Plus, Package, BarChart3, X } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useAdminSearch } from '@/contexts/AdminSearchContext'
import { useRouter, usePathname } from 'next/navigation'

export function AdminHeader() {
  const [activeFilter, setActiveFilter] = useState('Dieser Monat')
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'waitlist' | 'order' | 'system'
    title: string
    message: string
    time: string
    read: boolean
    link?: string
  }>>([])

  const { user, logout } = useAdminAuth()
  const { searchQuery, setSearchQuery, waitlistFilters, setWaitlistFilters } = useAdminSearch()
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

    // Waitlist sayfası
    if (pathname.startsWith('/admin/waitlist')) {
      return {
        showTimeFilters: false,
        centerContent: (
          <div className="flex items-center space-x-1">
                         {/* Filtreler */}
             <div className="flex items-center space-x-3">
               {/* Typ Filter */}
               <div className="flex items-center space-x-2">
                 <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Typ:</span>
                 <select
                   value={waitlistFilters.type}
                   onChange={(e) => setWaitlistFilters((prev) => ({ ...prev, type: e.target.value as 'new' | 'update' | 'all' }))}
                   className="px-4 py-3 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
                   style={{ fontFamily: 'var(--font-blinker)' }}
                 >
                   <option value="all">Alle Einträge</option>
                   <option value="new">Neue Produkte</option>
                   <option value="update">Updates</option>
                 </select>
               </div>

               {/* Grund Filter */}
               <div className="flex items-center space-x-2">
                 <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grund:</span>
                 <select
                   value={waitlistFilters.reason}
                   onChange={(e) => setWaitlistFilters((prev) => ({ ...prev, reason: e.target.value }))}
                   className="px-4 py-3 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[160px]"
                   style={{ fontFamily: 'var(--font-blinker)' }}
                 >
                   <option value="">Alle Gründe</option>
                   <option value="new_product">Neues Produkt</option>
                   <option value="price_change">Preisänderung</option>
                   <option value="variant_change">Variantenänderung</option>
                   <option value="name_change">Namensänderung</option>
                   <option value="image_change">Bildänderung</option>
                   <option value="sku_change">SKU-Änderung</option>
                   <option value="multiple_changes">Mehrere Änderungen</option>
                 </select>
               </div>

               {/* Manuelle Überprüfung Filter */}
               <button
                 onClick={() => setWaitlistFilters((prev) => ({ ...prev, requiresReview: !prev.requiresReview }))}
                 className={`px-4 py-3 rounded-full transition-all duration-200 border text-sm whitespace-nowrap ${
                   waitlistFilters.requiresReview
                     ? 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
                     : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                 }`}
                 style={{ fontFamily: 'var(--font-blinker)' }}
               >
                 Manuelle Überprüfung
               </button>
             </div>

            {/* Filter löschen Button */}
            {(waitlistFilters.type !== 'all' || waitlistFilters.requiresReview || waitlistFilters.hasInvalidDiscount || waitlistFilters.reason) && (
              <button
                onClick={() => setWaitlistFilters({
                  type: 'all',
                  requiresReview: false,
                  hasInvalidDiscount: false,
                  reason: ''
                })}
                className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 flex items-center space-x-2"
                style={{ fontFamily: 'var(--font-blinker)' }}
              >
                <X className="h-4 w-4" />
                <span>Löschen</span>
              </button>
            )}
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

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
    }
    setShowNotifications(false)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest('.notification-panel')) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  // Waitlist count'u ve bildirimleri fetch et
  useEffect(() => {
    const fetchWaitlistCount = async () => {
      try {
        const response = await fetch('/api/waitlist/stats')
        if (response.ok) {
          const data = await response.json()
          
          // Waitlist bildirimlerini ekle
          if (data.data?.total_entries > 0) {
            const waitlistNotifications = [{
              id: 'waitlist-pending',
              type: 'waitlist' as const,
              title: 'Warteliste - Ausstehende Einträge',
              message: `${data.data.total_entries} Wartelisteneinträge warten`,
              time: 'Gerade eben',
              read: false,
              link: '/admin/waitlist'
            }]
            
            // Manuelle Überprüfung erforderliche Benachrichtigungen
            if (data.data.manual_review_required > 0) {
              waitlistNotifications.push({
                id: 'waitlist-review',
                type: 'waitlist' as const,
                title: 'Manuelle Überprüfung erforderlich',
                message: `${data.data.manual_review_required} Einträge warten auf manuelle Überprüfung`,
                time: 'Gerade eben',
                read: false,
                link: '/admin/waitlist?requiresReview=true'
              })
            }
            
            setNotifications(prev => {
              const existing = prev.filter(n => n.type !== 'waitlist')
              return [...existing, ...waitlistNotifications]
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch waitlist count:', error)
      }
    }
    
    fetchWaitlistCount()
  }, [])

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
          {/* Bell Notification Button */}
          <div className="relative">
            <button 
              onClick={toggleNotifications}
              className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifications && (
              <div className="notification-panel absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Benachrichtigungen</h3>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                                      <div className="p-4 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Noch keine Benachrichtigungen</p>
                  </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'waitlist' ? 'bg-orange-400' :
                            notification.type === 'order' ? 'bg-blue-400' :
                            'bg-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Alle als gelesen markieren
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>



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