"use client"

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
 

export default function CalculatorPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-0 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero with SVG background */}
          <div className="relative overflow-hidden py-16 lg:py-28 min-h-[720px]">
            <div 
              className="absolute inset-0 -z-10"
              style={{
                backgroundImage: "url('/Background-pattern.svg')",
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Left - Text & Actions */}
              <div className="pt-16 pb-8 lg:pt-24">
                <h1 className="text-5xl font-medium text-gray-900 tracking-tight">Rechner</h1>
                <p className="text-gray-600 mt-4 max-w-xl text-lg whitespace-pre-line">
                  {`Der Rechner unterstützt bei der Berechnung von
Belastungswerten (LU), Spitzendurchfluss
(QD,QT) und ermittelt den passenden 
Wasserzähler.`}
                </p>

                <div className="mt-6 flex items-center gap-8">
                  <button
                    className="px-5 py-2.5 rounded-lg text-white font-medium shadow-sm hover:opacity-95 transition flex items-center"
                    style={{ backgroundColor: '#F39236' }}
                    onClick={() => router.push('/plumber/calculator')}
                  >
                    Rechner starten
                    <span className="ml-2 inline-flex items-center relative group">
                      <HelpCircle className="h-4 w-4 text-white/90 align-middle" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black/80 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none">
                        Nur Berechnung ohne Speicherung
                      </span>
                    </span>
                  </button>
                  <button
                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium bg-white hover:bg-gray-50 transition flex items-center"
                    onClick={() => router.push('/plumber/protocol')}
                  >
                    Rechner mit Protokoll
                    <span className="ml-2 inline-flex items-center relative group">
                      <HelpCircle className="h-4 w-4 text-gray-600 align-middle" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black/80 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none">
                        Berechnung wird gespeichert, PDF-Protokoll möglich
                      </span>
                    </span>
                  </button>
                </div>

              </div>

              {/* Right - Preview Panel */}
              <div className="relative">
                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl p-5 lg:p-8">
                  <div className="aspect-[16/10] bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400">
                    Vorschau kommt hier
                  </div>
                </div>
              </div>
            </div>
          </div>

          
        </div>
      </main>
      <Footer />
    </div>
  )
}


