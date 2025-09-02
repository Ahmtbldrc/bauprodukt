'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAllBrands } from '@/hooks/useBrands'
import { useAllCategories } from '@/hooks/useCategories'
import type { Category } from '@/types/product'

import { 
  ShoppingCart, 
  Heart, 
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  MapPin,
  Gift,
  Star,
  Tag,
  Package,
  Zap
} from 'lucide-react'

// Helper: Build category tree from flat array
function buildCategoryTree(categories: Category[]): (Category & { children: Category[] })[] {
  const map = new Map<string, Category & { children: Category[] }>();
  categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));
  const tree: (Category & { children: Category[] })[] = [];
  categories.forEach((cat) => {
    if (cat.parent_id) {
      map.get(cat.parent_id)?.children.push(map.get(cat.id)!);
    } else {
      tree.push(map.get(cat.id)!);
    }
  });
  return tree;
}

export function Header() {
  const { getTotalItems } = useCart()
  const { getFavoritesCount } = useFavorites()
  const { isAuthenticated, user, logout } = useAuth()
  const totalItems = getTotalItems()
  const favoriteItemCount = getFavoritesCount()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedLocation] = useState('Chur, Schweiz')
  const [categoryButtonPosition, setCategoryButtonPosition] = useState({ top: 0, left: 0 })
  const [brandButtonPosition, setBrandButtonPosition] = useState({ top: 0, left: 0 })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const categoryButtonRef = useRef<HTMLButtonElement>(null)
  const brandButtonRef = useRef<HTMLButtonElement>(null)
  
  // Calculate button positions for dropdown placement
  const calculateButtonPosition = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      return {
        top: rect.bottom + 8,
        left: rect.left
      }
    }
    return { top: 0, left: 0 }
  }
  
  // Authentication state
  const isLoggedIn = isAuthenticated

  // Scroll efekti için
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCategoryMenuOpen && !(event.target as Element).closest('.category-dropdown')) {
        setIsCategoryMenuOpen(false)
      }
      if (isBrandMenuOpen && !(event.target as Element).closest('.brand-dropdown')) {
        setIsBrandMenuOpen(false)
      }
      if (isUserMenuOpen && !(event.target as Element).closest('.user-dropdown')) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCategoryMenuOpen, isBrandMenuOpen, isUserMenuOpen])

  const { data: categoriesResponse, isLoading: categoriesLoading } = useAllCategories();
  const liveCategories = categoriesResponse?.data || [];
  const categoryTree = buildCategoryTree(liveCategories);

  const { data: brandsResponse, isLoading: brandsLoading } = useAllBrands();
  const brands = brandsResponse?.data || [];

  return (
    <div className="sticky top-0 z-50">
      {/* Main Header */}
      <header className={`transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200/50' 
          : 'bg-white shadow-lg border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-24">
            {/* Logo */}
            <div className="flex items-center" style={{ marginLeft: '-8px' }}>
              <Link href="/" className="group transition-transform duration-200 hover:scale-105">
                <Image
                  src="/Bauprodukt-Logo.svg"
                  alt="Bauprodukt"
                  width={360}
                  height={120}
                  className="w-auto"
                  style={{ height: '90px' }}
                  priority
                />
              </Link>
            </div>

            {/* Enhanced Search Bar */}
            <div className="flex-1 max-w-3xl mx-8">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 transition-colors duration-200 group-focus-within:text-gray-600" />
                </div>
                <input
                  type="search"
                  placeholder="Produkt, Marke, Kategorie..."
                  className="w-full h-11 pl-12 pr-20 bg-white border-[1.5px] border-[#F2F2F2] rounded-[10px] focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all duration-300 ease-out text-gray-700 placeholder-gray-400 hover:border-[#F39237]"
                  style={{
                    width: '620px',
                    height: '44px'
                  }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <span className="text-gray-500 text-sm mr-2">Suche</span>
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Favorites */}
              <Link href="/favorites" className="relative text-gray-400 border border-gray-200 rounded-sm hover:border-gray-300 transition-all duration-200 flex items-center justify-center" style={{ width: '30px', height: '30px' }}>
                <Heart className="h-4 w-4" />
                {favoriteItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {favoriteItemCount}
                  </span>
                )}
              </Link>
              
              {/* Shopping Cart */}
              <Link
                href="/cart"
                className="relative text-gray-400 border border-gray-200 rounded-sm hover:border-gray-300 transition-all duration-200 flex items-center justify-center" style={{ width: '30px', height: '30px' }}
              >
                <ShoppingCart className="h-4 w-4" />
                {/* Cart Badge - nur anzeigen wenn Produkte im Warenkorb sind */}
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-medium animate-bounce">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>
              
              {/* Pencil/User Icon */}
              <Link href="/login" className="text-gray-400 border border-gray-200 rounded-sm hover:border-gray-300 transition-all duration-200 flex items-center justify-center" style={{ width: '30px', height: '30px' }}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </Link>
              
              {/* User Menu */}
              <div className="relative user-dropdown">
                {isLoggedIn ? (
                  <div>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 text-gray-600 transition-all duration-200 px-3 py-2 rounded-lg group"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#F39236'
                        e.currentTarget.style.backgroundColor = '#F3923615'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#4b5563'
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                           style={{background: 'linear-gradient(to bottom right, #F39236, #dc2626)'}}>
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="hidden md:block text-left">
                        <div className="text-xs text-gray-500">Willkommen</div>
                        <div className="text-sm font-medium">{user?.firstName} {user?.lastName?.charAt(0)}.</div>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200/50 z-50">
                        <div className="p-4">
                          <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user?.fullName}</p>
                              <p className="text-sm text-gray-500">{user?.email}</p>
                            </div>
                          </div>
                          <div className="py-2">
                            {[
                              { href: '/account', label: 'Mein Konto', icon: User },
                              { href: '/orders', label: 'Meine Bestellungen', icon: Package },
                              { href: '/addresses', label: 'Meine Adressen', icon: MapPin },
                              { href: '/favorites', label: 'Meine Favoriten', icon: Heart },
                              { href: '/coupons', label: 'Meine Gutscheine', icon: Gift },
                              { href: '/reviews', label: 'Meine Bewertungen', icon: Star }
                            ].map((item) => (
                              <Link 
                                key={item.href}
                                href={item.href} 
                                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-all duration-200"
                              >
                                <item.icon className="h-4 w-4 mr-3" />
                                {item.label}
                              </Link>
                            ))}
                          </div>
                          <div className="border-t border-gray-100 pt-2">
                            <button 
                              onClick={() => {
                                logout()
                                setIsUserMenuOpen(false)
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            >
                              <X className="h-4 w-4 mr-3" />
                              Abmelden
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="font-medium rounded-sm transition-all duration-200 border border-orange-500 text-gray-800 flex items-center justify-center"
                      style={{
                        fontWeight: '500',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0px',
                        width: '75px',
                        height: '30px'
                      }}
                    >
                      Anmelden
                    </Link>
                    <Link
                      href="/register"
                      className="font-medium rounded-sm transition-all duration-200 text-white flex items-center justify-center"
                      style={{
                        fontWeight: '500',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0px',
                        backgroundColor: '#F39236',
                        color: '#FFFFFF',
                        width: '90px',
                        height: '30px'
                      }}
                    >
                      Registrieren
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50 rounded-lg"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden px-4 pb-3 border-t border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="search"
              placeholder="Produkt, Marke suchen..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>
      </header>

      {/* Secondary Navigation */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 relative transition-all duration-300 max-h-9 opacity-100">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between transition-all duration-300 py-2">
            <div className="flex items-center space-x-6 text-sm overflow-visible" style={{ fontSize: '12px' }}>
              {/* All Categories Button - Moved here */}
              <div className="relative category-dropdown">
                <button
                  ref={categoryButtonRef}
                  onClick={() => {
                    if (!isCategoryMenuOpen) {
                      setCategoryButtonPosition(calculateButtonPosition(categoryButtonRef))
                    }
                    setIsCategoryMenuOpen(!isCategoryMenuOpen)
                  }}
                  className="flex items-center font-medium whitespace-nowrap transition-all duration-200"
                  style={{ color: '#2C2C2C' }}
                >
                  <Menu className="h-4 w-4 mr-1" />
                  Alle Kategorien
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryMenuOpen && (
                  <div 
                    className="fixed w-[900px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[999]"
                    style={{
                      top: `${categoryButtonPosition.top}px`,
                      left: `${categoryButtonPosition.left}px`
                    }}
                  >
                    <div className="flex">
                      {/* Linkes Panel - Hauptkategorien */}
                      <div className="w-1/3 p-4 border-r border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Hauptkategorien
                        </h3>
                        <div className="space-y-1">
                          {categoriesLoading ? (
                            <div className="text-center py-4 text-gray-400">Kategorien werden geladen...</div>
                          ) : (
                            categoryTree.map((category) => (
                              <div
                                key={category.id}
                                onMouseEnter={() => setSelectedCategory(category.id)}
                                className={`flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer group ${selectedCategory === category.id ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500' : 'hover:bg-gray-50'}`}
                              >
                                <span className="text-xl mr-3">
                                  {category.emoji
                                    ? category.emoji
                                    : category.image
                                      ? <Image src={category.image} alt={category.name} width={24} height={24} className="inline rounded" />
                                      : '📦'}
                                </span>
                                <div className="flex-1">
                                  <span className={`text-sm font-medium transition-colors ${selectedCategory === category.id ? 'text-orange-700' : 'text-gray-700 group-hover:text-gray-800'}`}>{category.name}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Rechtes Panel - Unterkategorien und Items */}
                      <div className="w-2/3 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {categoryTree.find(cat => cat.id === selectedCategory)?.name || 'Kategorie wählen'}
                          </h3>
                          {selectedCategory && (
                            <Link 
                              href={`/categories/${categoryTree.find(cat => cat.id === selectedCategory)?.slug}`}
                              onClick={() => setIsCategoryMenuOpen(false)}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                            >
                              Alle anzeigen →
                            </Link>
                          )}
                        </div>
                        
                        {/* Subcategories (children) if any */}
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {categoryTree.find(cat => cat.id === selectedCategory)?.children?.map((subcat: Category) => (
                            <Link
                              key={subcat.id}
                              href={`/categories/${subcat.slug}`}
                              onClick={() => setIsCategoryMenuOpen(false)}
                              className="flex items-center px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors"
                            >
                              <span className="text-sm text-gray-700">
                                {subcat.emoji
                                  ? subcat.emoji
                                  : subcat.image
                                    ? <Image src={subcat.image} alt={subcat.name} width={20} height={20} className="inline rounded mr-2" />
                                    : '📂'} {subcat.name}
                              </span>
                            </Link>
                          ))}
                        </div>

                        {/* Unterer Bereich - Alle Kategorien Link */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <Link 
                            href="/categories"
                            onClick={() => setIsCategoryMenuOpen(false)} 
                            className="flex items-center justify-center w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl"
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Alle Kategorien durchsuchen
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* All Brands Button */}
              <div className="relative brand-dropdown">
                <button
                  ref={brandButtonRef}
                  onClick={() => {
                    if (!isBrandMenuOpen) {
                      setBrandButtonPosition(calculateButtonPosition(brandButtonRef))
                    }
                    setIsBrandMenuOpen(!isBrandMenuOpen)
                  }}
                  className="flex items-center font-medium whitespace-nowrap transition-all duration-200"
                  style={{ color: '#2C2C2C' }}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Alle Marken
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${isBrandMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBrandMenuOpen && (
                  <div 
                    className="fixed w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[999]"
                    style={{
                      top: `${brandButtonPosition.top}px`,
                      left: `${brandButtonPosition.left}px`
                    }}
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Beliebte Marken</h3>
                      {brandsLoading ? (
                        <div className="text-center py-4 text-gray-400">Marken werden geladen...</div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {brands.slice(0, 12).map((brand) => (
                            <Link
                              key={brand.id}
                              href={{ pathname: '/products', query: { brand: brand.id } }}
                              onClick={() => setIsBrandMenuOpen(false)}
                              className="flex items-center p-3 rounded-lg hover:bg-gradient-to-r hover:from-[#C74A40]/10 hover:to-[#A63F35]/10 transition-all duration-200 group"
                            >
                              <div className="w-2 h-2 bg-[#C74A40] rounded-full mr-3 group-hover:bg-[#A63F35] transition-colors"></div>
                              <span className="text-sm font-medium text-gray-700 group-hover:text-[#C74A40]">
                                {brand.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Link 
                          href="/brands"
                          onClick={() => setIsBrandMenuOpen(false)} 
                          className="block text-center bg-gradient-to-r from-[#C74A40]/10 to-[#A63F35]/10 text-[#C74A40] py-2 rounded-lg hover:from-[#C74A40]/20 hover:to-[#A63F35]/20 transition-all duration-200 font-medium"
                        >
                          Alle Marken anzeigen
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/discounted" className="flex items-center font-medium whitespace-nowrap" style={{ color: '#2C2C2C' }}>
                <Tag className="h-4 w-4 mr-1" />
                Angebote
              </Link>
            </div>
            
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4">
            {/* Location */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-orange-500 mr-2" />
                <span className="text-sm font-medium">Standort: {selectedLocation}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>

            {/* Categories */}
            <div className="py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Kategorien</h3>
              {categoriesLoading ? (
                <div className="text-center py-4 text-gray-400">Kategorien werden geladen...</div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {categoryTree.slice(0, 6).map((category) => (
                    <div key={category.id} className="bg-gray-50 rounded-lg p-3">
                      <Link
                        href={`/categories/${category.slug}`}
                        className="flex items-center mb-2 hover:text-orange-600 transition-colors"
                      >
                        <span className="text-lg mr-2">{category.emoji || (category.image ? <Image src={category.image} alt={category.name} width={24} height={24} className="inline rounded" /> : '📦')}</span>
                        <span className="text-sm font-medium text-gray-800">{category.name}</span>
                      </Link>
                        {/* Subcategories in mobile menu */}
                        {category.children && category.children.length > 0 && (
                          <div className="ml-6 mt-1 space-y-1">
                            {category.children.slice(0, 3).map((subcat: Category) => (
                              <Link
                                key={subcat.id}
                                href={`/categories/${subcat.slug}`}
                                className="text-xs text-gray-700 hover:text-blue-600 font-medium transition-colors block mb-1"
                              >
                                {subcat.name}
                              </Link>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Brands */}
            <div className="py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Beliebte Marken</h3>
              {brandsLoading ? (
                <div className="text-center py-4 text-gray-400">Marken werden geladen...</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {brands.slice(0, 6).map((brand) => (
                    <Link
                      key={brand.id}
                      href={{ pathname: '/products', query: { brand: brand.id } }}
                      className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gradient-to-r hover:from-[#C74A40]/10 hover:to-[#A63F35]/10 transition-all duration-200"
                    >
                      <div className="w-1.5 h-1.5 bg-[#C74A40] rounded-full mr-2"></div>
                      <span className="text-sm text-gray-700">{brand.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { href: '/new-products', label: 'Neue Produkte', icon: Zap },
                  { href: '/bestsellers', label: 'Bestseller', icon: Star },
                  { href: '/discounts', label: 'Rabatte', icon: Tag },
                  { href: '/campaigns', label: 'Kampagnen', icon: Gift }
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-orange-500 mr-2" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Auth Actions */}
            {!isLoggedIn && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <Link
                  href="/login"
                  className="block w-full text-center py-3 border border-orange-500 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors"
                >
                  Anmelden
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 