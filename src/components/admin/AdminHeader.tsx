'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Bell, LogOut, Search, Plus, Package, BarChart3, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAllCategories } from '@/hooks/useCategories'
import toast from 'react-hot-toast'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useAdminSearch } from '@/contexts/AdminSearchContext'
import { useRouter, usePathname } from 'next/navigation'

export function AdminHeader() {
  const [activeFilter, setActiveFilter] = useState('Dieser Monat')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showCreateBrand, setShowCreateBrand] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [brandSlug, setBrandSlug] = useState('')
  const createBrandFileInputRef = useRef<HTMLInputElement>(null)
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | undefined>(undefined)
  const [brandLogoUploading, setBrandLogoUploading] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [categorySlugTouched, setCategorySlugTouched] = useState(false)
  const [categoryIconPreview, setCategoryIconPreview] = useState<string | undefined>(undefined)
  const [categoryIconUploading, setCategoryIconUploading] = useState(false)
  const createCategoryIconInputRef = useRef<HTMLInputElement>(null)
  const [categoryParentId, setCategoryParentId] = useState<string | ''>('')

  const { data: allCategoriesResponse } = useAllCategories()
  const allCategories = allCategoriesResponse?.data || []
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
  const queryClient = useQueryClient()

  const createBrandMutation = useMutation({
    mutationFn: async (payload: { name: string; slug?: string; logoFile?: File | null }) => {
      // 1) Create brand
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: payload.name, slug: payload.slug }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || 'Marke konnte nicht erstellt werden')
      }
      const brand = await response.json()

      // 2) If logo selected, upload
      if (payload.logoFile) {
        const formData = new FormData()
        formData.append('file', payload.logoFile)
        const logoRes = await fetch(`/api/brands/${brand.id}/logo`, { method: 'POST', body: formData })
        if (!logoRes.ok) {
          const errTxt = await logoRes.text()
          let errMsg = 'Logo-Upload fehlgeschlagen'
          try { errMsg = (JSON.parse(errTxt)?.error) || errMsg } catch {}
          throw new Error(errMsg)
        }
      }

      return brand
    },
    onSuccess: () => {
      toast.success('Marke erfolgreich erstellt')
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      setShowCreateBrand(false)
      setBrandName('')
      setBrandSlug('')
      setBrandLogoPreview(undefined)
      if (createBrandFileInputRef.current) createBrandFileInputRef.current.value = ''
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Fehler beim Erstellen der Marke')
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (payload: { name: string; slug?: string }) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: payload.name, 
          slug: payload.slug, 
          parent_id: categoryParentId || null
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || 'Kategorie konnte nicht erstellt werden')
      }
      const created = await response.json()

      // If icon selected, upload
      const file = createCategoryIconInputRef.current?.files?.[0]
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const iconRes = await fetch(`/api/categories/${created.id}/icon`, { method: 'POST', body: formData })
        if (!iconRes.ok) {
          const errTxt = await iconRes.text()
          let errMsg = 'Icon-Upload fehlgeschlagen'
          try { errMsg = (JSON.parse(errTxt)?.error) || errMsg } catch {}
          throw new Error(errMsg)
        }
      }

      return created
    },
    onSuccess: () => {
      toast.success('Kategorie erfolgreich erstellt')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowCreateCategory(false)
      setCategoryName('')
      setCategorySlug('')
      setCategorySlugTouched(false)
      setCategoryIconPreview(undefined)
      setCategoryParentId('')
      if (createCategoryIconInputRef.current) createCategoryIconInputRef.current.value = ''
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Fehler beim Erstellen der Kategorie')
    },
  })

  const generateSlug = (text: string) => {
    const turkishMap: Record<string, string> = {
      'ı': 'i', 'İ': 'i',
      'ö': 'o', 'Ö': 'o',
      'ü': 'u', 'Ü': 'u',
      'ç': 'c', 'Ç': 'c',
      'ğ': 'g', 'Ğ': 'g',
      'ş': 's', 'Ş': 's',
    }
    const replaced = text.replace(/[ıİöÖüÜçÇğĞşŞ]/g, (ch) => turkishMap[ch] || ch)
    return replaced
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}+/gu, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }
  
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
            <button
              onClick={() => setShowCreateBrand(true)}
              className="px-8 py-3 text-sm font-medium rounded-full border border-gray-300 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 shadow-sm flex items-center gap-2"
              style={{ fontFamily: 'var(--font-blinker)' }}
            >
              <Plus className="h-4 w-4" />
              Neue Marke
            </button>
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
          {/* <button className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200">
            <HelpCircle size={20} />
          </button> */}

          {/* Settings Button */}
          {/* <button className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200">
            <Settings size={20} />
          </button> */}

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

      {/* Create Brand Dialog */}
      {showCreateBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => !createBrandMutation.isPending && setShowCreateBrand(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <button
              onClick={() => !createBrandMutation.isPending && setShowCreateBrand(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={createBrandMutation.isPending}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">Neue Marke hinzufügen</h3>
            <div className="space-y-4">
              {/* Logo section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo (optional)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 relative rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                    {brandLogoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brandLogoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs">Logo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => createBrandFileInputRef.current?.click()}
                      className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
                      disabled={brandLogoUploading || createBrandMutation.isPending}
                      style={{ color: '#F39237', borderColor: '#F39237' }}
                    >
                      {brandLogoUploading ? 'Wird gewählt...' : (brandLogoPreview ? 'Logo ändern' : 'Logo hochladen')}
                    </button>
                    {brandLogoPreview && (
                      <button
                        type="button"
                        onClick={() => setBrandLogoPreview(undefined)}
                        className="px-3 py-2 rounded-lg border text-sm text-red-600 border-red-300 disabled:opacity-50"
                        disabled={brandLogoUploading || createBrandMutation.isPending}
                      >
                        Entfernen
                      </button>
                    )}
                    <input
                      ref={createBrandFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setBrandLogoUploading(true)
                        const reader = new FileReader()
                        reader.onload = () => {
                          setBrandLogoPreview(reader.result as string)
                          setBrandLogoUploading(false)
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237]"
                  placeholder="z.B. Bosch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional)</label>
                <input
                  type="text"
                  value={brandSlug}
                  onChange={(e) => setBrandSlug(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237]"
                  placeholder="z.B. bosch"
                />
                <p className="text-xs text-gray-500 mt-1">Leer lassen, um automatisch aus dem Namen zu generieren.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowCreateBrand(false)}
                disabled={createBrandMutation.isPending}
                className="px-4 py-2 rounded-lg border disabled:opacity-50"
                style={{
                  color: '#F39237',
                  borderColor: '#F39237',
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  const file = createBrandFileInputRef.current?.files?.[0] || null
                  createBrandMutation.mutate({ name: brandName.trim(), slug: brandSlug.trim() || undefined, logoFile: file })
                }}
                disabled={!brandName.trim() || createBrandMutation.isPending}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{
                  backgroundColor: '#F39237',
                }}
              >
                {createBrandMutation.isPending ? 'Wird erstellt...' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Dialog */}
      {showCreateCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => !createCategoryMutation.isPending && setShowCreateCategory(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <button
              onClick={() => !createCategoryMutation.isPending && setShowCreateCategory(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={createCategoryMutation.isPending}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">Neue Kategorie hinzufügen</h3>
            <div className="space-y-4">
              {/* Icon section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (SVG)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 relative rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                    {categoryIconPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={categoryIconPreview} alt="Icon Preview" className="w-10 h-10" />
                    ) : (
                      <span className="text-gray-400 text-xs">SVG</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => createCategoryIconInputRef.current?.click()}
                      className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
                      disabled={categoryIconUploading || createCategoryMutation.isPending}
                      style={{ color: '#F39237', borderColor: '#F39237' }}
                    >
                      {categoryIconUploading ? 'Wird gewählt...' : (categoryIconPreview ? 'Icon ändern' : 'Icon hochladen')}
                    </button>
                    {categoryIconPreview && (
                      <button
                        type="button"
                        onClick={() => setCategoryIconPreview(undefined)}
                        className="px-3 py-2 rounded-lg border text-sm text-red-600 border-red-300 disabled:opacity-50"
                        disabled={categoryIconUploading || createCategoryMutation.isPending}
                      >
                        Entfernen
                      </button>
                    )}
                    <input
                      ref={createCategoryIconInputRef}
                      type="file"
                      accept="image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setCategoryIconUploading(true)
                        const objectUrl = URL.createObjectURL(file)
                        setCategoryIconPreview(objectUrl)
                        setCategoryIconUploading(false)
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => {
                    const value = e.target.value
                    setCategoryName(value)
                    if (!categorySlugTouched) setCategorySlug(generateSlug(value))
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237]"
                  placeholder="z.B. Werkzeuge"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional)</label>
                <input
                  type="text"
                  value={categorySlug}
                  onChange={(e) => {
                    setCategorySlug(e.target.value)
                    setCategorySlugTouched(true)
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237]"
                  placeholder="z.B. werkzeuge"
                />
                <p className="text-xs text-gray-500 mt-1">Leer lassen, um automatisch aus dem Namen zu generieren.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Übergeordnete Kategorie (optional)</label>
                <select
                  value={categoryParentId}
                  onChange={(e) => setCategoryParentId(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237] bg-white"
                >
                  <option value="">Keine</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowCreateCategory(false)}
                disabled={createCategoryMutation.isPending}
                className="px-4 py-2 rounded-lg border disabled:opacity-50"
                style={{
                  color: '#F39237',
                  borderColor: '#F39237',
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => createCategoryMutation.mutate({ name: categoryName.trim(), slug: categorySlug.trim() || undefined })}
                disabled={!categoryName.trim() || createCategoryMutation.isPending}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{
                  backgroundColor: '#F39237',
                }}
              >
                {createCategoryMutation.isPending ? 'Wird erstellt...' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
} 