import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/Bauprodukt-Logo.svg"
                alt="Bauprodukt"
                width={280}
                height={90}
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: '#A3A3A3' }}>
              Hochwertige Bauprodukte und Materialien für professionelle Projekte. 
              Vertrauen Sie auf unsere Expertise und moderne E-Commerce-Lösungen.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="text-sm" style={{ color: '#A3A3A3' }}>
                +41 (0) 81 123 45 67
              </div>
              <div className="text-sm" style={{ color: '#A3A3A3' }}>
                info@bauprodukt.ch
              </div>
              <div className="text-sm" style={{ color: '#A3A3A3' }}>
                Bauron GmbH<br />
                Neudorfstrasse 23<br />
                7430 Thusis
              </div>
            </div>
          </div>
          
          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Produkte</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Alle Produkte
                </Link>
              </li>
              <li>
                <Link href="/brands" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Marken
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Kategorien
                </Link>
              </li>
              <li>
                <Link href="/products?filter=bestsellers" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Bestseller
                </Link>
              </li>
              <li>
                <Link href="/products?filter=sale" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Angebote
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Unternehmen</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Karriere
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  News
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Kundenservice</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Hilfe & FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Versand & Lieferung
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Rückgabe
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Garantie
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter Section */}
        {/*
        <div className="bg-card border border-border rounded-2xl p-8 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Newsletter abonnieren
              </h3>
              <p className="text-muted-foreground">
                Erhalten Sie exklusive Angebote und Neuigkeiten direkt in Ihr Postfach.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Ihre E-Mail-Adresse"
                className="flex-1 px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <button
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Abonnieren
              </button>
            </div>
          </div>
        </div>
        */}
        
        {/* Bottom Section */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm">
              <Link href="/privacy" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                Datenschutz & Impressum
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                AGB&apos;s
              </Link>
              <Link href="/cookies" className="hover:text-primary transition-colors" style={{ color: '#A3A3A3' }}>
                Cookie-Richtlinien
              </Link>
            </div>
            
            {/* Copyright */}
            <div className="text-center lg:text-right">
              <p className="text-sm" style={{ color: '#A3A3A3' }}>
                © 2025 Bauron GmbH | Alle Rechte vorbehalten
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 