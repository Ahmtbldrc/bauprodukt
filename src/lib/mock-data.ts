import { Brand, Category, Product } from '@/types/product'

export const mockBrands: Brand[] = [
  {
    id: '1',
    name: 'Bosch',
    slug: 'bosch',
    description: 'Deutsche Qualitätsmarke für Elektrowerkzeuge und Haushaltsgeräte',
    logo: '/brands/bosch-logo.png'
  },
  {
    id: '2', 
    name: 'Makita',
    slug: 'makita',
    description: 'Professionelle Elektrowerkzeuge und Gartengeräte',
    logo: '/brands/makita-logo.png'
  },
  {
    id: '3',
    name: 'DeWalt', 
    slug: 'dewalt',
    description: 'Industrielle Qualität Handwerkzeuge und Power Tools',
    logo: '/brands/dewalt-logo.png'
  },
  {
    id: '4',
    name: 'Karcher',
    slug: 'karcher',
    description: 'Reinigungsmaschinen und Hochdruckreinigungssysteme',
    logo: '/brands/karcher-logo.png'
  },
  {
    id: '5',
    name: 'Hilti',
    slug: 'hilti',
    description: 'Professionelle Werkzeuge für die Bauindustrie',
    logo: '/brands/hilti-logo.png'
  }
]

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Elektrowerkzeuge',
    slug: 'elektrowerkzeuge',
    description: 'Bohrmaschinen, Sägen, Schleifmaschinen und andere Elektrowerkzeuge',
    image: '/categories/elektrikli-aletler.jpg'
  },
  {
    id: '2',
    name: 'Handwerkzeuge',
    slug: 'handwerkzeuge', 
    description: 'Schraubendreher, Zangen, Schlüsselsätze und Handwerkzeuge',
    image: '/categories/el-aletleri.jpg'
  },
  {
    id: '3',
    name: 'Gartengeräte',
    slug: 'gartengeraete',
    description: 'Rasenmäher, Heckenscheren, Gartenpflegegeräte',
    image: '/categories/bahce-aletleri.jpg'
  },
  {
    id: '4',
    name: 'Reinigungsmaschinen',
    slug: 'reinigungsmaschinen',
    description: 'Staubsauger, Hochdruckreiniger, Reinigungsausrüstung',
    image: '/categories/temizlik-makineleri.jpg'
  },
  {
    id: '5',
    name: 'Messgeräte',
    slug: 'messgeraete',
    description: 'Lasermessgeräte, Wasserwaagen, Entfernungsmesser',
    image: '/categories/olcum-aletleri.jpg'
  }
]

export const mockProducts: Product[] = [
  // Bosch Products
  {
    id: '1',
    name: 'Bosch Professional GSB 120-LI Akku-Bohrschrauber',
    slug: 'gsb-120-li-akku-bohrschrauber',
    description: '12V Akku-Bohrschrauber für professionelle Anwendung. Kompaktes Design, kraftvoller Motor.',
    price: 1299,
    image: '/products/bosch-gsb-120-li.jpg',
    brand: mockBrands[0], // Bosch
    category: mockCategories[0], // Elektrowerkzeuge
    inStock: true,
    featured: true,
    bestseller: true
  },
  {
    id: '2',
    name: 'Bosch Professional GWS 7-115 Winkelschleifer',
    slug: 'gws-7-115-winkelschleifer',
    description: '115mm Winkelschleifer, 720W Motorleistung, mit Sicherheitsfeatures.',
    price: 899,
    originalPrice: 1199,
    image: '/products/bosch-gws-7-115.jpg',
    brand: mockBrands[0], // Bosch
    category: mockCategories[0], // Elektrowerkzeuge
    inStock: true,
    featured: false,
    onSale: true,
    discountPercentage: 25
  },
  {
    id: '3',
    name: 'Bosch Professional 34-teiliges Schraubendreher-Set',
    slug: 'professional-34-teiliges-schraubendreher-set',
    description: '34-teiliges Schraubendreher- und Bit-Set in Stahlqualität. Für professionelle Anwendung.',
    price: 299,
    image: '/products/bosch-tornavida-seti.jpg',
    brand: mockBrands[0], // Bosch
    category: mockCategories[1], // Handwerkzeuge
    inStock: true,
    featured: false
  },

  // Makita Products
  {
    id: '4',
    name: 'Makita DLM431Z Akku-Rasenmäher',
    slug: 'dlm431z-akku-rasenmaeher',
    description: '18V x 2 Akku-Rasenmäher, 43cm Schnittbreite, leiser Betrieb.',
    price: 3999,
    image: '/products/makita-dlm431z.jpg',
    brand: mockBrands[1], // Makita
    category: mockCategories[2], // Gartengeräte
    inStock: true,
    featured: true,
    bestseller: true
  },
  {
    id: '5',
    name: 'Makita DHP453Z Akku-Schlagbohrschrauber',
    slug: 'dhp453z-akku-schlagbohrschrauber',
    description: '18V Li-ion Akku-Schlagbohrschrauber. 2-Gang-Getriebe.',
    price: 899,
    image: '/products/makita-dhp453z.jpg',
    brand: mockBrands[1], // Makita
    category: mockCategories[0], // Elektrowerkzeuge
    inStock: false,
    featured: false
  },
  {
    id: '6',
    name: 'Makita P-90227 216-teiliges Werkzeug-Set',
    slug: 'p90227-216-teiliges-werkzeug-set',
    description: 'Umfassendes 216-teiliges Handwerkzeug-Set. In Metallkoffer, für Heim und Beruf.',
    price: 1599,
    originalPrice: 1999,
    image: '/products/makita-alet-seti.jpg',
    brand: mockBrands[1], // Makita
    category: mockCategories[1], // Handwerkzeuge
    inStock: true,
    featured: false,
    onSale: true,
    discountPercentage: 20
  },

  // DeWalt Products
  {
    id: '7',
    name: 'DeWalt DCD796D2 Akku-Schlagbohrschrauber',
    slug: 'dcd796d2-akku-schlagbohrschrauber',
    description: '18V XR Li-Ion Akku-Schlagbohrschrauber. Bürstenloser Motor, 2.0Ah Akku inklusive.',
    price: 2199,
    image: '/products/dewalt-dcd796d2.jpg',
    brand: mockBrands[2], // DeWalt
    category: mockCategories[0], // Elektrowerkzeuge
    inStock: true,
    featured: true,
    bestseller: true
  },
  {
    id: '8',
    name: 'DeWalt DWMT72165 Mechaniker Werkzeug-Set',
    slug: 'dwmt72165-mechaniker-werkzeug-set',
    description: '168-teiliges professionelles Mechaniker Werkzeug-Set. Chrom-Vanadium Stahl.',
    price: 3299,
    image: '/products/dewalt-mechanic-set.jpg',
    brand: mockBrands[2], // DeWalt
    category: mockCategories[1], // Handwerkzeuge
    inStock: true,
    featured: false
  },

  // Karcher Products
  {
    id: '9',
    name: 'Kärcher K2 Compact Hochdruckreiniger',
    slug: 'k2-compact-hochdruckreiniger',
    description: 'Kompakter Hochdruckreiniger, 110 bar Druck, ideal für den Hausgebrauch.',
    price: 1799,
    originalPrice: 2299,
    image: '/products/karcher-k2-compact.jpg',
    brand: mockBrands[3], // Karcher
    category: mockCategories[3], // Reinigungsmaschinen
    inStock: true,
    featured: true,
    onSale: true,
    discountPercentage: 22
  },
  {
    id: '10',
    name: 'Kärcher WD3 Nass-/Trockensauger',
    slug: 'wd3-nass-trockensauger',
    description: '17L Kapazität Nass-/Trockensauger. Starke Saugleistung.',
    price: 1299,
    image: '/products/karcher-wd3.jpg',
    brand: mockBrands[3], // Karcher
    category: mockCategories[3], // Reinigungsmaschinen
    inStock: true,
    featured: false
  },

  // Hilti Products
  {
    id: '11',
    name: 'Hilti PD-I Laser-Entfernungsmesser',
    slug: 'pd-i-laser-entfernungsmesser',
    description: '100m Reichweite Laser-Entfernungsmesser. IP54 wasserdicht, ±1mm Genauigkeit.',
    price: 899,
    originalPrice: 1199,
    image: '/products/hilti-pd-i.jpg',
    brand: mockBrands[4], // Hilti
    category: mockCategories[4], // Messgeräte
    inStock: true,
    featured: false,
    onSale: true,
    discountPercentage: 25
  },
  {
    id: '12',
    name: 'Hilti PR 30-HVS Rotationslaser',
    slug: 'pr30-hvs-rotationslaser',
    description: 'Rotationslaser-System für horizontale und vertikale Ausrichtung. 300m Arbeitsbereich.',
    price: 15999,
    image: '/products/hilti-pr30-hvs.jpg',
    brand: mockBrands[4], // Hilti
    category: mockCategories[4], // Messgeräte
    inStock: true,
    featured: true,
    bestseller: true
  }
]

// Helper functions to get data
export function getBrandBySlug(slug: string): Brand | undefined {
  return mockBrands.find(brand => brand.slug === slug)
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return mockCategories.find(category => category.slug === slug)
}

export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find(product => product.slug === slug)
}

export function getProductsByBrand(brandSlug: string): Product[] {
  return mockProducts.filter(product => product.brand.slug === brandSlug)
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return mockProducts.filter(product => product.category.slug === categorySlug)
}

export function getProductByBrandCategorySlug(brandSlug: string, categorySlug: string, productSlug: string): Product | undefined {
  return mockProducts.find(product => 
    product.brand.slug === brandSlug && 
    product.category.slug === categorySlug && 
    product.slug === productSlug
  )
}

export function getFeaturedProducts(): Product[] {
  return mockProducts.filter(product => product.featured)
}

export function getInStockProducts(): Product[] {
  return mockProducts.filter(product => product.inStock)
}

export function getBestsellerProducts(): Product[] {
  return mockProducts.filter(product => product.bestseller)
}

export function getDiscountedProducts(): Product[] {
  return mockProducts.filter(product => product.onSale)
}

export function getRecommendedProducts(): Product[] {
  // Mix of featured and high-rated products
  return mockProducts.filter(product => product.featured || product.bestseller).slice(0, 4)
} 