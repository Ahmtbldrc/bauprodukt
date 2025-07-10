'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
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
  Truck,
  Clock,
  Star,
  Tag,
  Package,
  Zap,
  Crown,
  Phone,
  Mail
} from 'lucide-react'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('Chur, Schweiz')
  const [categoryButtonPosition, setCategoryButtonPosition] = useState({ top: 0, left: 0 })
  const [brandButtonPosition, setBrandButtonPosition] = useState({ top: 0, left: 0 })
  const [selectedCategory, setSelectedCategory] = useState(0) // İlk kategori default seçili
  const [selectedSubcategory, setSelectedSubcategory] = useState(0) // İlk alt kategori default seçili
  
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
  
  // Mock data - bu veriler gerçek uygulamada state management'tan gelecek
  const cartItemCount = 3
  const favoriteItemCount = 5
  const isLoggedIn = false

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

  const mainCategories = [
    { 
      name: 'Yapı Malzemeleri', 
      icon: '🏗️', 
      href: '/categories/yapi-malzemeleri',
      subcategories: [
        { 
          name: 'Banyo', 
          href: '/categories/banyo',
          items: [
            { name: 'Küvet', href: '/categories/banyo/kuvet' },
            { name: 'Duş Bölmesi', href: '/categories/banyo/dus-bolmesi' },
            { name: 'Lavabo', href: '/categories/banyo/lavabo' },
            { name: 'Klozet', href: '/categories/banyo/klozet' },
            { name: 'Banyo Mobilyası', href: '/categories/banyo/mobilya' },
            { name: 'Banyo Aksesuarları', href: '/categories/banyo/aksesuarlar' }
          ]
        },
        { 
          name: 'Mutfak', 
          href: '/categories/mutfak',
          items: [
            { name: 'Mutfak Tezgahı', href: '/categories/mutfak/tezgah' },
            { name: 'Mutfak Dolapları', href: '/categories/mutfak/dolap' },
            { name: 'Mutfak Evyesi', href: '/categories/mutfak/evye' },
            { name: 'Mutfak Armatürleri', href: '/categories/mutfak/armatur' },
            { name: 'Ankastre Ürünler', href: '/categories/mutfak/ankastre' },
            { name: 'Mutfak Aksesuarları', href: '/categories/mutfak/aksesuarlar' }
          ]
        },
        { 
          name: 'Yapı Kimyasalları', 
          href: '/categories/yapi-kimyasallari',
          items: [
            { name: 'Çimento', href: '/categories/yapi-kimyasallari/cimento' },
            { name: 'Betonit', href: '/categories/yapi-kimyasallari/betonit' },
            { name: 'Yapıştırıcılar', href: '/categories/yapi-kimyasallari/yapistiriciler' },
            { name: 'Su Yalıtımı', href: '/categories/yapi-kimyasallari/su-yalitimi' },
            { name: 'Isı Yalıtımı', href: '/categories/yapi-kimyasallari/isi-yalitimi' },
            { name: 'Derz Dolguları', href: '/categories/yapi-kimyasallari/derz-dolgu' }
          ]
        },
        { 
          name: 'Yapı Elemanları', 
          href: '/categories/yapi-elemanlari',
          items: [
            { name: 'Tuğla', href: '/categories/yapi-elemanlari/tugla' },
            { name: 'Blok', href: '/categories/yapi-elemanlari/blok' },
            { name: 'Briket', href: '/categories/yapi-elemanlari/briket' },
            { name: 'Çatı Kiremidi', href: '/categories/yapi-elemanlari/kiremit' },
            { name: 'Çatı Aksesuarları', href: '/categories/yapi-elemanlari/cati-aksesuarlar' },
            { name: 'Bacalar', href: '/categories/yapi-elemanlari/baca' }
          ]
        }
      ]
    },
    { 
      name: 'Elektrik & Aydınlatma', 
      icon: '💡', 
      href: '/categories/elektrik',
      subcategories: [
        { 
          name: 'Aydınlatma', 
          href: '/categories/aydinlatma',
          items: [
            { name: 'LED Ampuller', href: '/categories/aydinlatma/led-ampul' },
            { name: 'Avizeler', href: '/categories/aydinlatma/avize' },
            { name: 'Spot Aydınlatma', href: '/categories/aydinlatma/spot' },
            { name: 'Dış Mekan Aydınlatma', href: '/categories/aydinlatma/dis-mekan' },
            { name: 'Dekoratif Aydınlatma', href: '/categories/aydinlatma/dekoratif' },
            { name: 'Acil Durum Aydınlatma', href: '/categories/aydinlatma/acil-durum' }
          ]
        },
        { 
          name: 'Elektrik Tesisatı', 
          href: '/categories/elektrik-tesisat',
          items: [
            { name: 'Kablolar', href: '/categories/elektrik-tesisat/kablo' },
            { name: 'Priz ve Anahtarlar', href: '/categories/elektrik-tesisat/priz-anahtar' },
            { name: 'Elektrik Panoları', href: '/categories/elektrik-tesisat/pano' },
            { name: 'Sigorta ve Röleler', href: '/categories/elektrik-tesisat/sigorta-role' },
            { name: 'Kablo Kanalları', href: '/categories/elektrik-tesisat/kablo-kanal' },
            { name: 'Elektrik Kutuları', href: '/categories/elektrik-tesisat/elektrik-kutu' }
          ]
        },
        { 
          name: 'Güvenlik Sistemleri', 
          href: '/categories/guvenlik',
          items: [
            { name: 'Güvenlik Kameraları', href: '/categories/guvenlik/kamera' },
            { name: 'Alarm Sistemleri', href: '/categories/guvenlik/alarm' },
            { name: 'Kapı Zili & İnterkom', href: '/categories/guvenlik/kapi-zili' },
            { name: 'Acil Durum Sistemleri', href: '/categories/guvenlik/acil-durum' },
            { name: 'Erişim Kontrolü', href: '/categories/guvenlik/erisim-kontrol' },
            { name: 'Yangın Güvenliği', href: '/categories/guvenlik/yangin' }
          ]
        }
      ]
    },
    { 
      name: 'El Aletleri', 
      icon: '🔧', 
      href: '/categories/el-aletleri',
      subcategories: [
        { 
          name: 'Vidalama Aletleri', 
          href: '/categories/vidalama',
          items: [
            { name: 'Tornavida Setleri', href: '/categories/vidalama/tornavida-set' },
            { name: 'Bits Setleri', href: '/categories/vidalama/bits' },
            { name: 'Ratchet Tornavidalar', href: '/categories/vidalama/ratchet' },
            { name: 'Elektrikçi Tornavidaları', href: '/categories/vidalama/elektrikci' },
            { name: 'Hassas Tornavidalar', href: '/categories/vidalama/hassas' },
            { name: 'Güç Tornavidaları', href: '/categories/vidalama/guc-tornavida' }
          ]
        },
        { 
          name: 'Ölçüm Aletleri', 
          href: '/categories/olcum',
          items: [
            { name: 'Mezura', href: '/categories/olcum/mezura' },
            { name: 'Gönye', href: '/categories/olcum/gonye' },
            { name: 'Su Terazisi', href: '/categories/olcum/su-terazisi' },
            { name: 'Kaliper', href: '/categories/olcum/kaliper' },
            { name: 'Lazer Ölçüm', href: '/categories/olcum/lazer' },
            { name: 'Dijital Ölçüm', href: '/categories/olcum/dijital' }
          ]
        },
        { 
          name: 'Kesim Aletleri', 
          href: '/categories/kesim',
          items: [
            { name: 'El Testereleri', href: '/categories/kesim/el-testere' },
            { name: 'Utility Bıçaklar', href: '/categories/kesim/utility-bicak' },
            { name: 'Makas', href: '/categories/kesim/makas' },
            { name: 'Pense', href: '/categories/kesim/pense' },
            { name: 'Kargaburun', href: '/categories/kesim/kargaburun' },
            { name: 'Tel Kesici', href: '/categories/kesim/tel-kesici' }
          ]
        }
      ]
    },
    { 
      name: 'Makine & Power Tools', 
      icon: '⚡', 
      href: '/categories/makineler',
      subcategories: [
        { 
          name: 'Delme & Vidalama', 
          href: '/categories/delme-vidalama',
          items: [
            { name: 'Akülü Matkap', href: '/categories/delme-vidalama/akulu-matkap' },
            { name: 'Darbeli Matkap', href: '/categories/delme-vidalama/darbeli-matkap' },
            { name: 'Kırıcı Delici', href: '/categories/delme-vidalama/kirici-delici' },
            { name: 'Akülü Vidalama', href: '/categories/delme-vidalama/akulu-vidalama' },
            { name: 'Matkap Uçları', href: '/categories/delme-vidalama/matkap-ucu' },
            { name: 'Vidalama Uçları', href: '/categories/delme-vidalama/vidalama-ucu' }
          ]
        },
        { 
          name: 'Kesim Makineleri', 
          href: '/categories/kesim-makineleri',
          items: [
            { name: 'Dairesel Testere', href: '/categories/kesim-makineleri/dairesel-testere' },
            { name: 'Jigsaws', href: '/categories/kesim-makineleri/jigsaw' },
            { name: 'Açı Taşlama', href: '/categories/kesim-makineleri/aci-taslama' },
            { name: 'Metal Kesim', href: '/categories/kesim-makineleri/metal-kesim' },
            { name: 'Testere Ağızları', href: '/categories/kesim-makineleri/testere-agzi' },
            { name: 'Kesim Diskleri', href: '/categories/kesim-makineleri/kesim-disk' }
          ]
        },
        { 
          name: 'Zımpara & Polisaj', 
          href: '/categories/zimpara-polisaj',
          items: [
            { name: 'Orbital Zımpara', href: '/categories/zimpara-polisaj/orbital' },
            { name: 'Delta Zımpara', href: '/categories/zimpara-polisaj/delta' },
            { name: 'Bant Zımpara', href: '/categories/zimpara-polisaj/bant' },
            { name: 'Polisaj Makinesi', href: '/categories/zimpara-polisaj/polisaj' },
            { name: 'Zımpara Kağıtları', href: '/categories/zimpara-polisaj/zimpara-kagit' },
            { name: 'Polisaj Bezleri', href: '/categories/zimpara-polisaj/polisaj-bez' }
          ]
        }
      ]
    }
  ]

  const popularBrands = [
    { name: 'Bosch', href: '/brands/bosch' },
    { name: 'Makita', href: '/brands/makita' },
    { name: 'DeWalt', href: '/brands/dewalt' },
    { name: 'Black & Decker', href: '/brands/black-decker' },
    { name: 'Hilti', href: '/brands/hilti' },
    { name: 'Festool', href: '/brands/festool' },
    { name: 'Würth', href: '/brands/wurth' },
    { name: 'Fischer', href: '/brands/fischer' },
    { name: 'Stihl', href: '/brands/stihl' },
    { name: 'Karcher', href: '/brands/karcher' },
    { name: 'Leifheit', href: '/brands/leifheit' },
    { name: 'Gardena', href: '/brands/gardena' }
  ]

  return (
    <div className="sticky top-0 z-50">
      {/* Top Bar */}
      <div className={`bg-gray-800 text-white transition-all duration-300 overflow-hidden ${
        isScrolled ? 'max-h-0 opacity-0 py-0' : 'max-h-10 opacity-100 py-1'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                0850 000 0000
              </span>
              <span className="flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                info@bauprodukt.ch
              </span>
            </div>
                          <div className="flex items-center space-x-4">
                <Link href="/help" className="hover:text-blue-300 transition-colors">
                  Hilfe & Support
                </Link>
                <div className="flex items-center text-gray-300 hover:text-white cursor-pointer transition-colors">
                  <Truck className="h-3 w-3 mr-1" />
                  <span>Schnelle Lieferung</span>
                </div>
                <div className="flex items-center text-gray-300 hover:text-white cursor-pointer transition-colors">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>24/7 Service</span>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200/50' 
          : 'bg-white shadow-lg border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="group transition-transform duration-200 hover:scale-105">
                <Image
                  src="/Bauprodukt-Logo.svg"
                  alt="Bauprodukt"
                  width={220}
                  height={75}
                  className="h-14 w-auto"
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
                  placeholder="Produkt, Marke, Kategorie suchen..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#F39236'
                    e.target.style.boxShadow = `0 0 0 3px rgba(243, 146, 54, 0.1)`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white px-4 py-1.5 rounded-lg transition-colors"
                  style={{backgroundColor: '#F39236'}}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E8832B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F39236')}
                >
                  Suchen
                </button>
              </div>
            </div>

            {/* Location Selector */}
            <div className="hidden md:flex items-center mr-4">
              <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
                   onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#F39236')}
                   onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                <MapPin className="h-3.5 w-3.5 mr-1.5 transition-colors" style={{color: '#F39236'}} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 group-hover:text-gray-600">Standort</span>
                  <span className="text-sm font-medium text-gray-700 transition-colors group-hover:text-gray-800">
                    {selectedLocation}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-1.5 transition-all duration-200 group-hover:rotate-180 group-hover:text-gray-600" />
              </div>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Favorites */}
              <Link href="/favorites" className="relative p-2 text-gray-600 hover:text-red-500 transition-all duration-200 hover:bg-red-50 rounded-lg group">
                <Heart className="h-5 w-5 group-hover:fill-red-500 transition-all duration-200" />
                {favoriteItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {favoriteItemCount}
                  </span>
                )}
              </Link>
              
              {/* Shopping Cart */}
              <Link href="/cart" className="relative p-2 text-gray-600 transition-all duration-200 rounded-lg group"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#F39236'
                      e.currentTarget.style.backgroundColor = '#F3923615'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#4b5563'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}>
                <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce"
                        style={{backgroundColor: '#F39236'}}>
                    {cartItemCount}
                  </span>
                )}
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
                        <div className="text-sm font-medium">Ahmet Y.</div>
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
                              <p className="font-medium text-gray-900">Ahmet Yılmaz</p>
                              <p className="text-sm text-gray-500">ahmet@example.com</p>
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
                            <button className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200">
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
                      className="flex items-center text-gray-600 hover:text-orange-600 font-medium transition-all duration-200 px-4 py-2 rounded-lg hover:bg-orange-50 border border-orange-200 hover:border-orange-300"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Anmelden
                    </Link>
                    <Link
                      href="/register"
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium px-6 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
      <div className={`bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 relative transition-all duration-300 ${
        isScrolled ? 'max-h-0 opacity-0 border-b-0 overflow-hidden' : 'max-h-20 opacity-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'py-0' : 'py-2'
          }`}>
            <div className="flex items-center space-x-6 text-sm overflow-visible">
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
                  className="flex items-center text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap"
                  style={{backgroundColor: '#F39236'}}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E8832B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F39236')}
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Alle Kategorien
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
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
                      {/* Sol Panel - Ana Kategoriler */}
                      <div className="w-1/3 p-4 border-r border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Hauptkategorien
                        </h3>
                        <div className="space-y-1">
                          {mainCategories.map((category, index) => (
                            <div
                              key={category.href}
                              onMouseEnter={() => {
                                setSelectedCategory(index)
                              }}
                              className={`flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer group ${
                                selectedCategory === index 
                                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className="text-xl mr-3">{category.icon}</span>
                              <div className="flex-1">
                                <span className={`text-sm font-medium transition-colors ${
                                  selectedCategory === index 
                                    ? 'text-orange-700' 
                                    : 'text-gray-700 group-hover:text-gray-800'
                                }`}>
                                  {category.name}
                                </span>
                                <div className={`text-xs mt-0.5 transition-colors ${
                                  selectedCategory === index 
                                    ? 'text-orange-600' 
                                    : 'text-gray-500'
                                }`}>
                                  {category.subcategories.length} Kategorien
                                </div>
                              </div>
                              <ChevronDown className={`h-4 w-4 transition-all duration-200 ${
                                selectedCategory === index 
                                  ? 'text-orange-500 -rotate-90' 
                                  : 'text-gray-400 -rotate-90'
                              }`} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sağ Panel - Alt Kategoriler ve Items */}
                      <div className="w-2/3 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {mainCategories[selectedCategory]?.name}
                          </h3>
                          <Link 
                            href={mainCategories[selectedCategory]?.href}
                            onClick={() => setIsCategoryMenuOpen(false)}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                          >
                            Alle anzeigen →
                          </Link>
                        </div>
                        
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          {mainCategories[selectedCategory]?.subcategories.map((subcategory, subIndex) => (
                            <div key={subcategory.href} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                              {/* Kategori Başlığı */}
                              <div className="flex items-center justify-between mb-3">
                                <Link 
                                  href={subcategory.href}
                                  onClick={() => setIsCategoryMenuOpen(false)}
                                  className="flex items-center group"
                                >
                                  <div 
                                    className="w-3 h-3 rounded-full mr-3 transition-colors"
                                    style={{backgroundColor: '#A63F35'}}
                                  ></div>
                                  <h4 
                                    className="text-sm font-semibold transition-colors group-hover:text-opacity-80"
                                    style={{color: '#A63F35'}}
                                  >
                                    {subcategory.name}
                                  </h4>
                                </Link>
                                <Link 
                                  href={subcategory.href}
                                  onClick={() => setIsCategoryMenuOpen(false)}
                                  className="text-xs font-medium transition-colors hover:text-opacity-80"
                                  style={{color: '#A63F35'}}
                                >
                                  Alle →
                                </Link>
                              </div>
                              
                              {/* Items Grid */}
                              <div className="grid grid-cols-2 gap-2 ml-6">
                                {subcategory.items.map((item) => (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsCategoryMenuOpen(false)}
                                    className="flex items-center p-2 rounded-lg transition-all duration-200 group"
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#A63F3515'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <div 
                                      className="w-1.5 h-1.5 rounded-full mr-3 transition-colors"
                                      style={{
                                        backgroundColor: '#A63F3550'
                                      }}
                                    ></div>
                                    <span 
                                      className="text-sm text-gray-700 transition-colors"
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#A63F35'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#374151'
                                      }}
                                    >
                                      {item.name}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Alt Kısım - Tüm Kategoriler Linki */}
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
                  className="flex items-center bg-gradient-to-r from-[#C74A40] to-[#A63F35] text-white px-4 py-2 rounded-lg hover:from-[#D65A4F] hover:to-[#C74A40] transition-all duration-200 font-medium whitespace-nowrap shadow-lg hover:shadow-xl"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Alle Marken
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${isBrandMenuOpen ? 'rotate-180' : ''}`} />
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
                      <div className="grid grid-cols-3 gap-2">
                        {popularBrands.map((brand) => (
                          <Link
                            key={brand.href}
                            href={brand.href}
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

              <Link href="/new-products" className="flex items-center text-green-600 hover:text-green-700 font-medium whitespace-nowrap">
                <Zap className="h-4 w-4 mr-1" />
                Neue Produkte
              </Link>
              <Link href="/bestsellers" className="flex items-center text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap">
                <Star className="h-4 w-4 mr-1" />
                Bestseller
              </Link>
              <Link href="/coupons" className="flex items-center text-red-600 hover:text-red-700 font-medium whitespace-nowrap">
                <Tag className="h-4 w-4 mr-1" />
                Rabattierte Produkte
              </Link>
              <Link href="/discounted" className="flex items-center text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap">
                <Gift className="h-4 w-4 mr-1" />
                Kampagnen
              </Link>
            </div>
            <div className="hidden md:flex items-center text-xs text-gray-500">
              <Truck className="h-4 w-4 mr-1" />
              <span>Ab 100 CHF <strong>versandkostenfrei</strong></span>
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
              <div className="grid grid-cols-1 gap-3">
                {mainCategories.slice(0, 3).map((category) => (
                  <div key={category.href} className="bg-gray-50 rounded-lg p-3">
                    <Link
                      href={category.href}
                      className="flex items-center mb-2 hover:text-orange-600 transition-colors"
                    >
                      <span className="text-lg mr-2">{category.icon}</span>
                      <span className="text-sm font-medium text-gray-800">{category.name}</span>
                    </Link>
                    <div className="ml-6 space-y-1">
                      {category.subcategories.slice(0, 2).map((subcategory) => (
                        <div key={subcategory.href} className="border-l-2 border-gray-200 pl-3">
                          <Link
                            href={subcategory.href}
                            className="text-xs text-gray-700 hover:text-blue-600 font-medium transition-colors block mb-1"
                          >
                            {subcategory.name}
                          </Link>
                          <div className="grid grid-cols-2 gap-1">
                            {subcategory.items.slice(0, 4).map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="text-xs text-gray-500 hover:text-blue-600 py-0.5 transition-colors"
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Beliebte Marken</h3>
              <div className="grid grid-cols-2 gap-2">
                {popularBrands.slice(0, 6).map((brand) => (
                  <Link
                    key={brand.href}
                    href={brand.href}
                    className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gradient-to-r hover:from-[#C74A40]/10 hover:to-[#A63F35]/10 transition-all duration-200"
                  >
                    <div className="w-1.5 h-1.5 bg-[#C74A40] rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">{brand.name}</span>
                  </Link>
                ))}
              </div>
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