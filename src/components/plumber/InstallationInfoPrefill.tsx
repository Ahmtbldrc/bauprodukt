'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'

type ProtocolStoredData = {
  firstName?: string
  lastName?: string
  address?: string
  postalCode?: string
  city?: string
  phone?: string
  email?: string
  parcelNumber?: string
  building?: string
}

const STORAGE_KEY = 'bauprodukt_protocol_form_v1'

export function InstallationInfoPrefill() {
  const searchParams = useSearchParams()
  const from = searchParams?.get('from')

  const [data, setData] = React.useState<ProtocolStoredData | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (from !== 'protocol') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as ProtocolStoredData
      setData(parsed)
    } catch {
      // ignore
    }
  }, [from])

  const showPrefill = from === 'protocol' && !!data

  return (
    <div>
      {/* Section 1 heading (only when coming from protocol) */}
      {showPrefill && (
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Service Public</h2>
          <p className="text-gray-600">Bestimmung Belastungswerte, Spitzendurchfluss und Wasserzähler</p>
        </div>
      )}

      {showPrefill && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          {/* 4 sütunlu düzen */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 1. Sütun - Einbauort des Messgerätes */}
        <div className="md:col-span-3">
          <div className="text-sm font-medium text-gray-900 mb-2">Einbauort des Messgerätes</div>
          <div className="space-y-4">
            <input type="text" defaultValue={data.city || ''} placeholder="Gemeinde Thusis" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" defaultValue={data.address || ''} placeholder="Strasse" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" placeholder="Strassen Nr." className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" inputMode="numeric" defaultValue={data.postalCode || ''} placeholder="PLZ" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" defaultValue={data.city || ''} placeholder="Ort" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
          </div>
        </div>

        {/* 2. Sütun - Gebäude / Parz. Nr. + Objekt-Bezeichnung */}
        <div className="md:col-span-3">
          <div className="flex items-end gap-4 mb-2">
            <div className="w-32">
              <div className="text-sm font-medium text-gray-900 mb-2">Gebäude</div>
              <input type="text" defaultValue={data.building || ''} placeholder="Gebäude" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div className="w-32">
              <div className="text-sm font-medium text-gray-900 mb-2">Parz. Nr.</div>
              <input type="text" defaultValue={data.parcelNumber || ''} placeholder="Parz. Nr." className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-900 mb-2">Objekt-Bezeichnung</div>
            <input type="text" placeholder="Truppenunterkunft Pantunweg 8-12" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
          </div>
        </div>

        {/* 3. Sütun - Eigentümer */}
        <div className="md:col-span-3">
          <div className="text-sm font-medium text-gray-900 mb-2">Eigentümer (falls abweichend)</div>
          <div className="space-y-4">
            <input type="text" placeholder="Gemeinde Thusis" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" placeholder="Strasse" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" placeholder="Strassen Nr." className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" placeholder="PLZ" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" placeholder="Ort" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
          </div>
        </div>

        {/* 4. Sütun - Verwaltung */}
        <div className="md:col-span-3">
          <div className="text-sm font-medium text-gray-900 mb-2">Verwaltung (falls abweichend)</div>
          <div className="space-y-4">
            <input type="text" placeholder="Gemeinde Thusis" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" placeholder="Strasse" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" placeholder="Strassen Nr." className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" placeholder="PLZ" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            <input type="text" placeholder="Ort" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
          </div>
        </div>
          </div>
        </div>
      )}

      {/* Section 2 - Always visible */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
        {/* Section 2 heading */}
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Rohrweitenbestimmung vereinfachte Methode mit Belastungswerttabellen</h3>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs md:text-sm">1 Belastungswert (Loading Unit - LU) = 0.1 l/s</span>
        </div>

        {/* Fixtures Section - 4 columns with collapsible content */}
        <FixturesSection />
      </div>
    </div>
  )
}

export default InstallationInfoPrefill

// ---- Fixtures (4 columns) ----
type FixtureItem = { id: string; name: string }

const SANITAER_ITEMS: FixtureItem[] = [
  { id: 'wc', name: 'WC-Spülkasten' },
  { id: 'waschtisch', name: 'Waschtisch' },
  { id: 'dusche', name: 'Dusche' },
  { id: 'badewanne', name: 'Badewanne' },
  { id: 'bidet', name: 'Bidet' },
  { id: 'urinoir', name: 'Urinoir Spülung automatisch' },
]

const AUSSEN_ITEMS: FixtureItem[] = [
  { id: 'balkon', name: 'Entnahmearmatur für Balkon' },
  { id: 'garten', name: 'Entnahmearmatur Garten und Garage' },
  { id: 'waschrinne', name: 'Waschrinne' },
  { id: 'waschtrog', name: 'Waschtrog' },
]

const GEWERBE_ITEMS: FixtureItem[] = [
  { id: 'automat', name: 'Getränkeautomat' },
  { id: 'coiffeur', name: 'Coiffeurbrause' },
]

const SICHERHEIT_ITEMS: FixtureItem[] = [
  { id: 'hydrant', name: 'Wasserlöschposten' },
]

function FixturesSection() {
  const [open, setOpen] = React.useState<{ [k: string]: boolean }>({
    s1: true,
    s2: true,
    s3: true,
    s4: true,
  })
  const [counts, setCounts] = React.useState<Record<string, number>>({})
  const [method, setMethod] = React.useState<'m1' | 'm2'>('m1')

  const inc = (id: string) => setCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  const dec = (id: string) =>
    setCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }))

  const Column: React.FC<{
    title: string
    panelKey: string
    items: FixtureItem[]
  }> = ({ title, panelKey, items }) => (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => ({ ...o, [panelKey]: !o[panelKey] }))}
        className="w-full flex items-center justify-between rounded-xl border border-gray-300 px-4 py-3 text-left"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 transition-transform ${open[panelKey] ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open[panelKey] && (
        <div className="mt-3 space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
              <div className="text-sm text-gray-900">{item.name}</div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => dec(item.id)} className="h-7 w-7 rounded-md border border-gray-300 text-gray-600">
                  −
                </button>
                <div className="min-w-[2rem] text-center text-sm text-gray-900">{counts[item.id] || 0}</div>
                <button type="button" onClick={() => inc(item.id)} className="h-7 w-7 rounded-md border border-gray-300 text-gray-600">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Column title="Sanitär - Bad / WC" panelKey="s1" items={SANITAER_ITEMS} />
        <Column title="Aussen / Sonstige Entnahmen" panelKey="s2" items={AUSSEN_ITEMS} />
        <Column title="Gewerblich / Spezial" panelKey="s3" items={GEWERBE_ITEMS} />
        <Column title="Sicherheit" panelKey="s4" items={SICHERHEIT_ITEMS} />
      </div>

      {/* Checkboxes row */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#F39236]"
            checked={method === 'm1'}
            onChange={() => setMethod('m1')}
          />
          <span className="text-sm text-gray-800">Methode 1 (0.3 l/s bis 300 l/s)</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#F39236]"
            checked={method === 'm2'}
            onChange={() => setMethod('m2')}
          />
          <span className="text-sm text-gray-800">Methode 2 (0.5 l/s bis 15 l/s)</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#F39236]"
            checked={(counts['hydrant'] || 0) > 0}
            onChange={() => {}}
            disabled
          />
          <span className="text-sm text-gray-800">Wasserlöschposten (Zusatz)</span>
        </label>
      </div>
    </div>
  )
}


