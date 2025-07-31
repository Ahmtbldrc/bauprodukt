# Bauprodukt - Style Guide (Deutsch)

## 1. Verwendete Schriftarten

- **Geist Sans**: Hauptschriftart für Fließtext (über Google Fonts, Next.js Font API)
- **Geist Mono**: Für Code und technische Texte
- **Arial, sans-serif**: Fallback in speziellen Fällen

---

## 2. Verwendete Farben

### Hauptmarkenfarben
- **#F39236** — Haupt-Orange (Buttons, Preise, Hervorhebungen, Links)
- **#E8832B** — Orange Hover
- **#FDF5E6** — Helles Orange als Hintergrund
- **#F3923620** — Transparentes Orange (15% Deckkraft)
- **#F3923625** — Transparentes Orange (25% Deckkraft)

### Rottöne
- **#dc2626** — Dunkelrot (Gradient)
- **#C74A40** — Rotton (Header-Menü)
- **#A63F35** — Dunkler Rotton (Header-Menü)
- **#D65A4F** — Helles Rot für Hover
- **red-50, red-100, red-200, red-500, red-600, red-700, red-800** — Tailwind-Rottöne

### Grüntöne
- **green-50, green-100, green-500, green-600, green-800** — Tailwind-Grüntöne

### Blautöne
- **blue-50, blue-100, blue-200, blue-300, blue-500, blue-600, blue-700** — Tailwind-Blautöne

### Gelb-/Orangetöne
- **yellow-50, yellow-100, yellow-200, yellow-500, yellow-600, yellow-700, yellow-800** — Tailwind-Gelbtöne
- **orange-50, orange-500, orange-600** — Tailwind-Orangetöne

### Grautöne & Neutrale Farben
- **#eeeeee** — Hintergrund im Admin-Panel
- **gray-50, gray-100, gray-200, gray-300, gray-400, gray-500, gray-600, gray-700, gray-800, gray-900** — Tailwind-Grautöne

### Weiß & Transparent
- **#ffffff, white, transparent**

### Farbverläufe (Gradients)
- **from-orange-50 via-white to-red-50** — Hintergrund Login/Registrierung
- **from-[#C74A40] to-[#A63F35]** — Roter Gradient (Header-Menü)
- **from-[#F39236] to-[#dc2626]** — Orange-Rot Gradient (Avatar)
- **from-gray-50 to-gray-100** — Grauer Gradient (Standortauswahl)
- **from-blue-50 to-green-50** — Blau-Grün Gradient (Neue Produkte)

---

## 3. Verwendete Icons

### Bibliotheken
- **lucide-react** (Haupt-Icon-Bibliothek)
- **@heroicons/react** (nur für Pfeile im HeroBanner)

### Häufig verwendete Icons
- **ShoppingCart, ShoppingBag, Minus, Plus, Trash2** — Warenkorb und Einkauf
- **Heart** — Favoriten
- **User, Eye, EyeOff** — Benutzer und Passwortfelder
- **Mail, Phone, Bell** — Kontakt und Benachrichtigung
- **MapPin, ChevronDown, ChevronUp, ArrowLeft** — Navigation
- **Search, Menu, X** — Suche und Menü
- **LayoutDashboard, Tags, FolderTree, Package, Users, Home, Image, Star, MessageCircle, BarChart3, HelpCircle, Settings** — Admin-Panel
- **Lock, Check, CheckCircle, Loader2** — Formulare und Sicherheit
- **Truck, Clock, Gift** — Lieferung und Service
- **Star, Tag, Zap** — Bewertung und Features

### Icon-Templates
- Standardgrößen: `h-4 w-4`, `h-5 w-5`, `h-6 w-6`, `w-5 h-5`
- Farben: `text-gray-400`, `text-orange-500`, `text-red-500`, `text-blue-500`, `text-green-500`, `style={{color: '#F39236'}}`
- Hover-Effekte: `hover:text-red-500`, `hover:text-orange-500`, `hover:fill-red-500`, `group-hover:scale-110`, `group-hover:rotate-180`
- Animationen: `animate-spin`, `animate-bounce`, `transition-all duration-200`
- Badge: Kleine runde Icons für Warenkorb, Favoriten, Benachrichtigungen

---

Dieser Guide fasst die grundlegenden Styles, Farben, Schriftarten und Icon-Systeme des Bauprodukt-Projekts zusammen. Für ein modernes und konsistentes Nutzererlebnis sollten diese Standards eingehalten werden. 