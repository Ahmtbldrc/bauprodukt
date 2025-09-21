"use client"

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function CalculatorPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Kalkulator</h1>
            <p className="text-gray-600 mt-2">Berechnungen für Produkte, Mengen und Maße. Wir bauen dies Schritt für Schritt aus.</p>
          </div>
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 bg-white">
            Diese Seite ist in Vorbereitung. Gemeinsam werden wir hier die gewünschte Funktionalität implementieren.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


