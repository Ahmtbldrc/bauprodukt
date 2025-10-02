"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

export default function ProtocolConvertPage() {
  const router = useRouter()

  return (
    <div className="w-full mr-auto">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">Protokoll – Umwandlung</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
        <p className="text-gray-700 mb-4">
          Diese Seite dient zur Umwandlung eines gespeicherten Ergebnisses in ein Protokoll. Du kannst mir hier birazdan içerik detaylarını ileteceksin.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => router.push('/plumber/calculator')}
          >
            Zurück zum Rechner
          </button>
          <button
            type="button"
            className="px-5 py-2.5 rounded-lg text-white font-medium shadow-sm hover:opacity-95 transition"
            style={{ backgroundColor: '#F39236' }}
            onClick={() => alert('Hier wird später die Umwandlung ausgelöst.')}>
            Umwandlung starten
          </button>
        </div>
      </div>
    </div>
  )
}
