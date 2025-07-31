# Bauprodukt - Stil Rehberi

## 1. Kullanılan Fontlar

- **Geist Sans**: Ana metin fontu (Google Fonts üzerinden, Next.js font API ile)
- **Geist Mono**: Kod ve teknik metinler için
- **Arial, sans-serif**: Fallback olarak bazı özel durumlarda

---

## 2. Kullanılan Renkler

### Ana Marka Renkleri
- **#F39236** — Ana turuncu (butonlar, fiyatlar, vurgular, linkler)
- **#E8832B** — Turuncu hover
- **#FDF5E6** — Açık turuncu arka plan
- **#F3923620** — Turuncu transparan (15% opacity)
- **#F3923625** — Turuncu transparan (25% opacity)

### Kırmızı Renkler
- **#dc2626** — Koyu kırmızı (gradient)
- **#C74A40** — Kırmızı ton (header menü)
- **#A63F35** — Koyu kırmızı ton (header menü)
- **#D65A4F** — Açık kırmızı hover
- **red-50, red-100, red-200, red-500, red-600, red-700, red-800** — Tailwind kırmızı tonları

### Yeşil Renkler
- **green-50, green-100, green-500, green-600, green-800** — Tailwind yeşil tonları

### Mavi Renkler
- **blue-50, blue-100, blue-200, blue-300, blue-500, blue-600, blue-700** — Tailwind mavi tonları

### Sarı/Turuncu Renkler
- **yellow-50, yellow-100, yellow-200, yellow-500, yellow-600, yellow-700, yellow-800** — Tailwind sarı tonları
- **orange-50, orange-500, orange-600** — Tailwind turuncu tonları

### Gri ve Nötr Renkler
- **#eeeeee** — Admin panel arka plan
- **gray-50, gray-100, gray-200, gray-300, gray-400, gray-500, gray-600, gray-700, gray-800, gray-900** — Tailwind gri tonları

### Beyaz ve Şeffaf
- **#ffffff, white, transparent**

### Gradientler
- **from-orange-50 via-white to-red-50** — Login/Register arka planı
- **from-[#C74A40] to-[#A63F35]** — Kırmızı gradient (header menü)
- **from-[#F39236] to-[#dc2626]** — Turuncu-kırmızı gradient (avatar)
- **from-gray-50 to-gray-100** — Gri gradient (lokasyon seçici)
- **from-blue-50 to-green-50** — Mavi-yeşil gradient (yeni ürünler)

---

## 3. Kullanılan İkonlar

### Kütüphaneler
- **lucide-react** (ana ikon kütüphanesi)
- **@heroicons/react** (sadece HeroBanner ok ikonları için)

### Sık Kullanılan İkonlar
- **ShoppingCart, ShoppingBag, Minus, Plus, Trash2** — Sepet ve alışveriş
- **Heart** — Favoriler
- **User, Eye, EyeOff** — Kullanıcı ve şifre alanları
- **Mail, Phone, Bell** — İletişim ve bildirim
- **MapPin, ChevronDown, ChevronUp, ArrowLeft** — Navigasyon
- **Search, Menu, X** — Arama ve menü
- **LayoutDashboard, Tags, FolderTree, Package, Users, Home, Image, Star, MessageCircle, BarChart3, HelpCircle, Settings** — Admin panel
- **Lock, Check, CheckCircle, Loader2** — Form ve güvenlik
- **Truck, Clock, Gift** — Teslimat ve hizmet
- **Star, Tag, Zap** — Değerlendirme ve özellikler

### İkon Template'leri
- Standart boyutlar: `h-4 w-4`, `h-5 w-5`, `h-6 w-6`, `w-5 h-5`
- Renkler: `text-gray-400`, `text-orange-500`, `text-red-500`, `text-blue-500`, `text-green-500`, `style={{color: '#F39236'}}`
- Hover efektleri: `hover:text-red-500`, `hover:text-orange-500`, `hover:fill-red-500`, `group-hover:scale-110`, `group-hover:rotate-180`
- Animasyonlar: `animate-spin`, `animate-bounce`, `transition-all duration-200`
- Badge: Sepet, favori, bildirim için yuvarlak arka planlı küçük ikonlar

---

Bu rehber, Bauprodukt projesinde kullanılan temel stil, renk, font ve ikon sistemini özetler. Modern ve tutarlı bir kullanıcı deneyimi için bu standartlara sadık kalınmalıdır. 