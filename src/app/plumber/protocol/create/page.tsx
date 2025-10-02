"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

export default function ProtocolCreatePage() {
  const router = useRouter()
  const [agree, setAgree] = React.useState(false)
  const [prefill, setPrefill] = React.useState<any | null>(null)

  const STORAGE_KEY = 'bauprodukt_protocol_form_v1'

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      setPrefill(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: integrate with backend / generation flow
    alert('Protokoll wurde vorbereitet (Demo).')
  }

  return (
    <div className="w-full mr-auto">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">Austauschprotokoll für einen Wasserzähler</h1>
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
        {/* Einbauort des Messgerätes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm font-medium text-gray-900">Einbauort des Messgerätes</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-12">
              <label className="sr-only">Name *</label>
              <input
                type="text"
                placeholder="Name *"
                defaultValue={`${prefill?.firstName ?? ''}${prefill?.lastName ? ` ${prefill?.lastName}` : ''}`}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-6">
              <label className="sr-only">Strasse / Nr. *</label>
              <input
                type="text"
                placeholder="Strasse / Nr. *"
                defaultValue={prefill?.address ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-6">
              <label className="sr-only">Zusatz *</label>
              <input
                type="text"
                placeholder="Zusatz *"
                defaultValue={[prefill?.parcelNumber, prefill?.building].filter(Boolean).join(', ')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-3">
              <label className="sr-only">PLZ *</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="PLZ *"
                defaultValue={prefill?.postalCode ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-3">
              <label className="sr-only">Ort *</label>
              <input
                type="text"
                placeholder="Ort *"
                defaultValue={prefill?.city ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-3">
              <label className="sr-only">Telefon *</label>
              <input
                type="tel"
                placeholder="Telefon *"
                defaultValue={prefill?.phone ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-3">
              <label className="sr-only">E‑Mail *</label>
              <input
                type="email"
                placeholder="E‑Mail *"
                defaultValue={prefill?.email ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
          </div>
        </div>

        {/* Messgerätedaten / Einbausituation – altes Messgerät (nur bei Austausch) */}
        {prefill?.meterAction === 'exchange' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm font-medium text-gray-900">Messgerätedaten / Einbausituation</div>
            <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200">Altes Messgerät</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input type="text" placeholder="Hersteller *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Zähler‑Nr. *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Einbaulänge *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Zählerstand in m³" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Dimension *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Dauerdurchfluss in m³/h" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Einlaufstrecke *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
              <input type="text" placeholder="1 ½" className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Auslaufstrecke *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
              <input type="text" placeholder="1 ½" className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Einbauort *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Einbauort" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Jahrgang *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Ausbaudatum" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
          </div>
        </div>
        )}

        {/* Messgerätedaten / Einbausituation – neues Messgerät (immer sichtbar) */}
        {
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm font-medium text-gray-900">Messgerätedaten / Einbausituation</div>
            <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Neues Messgerät</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input type="text" placeholder="Hersteller *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Zähler‑Nr. *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Einbaulänge *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Zählerstand in m³" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Dimension *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Dauerdurchfluss in m³/h" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Einlaufstrecke *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
              <input type="text" placeholder="1 ½" className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Auslaufstrecke *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
              <input type="text" placeholder="1 ½" className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Einbauort *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Einbauort" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Jahrgang *" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" placeholder="Ausbaudatum" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
          </div>
        </div>
        }

        {/* Bemerkung */}
        <div>
          <label className="sr-only">Bemerkung</label>
          <textarea placeholder="Eine Bemerkung verfassen..." className="w-full min-h-[96px] rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
        </div>

        {/* Agree + Submit */}
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>Mit dem Setzen dieses Häkchens bestätige ich die Richtigkeit meiner Angaben. Diese Bestätigung gilt als meine Unterschrift.</span>
          </label>
          <div className="pt-1">
            <button
              type="submit"
              disabled={!agree}
              className="w-full px-5 py-2.5 rounded-lg text-white text-base font-medium shadow-sm disabled:opacity-60"
              style={{ backgroundColor: '#4b4b4b' }}
            >
              Protokoll an die Gemeinde versenden
            </button>
          </div>
          <div className="pt-1">
            <button
              type="button"
              className="w-full px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => router.push('/plumber/calculator')}
            >
              Zurück zum Rechner
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

