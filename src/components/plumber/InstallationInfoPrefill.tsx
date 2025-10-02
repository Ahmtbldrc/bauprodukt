'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { HelpCircle } from 'lucide-react'
import {
  AUSSEN_ITEMS,
  FixtureItem,
  GEWERBE_ITEMS,
  SANITAER_ITEMS,
} from '@/lib/plumber-fixtures'
import {
  PlumberCalculationResult,
  calculatePlumberValues,
} from '@/lib/plumber-calculation'

type PartyInfo = {
  firstName?: string
  lastName?: string
  address?: string
  postalCode?: string
  city?: string
  phone?: string
  email?: string
}

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
  ownerDifferent?: boolean
  managementDifferent?: boolean
  ownerInfo?: PartyInfo
  managementInfo?: PartyInfo
  meterAction?: 'new' | 'exchange'
  zaehlernummer?: string
  neueZaehlernummer?: string
}

const STORAGE_KEY = 'bauprodukt_protocol_form_v1'
const CALC_RESULTS_STORAGE_KEY = 'bauprodukt_calc_results_v1'

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
  const readOnly = showPrefill
  const isFromProtocol = from === 'protocol'

  // Eigentümer ve Verwaltung kolonlarının gösterilip gösterilmeyeceğini kontrol et
  const showOwner = data?.ownerDifferent === true
  const showManagement = data?.managementDifferent === true
  
  // Toplam kolon sayısını hesapla (her zaman gösterilen 2 kolon + opsiyonel 2 kolon)
  const totalColumns = 2 + (showOwner ? 1 : 0) + (showManagement ? 1 : 0)
  // Tailwind CSS için sabit class isimleri
  const columnClass = totalColumns === 2 ? 'md:col-span-6' : totalColumns === 3 ? 'md:col-span-4' : 'md:col-span-3'

  return (
    <div>
      {/* Section 1 heading removed; now shown on page header */}

      {showPrefill && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          {/* Dinamik sütun düzeni */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 1. Sütun - Einbauort des Messgerätes */}
        <div className={columnClass}>
          <div className="text-sm font-medium text-gray-900 mb-2">Einbauort des Messgerätes</div>
          <div className="space-y-4">
            <input type="text" defaultValue={`${(data.firstName || '')}${data.lastName ? ` ${data.lastName}` : ''}`} placeholder="Vor- und Nachname" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
            <input type="text" defaultValue={data.address || ''} placeholder="Adresse" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
            <input type="tel" defaultValue={data.phone || ''} placeholder="Telefon" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
            <input type="email" defaultValue={data.email || ''} placeholder="E-Mail" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
            <input type="text" inputMode="numeric" defaultValue={data.postalCode || ''} placeholder="PLZ" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
            <input type="text" defaultValue={data.city || ''} placeholder="Ort" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
          </div>
        </div>

        {/* 2. Sütun - Gebäude / Parz. Nr. + Objekt-Bezeichnung */}
        <div className={columnClass}>
          <div className="flex items-end gap-4 mb-2">
            <div className="w-32">
              <div className="text-sm font-medium text-gray-900 mb-2">Gebäude</div>
              <input type="text" defaultValue={data.building || ''} placeholder="Gebäude" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
            </div>
            <div className="w-32">
              <div className="text-sm font-medium text-gray-900 mb-2">Parz. Nr.</div>
              <input type="text" defaultValue={data.parcelNumber || ''} placeholder="Parz. Nr." readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
            </div>
          </div>
          {/* Zählernummer area based on meter action */}
          {data?.meterAction === 'new' && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-900 mb-2">Zählernummer</div>
              <input
                type="text"
                defaultValue={data.zaehlernummer || ''}
                placeholder="Zählernummer"
                readOnly={readOnly}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none"
              />
            </div>
          )}
          {data?.meterAction === 'exchange' && (
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">Aktuelle Zählernummer</div>
                <input
                  type="text"
                  defaultValue={data.zaehlernummer || ''}
                  placeholder="Aktuelle Zählernummer"
                  readOnly={readOnly}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none"
                />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">Neue Zählernummer</div>
                <input
                  type="text"
                  defaultValue={data.neueZaehlernummer || ''}
                  placeholder="Neue Zählernummer"
                  readOnly={readOnly}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none"
                />
              </div>
            </div>
          )}
          
        </div>

        {/* 3. Sütun - Eigentümer (sadece girildiğinde göster) */}
        {showOwner && (
          <div className={columnClass}>
            <div className="text-sm font-medium text-gray-900 mb-2">Eigentümer (falls abweichend)</div>
            <div className="space-y-4">
              <input type="text" defaultValue={`${(data.ownerInfo?.firstName || '')}${data.ownerInfo?.lastName ? ` ${data.ownerInfo.lastName}` : ''}`} placeholder="Vor- und Nachname" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
              <input type="text" defaultValue={data.ownerInfo?.address || ''} placeholder="Adresse" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
              <input type="tel" defaultValue={data.ownerInfo?.phone || ''} placeholder="Telefon" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
              <input type="email" defaultValue={data.ownerInfo?.email || ''} placeholder="E-Mail" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
              <input type="text" defaultValue={data.ownerInfo?.postalCode || ''} placeholder="PLZ" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
              <input type="text" defaultValue={data.ownerInfo?.city || ''} placeholder="Ort" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
            </div>
          </div>
        )}

        {/* 4. Sütun - Verwaltung (sadece girildiğinde göster) */}
        {showManagement && (
          <div className={columnClass}>
            <div className="text-sm font-medium text-gray-900 mb-2">Verwaltung (falls abweichend)</div>
            <div className="space-y-4">
              <input type="text" defaultValue={`${(data.managementInfo?.firstName || '')}${data.managementInfo?.lastName ? ` ${data.managementInfo.lastName}` : ''}`} placeholder="Vor- und Nachname" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
              <input type="text" defaultValue={data.managementInfo?.address || ''} placeholder="Adresse" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
              <input type="tel" defaultValue={data.managementInfo?.phone || ''} placeholder="Telefon" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
              <input type="email" defaultValue={data.managementInfo?.email || ''} placeholder="E-Mail" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
              <input type="text" defaultValue={data.managementInfo?.postalCode || ''} placeholder="PLZ" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
              <input type="text" defaultValue={data.managementInfo?.city || ''} placeholder="Ort" readOnly={readOnly} className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none" />
            </div>
          </div>
        )}
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
        <FixturesSection isFromProtocol={isFromProtocol} />
        
      </div>
    </div>
  )
}

export default InstallationInfoPrefill

function FixturesSection({ isFromProtocol }: { isFromProtocol: boolean }) {
  const router = useRouter()
  const [open, setOpen] = React.useState<{ [k: string]: boolean }>({
    s1: true,
    s2: true,
    s3: true,
  })
  const [counts, setCounts] = React.useState<Record<string, number>>({})
  const [method, setMethod] = React.useState<'m1' | 'm2'>('m1')
  const [result, setResult] = React.useState<PlumberCalculationResult | null>(null)
  const [includeHydrantExtra, setIncludeHydrantExtra] = React.useState(false)
  const [isResultDialogOpen, setIsResultDialogOpen] = React.useState(false)
  const [saveName, setSaveName] = React.useState('')

  const inc = (id: string) => setCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  const dec = (id: string) =>
    setCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }))

  const handleCalculate = () => {
    const calculation = calculatePlumberValues({
      counts,
      method,
      includeHydrantExtra,
    })
    setResult(calculation)
    if (isFromProtocol) {
      setIsResultDialogOpen(true)
    }
  }

  function resetCalculatorUI() {
    setCounts({})
    setMethod('m1')
    setIncludeHydrantExtra(false)
    setResult(null)
  }

  function saveCurrentResult(name: string) {
    if (typeof window === 'undefined' || !result) return
    try {
      const payload = {
        id: Date.now(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        inputs: { counts, method, includeHydrantExtra },
        result,
      }
      const raw = localStorage.getItem(CALC_RESULTS_STORAGE_KEY)
      const list = raw ? (JSON.parse(raw) as any[]) : []
      list.push(payload)
      localStorage.setItem(CALC_RESULTS_STORAGE_KEY, JSON.stringify(list))
    } catch {
      // ignore
    }
  }

  const formatNumber = React.useCallback(
    (value: number, fractionDigits: number) =>
      value.toLocaleString('de-CH', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    []
  )

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
              <div>
                <div className="text-sm text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-500">LU kalt: {item.luKalt}  LU warm: {item.luWarm}</div>
              </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column title="Sanitär - Bad / WC" panelKey="s1" items={SANITAER_ITEMS} />
        <Column title="Aussen / Sonstige Entnahmen" panelKey="s2" items={AUSSEN_ITEMS} />
        <Column title="Gewerblich / Spezial" panelKey="s3" items={GEWERBE_ITEMS} />
      </div>

      {/* QD method segmented checkboxes with heading and footnote */}
      <div className="mt-8">
        <div className="text-gray-900 text-sm font-normal mb-1">Berechnung Spitzendurchfluss QD in l/s *</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <div className="md:col-span-12 md:flex md:items-center md:gap-4">
            <div className="rounded-lg border border-gray-300 p-1 inline-flex items-center gap-1">
              <label className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer select-none">
                <input type="checkbox" className="sr-only peer" checked={method === 'm1'} onChange={() => setMethod('m1')} />
                <span className="inline-flex items-center justify-center h-3 w-3 rounded-[4px] bg-gray-200 text-gray-700 text-[9px] leading-none peer-checked:bg-[#F39236] peer-checked:text-white">✓</span>
                <span className="text-sm text-gray-900">Methode 1 (0.3 l/s bis 300 l/s)</span>
              </label>
              <label className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer select-none">
                <input type="checkbox" className="sr-only peer" checked={method === 'm2'} onChange={() => setMethod('m2')} />
                <span className="inline-flex items-center justify-center h-3 w-3 rounded-[4px] bg-gray-200 text-gray-700 text-[9px] leading-none peer-checked:bg-[#F39236] peer-checked:text-white">✓</span>
                <span className="text-sm text-gray-900">Methode 2 (0.5 l/s bis 15 l/s)</span>
              </label>
            </div>

            <label className="inline-flex items-center gap-2 mt-2 md:mt-0">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#F39236] disabled:opacity-40"
                checked={includeHydrantExtra}
                onChange={e => setIncludeHydrantExtra(e.target.checked)}
              />
              <span className="inline-flex items-center gap-1">
                <span className="text-sm text-gray-800">Wasserlöschposten (Zusatz)</span>
                <span className="inline-flex items-center relative group">
                  <HelpCircle className="h-4 w-4 text-gray-600 align-middle" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-md bg-black/80 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none max-w-[28rem] w-max whitespace-normal text-left">
                    W3 Anschlussleitung zu mehreren WLP für den Einsatz eines einzelnen auslegen; Ruhedruck ≥ 300 kPa, Zuleitung mind. DN32, Anschluss nach dem Wasserzähler.
                  </span>
                </span>
              </span>
            </label>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Bitte eine QD‑Methode auswählen.</p>
      </div>

      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          type="button"
          onClick={handleCalculate}
          className="inline-flex items-center justify-center rounded-xl bg-[#F39236] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#db7f2d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F39236] md:order-2"
        >
          Berechnung durchführen
        </button>

        <div className="text-sm text-gray-600 md:order-1">
          <span className="font-semibold text-gray-900">Gesamte Zähler:</span>
          <span className="ml-2">
            {Object.values(counts).reduce((sum, val) => sum + (val || 0), 0)} Stück
          </span>
        </div>
      </div>

      {result && isResultDialogOpen && isFromProtocol && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsResultDialogOpen(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">Berechnungsergebnis speichern</div>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setIsResultDialogOpen(false)}
                  aria-label="Schliessen"
                >
                  ×
                </button>
              </div>
              <div className="p-5">
                <dl className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Total LU</dt>
                    <dd className="text-lg font-semibold text-gray-900">{formatNumber(result.totalLU * 0.1, 1)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Spitzendurchfluss (l/s)</dt>
                    <dd className="text-lg font-semibold text-gray-900">{formatNumber(result.totalLps, 3)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Volumenstrom (m³/h)</dt>
                    <dd className="text-lg font-semibold text-gray-900">{formatNumber(result.totalM3PerHour, 3)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Empfohlener DN</dt>
                    <dd className="text-lg font-semibold text-gray-900">{result.dn ?? '–'}</dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm text-gray-700">Name</label>
                    <span className="inline-flex items-center relative group">
                      <HelpCircle className="h-4 w-4 text-gray-600 align-middle" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-md bg-black/80 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none max-w-[28rem] w-max whitespace-normal text-left">
                        In diesem Bereich ist zum Speichern des Ergebnisses ein Name erforderlich. Danach können Sie das gespeicherte Ergebnis im Bereich „History“ anhand des Namens ansehen; falls bereits ein Protokoll vorhanden ist, können Sie es herunterladen, andernfalls in ein Protokoll umwandeln.
                      </span>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="z. B. Wohnung 3A, Projekt X"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                    style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                  />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => {
                    if (!saveName.trim()) return
                    saveCurrentResult(saveName)
                    setIsResultDialogOpen(false)
                    setSaveName('')
                    resetCalculatorUI()
                  }}
                  disabled={!saveName.trim()}
                >
                  Speichern
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:opacity-95 transition"
                  style={{ backgroundColor: '#F39236' }}
                  onClick={() => {
                    if (!saveName.trim()) return
                    saveCurrentResult(saveName)
                    setIsResultDialogOpen(false)
                    setSaveName('')
                    router.push('/plumber/protocol/create')
                  }}
                  disabled={!saveName.trim()}
                >
                  Speichern und als Protokoll öffnen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline results when coming directly to calculator (no dialog, no save UX) */}
      {result && !isFromProtocol && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Berechnungsergebnis</h4>
          <dl className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Total LU</dt>
              <dd className="text-lg font-semibold text-gray-900">{formatNumber(result.totalLU * 0.1, 1)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Spitzendurchfluss (l/s)</dt>
              <dd className="text-lg font-semibold text-gray-900">{formatNumber(result.totalLps, 3)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Volumenstrom (m³/h)</dt>
              <dd className="text-lg font-semibold text-gray-900">{formatNumber(result.totalM3PerHour, 3)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Empfohlener DN</dt>
              <dd className="text-lg font-semibold text-gray-900">{result.dn ?? '–'}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}


