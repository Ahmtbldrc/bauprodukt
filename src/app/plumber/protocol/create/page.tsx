"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

export default function ProtocolCreatePage() {
  const router = useRouter()
  const [agree, setAgree] = React.useState(false)
  const [prefill, setPrefill] = React.useState<any | null>(null)

  const years = React.useMemo(() => {
    const current = new Date().getFullYear()
    const start = 1950
    return Array.from({ length: current - start + 1 }, (_, i) => String(current - i))
  }, [])

  // DN mapping to Verschraubung, Q3 and Einbaulänge (mm)
  const DN_MAP = React.useMemo(() => ({
    20: { verschr: '3/4"', q3: '4.0 m3/h', mm: '220 mm', dimLabel: 'DN 20 - 3/4"' },
    25: { verschr: '1"', q3: '6.3 m3/h', mm: '260 mm', dimLabel: 'DN 25 - 1"' },
    32: { verschr: '5/4"', q3: '10.0 m3/h', mm: '260 mm', dimLabel: 'DN 32 - 5/4"' },
    40: { verschr: '1 1/2"', q3: '16.0 m3/h', mm: '300 mm', dimLabel: 'DN 40 - 1 1/2"' },
    50: { verschr: '2"', q3: '25.0 m3/h', mm: '270 mm', dimLabel: 'DN 50 - 2"' },
  } as Record<number, { verschr: string; q3: string; mm: string; dimLabel: string }>), [])

  const [dnAuto, setDnAuto] = React.useState<{ dn?: number; verschr?: string; q3?: string; mm?: string; dimLabel?: string } | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('bauprodukt_calc_results_v1')
      if (!raw) return
      const list = JSON.parse(raw) as any[]
      if (!Array.isArray(list) || list.length === 0) return
      const last = list[list.length - 1]
      const dnRaw = String(last?.result?.dn ?? '').toUpperCase().trim()
      const dnNumeric = dnRaw.startsWith('DN') ? parseInt(dnRaw.slice(2), 10) : Number(last?.result?.dn)
      if (!Number.isFinite(dnNumeric)) return
      const map = DN_MAP[dnNumeric as 20 | 25 | 32 | 40 | 50]
      if (!map) return
      setDnAuto({ dn: dnNumeric, ...map })
    } catch {
      // ignore
    }
  }, [DN_MAP])

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
            {prefill?.personType === 'company' ? (
              <>
                <div className="md:col-span-12">
                  <label className="sr-only">Firmenname *</label>
                  <input
                    type="text"
                    placeholder="Firmenname *"
                    defaultValue={prefill?.companyName ?? ''}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                    style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                  />
                </div>
                <div className="md:col-span-12">
                  <label className="sr-only">Ansprechsperson *</label>
                  <input
                    type="text"
                    placeholder="Ansprechsperson *"
                    defaultValue={prefill?.contactPerson ?? ''}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                    style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                  />
                </div>
              </>
            ) : (
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
            )}
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
              <input type="text" placeholder="Zähler‑Nr. *" defaultValue={prefill?.zaehlernummer ?? ''} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Einbaulänge *</option>
                <option>110 mm</option>
                <option>190 mm</option>
                <option>220 mm</option>
                <option>260 mm</option>
                <option>270 mm</option>
                <option>300 mm</option>
              </select>
            </div>
            <div>
              <input type="number" placeholder="Zählerstand in m³" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 placeholder-gray-400" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Dimension *</option>
                <option>DN 20 - 3/4"</option>
                <option>DN 25 - 1"</option>
                <option>DN 32 - 1 1/4"</option>
                <option>DN 40 - 1 1/2"</option>
                <option>DN 50 - 2"</option>
              </select>
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Dauerdurchfluss in m³/h</option>
                <option>2,5 m3/h</option>
                <option>3,5 m3/h</option>
                <option>4 m3/h</option>
                <option>6,3 m3/h</option>
                <option>7 m3/h</option>
                <option>10 m3/h</option>
                <option>16 m3/h</option>
                <option>25 m3/h</option>
              </select>
            </div>
            <div className="flex gap-3">
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Einlaufstrecke *</option>
                <option>Verzinkt</option>
                <option>Kupfer</option>
                <option>Edelstahl</option>
                <option>Rotguss</option>
                <option>Kunststoff</option>
              </select>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Grösse</option>
                <option>1/2"</option>
                <option>3/4"</option>
                <option>1"</option>
                <option>1 1/4"</option>
                <option>1 1/2"</option>
                <option>2"</option>
                <option>2 1/2"</option>
                <option>3"</option>
                <option>15 mm</option>
                <option>16 mm</option>
                <option>18 mm</option>
                <option>20 mm</option>
                <option>22 mm</option>
                <option>26 mm</option>
                <option>28 mm</option>
                <option>32 mm</option>
                <option>35 mm</option>
                <option>40 mm</option>
                <option>42 mm</option>
                <option>50 mm</option>
                <option>54 mm</option>
                <option>63 mm</option>
                <option>76.1 mm</option>
              </select>
            </div>
            <div className="flex gap-3">
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Auslaufstrecke *</option>
                <option>Verzinkt</option>
                <option>Kupfer</option>
                <option>Edelstahl</option>
                <option>Rotguss</option>
                <option>Kunststoff</option>
              </select>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Grösse</option>
                <option>1/2"</option>
                <option>3/4"</option>
                <option>1"</option>
                <option>1 1/4"</option>
                <option>1 1/2"</option>
                <option>2"</option>
                <option>2 1/2"</option>
                <option>3"</option>
                <option>15 mm</option>
                <option>16 mm</option>
                <option>18 mm</option>
                <option>20 mm</option>
                <option>22 mm</option>
                <option>26 mm</option>
                <option>28 mm</option>
                <option>32 mm</option>
                <option>35 mm</option>
                <option>40 mm</option>
                <option>42 mm</option>
                <option>50 mm</option>
                <option>54 mm</option>
                <option>63 mm</option>
                <option>76.1 mm</option>
              </select>
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Einbauart *</option>
                <option>waagerecht</option>
                <option>senkrecht</option>
              </select>
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Einbauort</option>
                <option>Keller</option>
                <option>Küche</option>
                <option>Bad</option>
                <option>Garage</option>
                <option>Technikraum</option>
              </select>
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Jahrgang *</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="date"
                placeholder="Ausbaudatum"
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
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
              <input
                type="text"
                placeholder="Hersteller *"
                defaultValue="TOPAS ESKR"
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Zähler‑Nr. *"
                defaultValue={(prefill?.neueZaehlernummer ?? prefill?.zaehlernummer) ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Einbaulänge *"
                defaultValue={dnAuto?.mm ?? ''}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none"
              />
            </div>
            <div>
              <input type="number" placeholder="Zählerstand in m³" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 placeholder-gray-400" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input
                type="text"
                placeholder="Dimension *"
                defaultValue={dnAuto?.dimLabel ?? ''}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Dauerdurchfluss in m³/h"
                defaultValue={dnAuto?.q3 ?? ''}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Einlaufstrecke *</option>
                <option>Verzinkt</option>
                <option>Kupfer</option>
                <option>Edelstahl</option>
                <option>Rotguss</option>
                <option>Kunststoff</option>
              </select>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Grösse</option>
                <option>1/2"</option>
                <option>3/4"</option>
                <option>1"</option>
                <option>1 1/4"</option>
                <option>1 1/2"</option>
                <option>2"</option>
                <option>2 1/2"</option>
                <option>3"</option>
                <option>15 mm</option>
                <option>16 mm</option>
                <option>18 mm</option>
                <option>20 mm</option>
                <option>22 mm</option>
                <option>26 mm</option>
                <option>28 mm</option>
                <option>32 mm</option>
                <option>35 mm</option>
                <option>40 mm</option>
                <option>42 mm</option>
                <option>50 mm</option>
                <option>54 mm</option>
                <option>63 mm</option>
                <option>76.1 mm</option>
              </select>
            </div>
            <div className="flex gap-3">
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Auslaufstrecke *</option>
                <option>Verzinkt</option>
                <option>Kupfer</option>
                <option>Edelstahl</option>
                <option>Rotguss</option>
                <option>Kunststoff</option>
              </select>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Grösse</option>
                <option>1/2"</option>
                <option>3/4"</option>
                <option>1"</option>
                <option>1 1/4"</option>
                <option>1 1/2"</option>
                <option>2"</option>
                <option>2 1/2"</option>
                <option>3"</option>
                <option>15 mm</option>
                <option>16 mm</option>
                <option>18 mm</option>
                <option>20 mm</option>
                <option>22 mm</option>
                <option>26 mm</option>
                <option>28 mm</option>
                <option>32 mm</option>
                <option>35 mm</option>
                <option>40 mm</option>
                <option>42 mm</option>
                <option>50 mm</option>
                <option>54 mm</option>
                <option>63 mm</option>
                <option>76.1 mm</option>
              </select>
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Einbauart *</option>
                <option>waagerecht</option>
                <option>senkrecht</option>
              </select>
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Einbauort</option>
                <option>Keller</option>
                <option>Küche</option>
                <option>Bad</option>
                <option>Garage</option>
                <option>Technikraum</option>
              </select>
            </div>
            <div>
              <select
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Jahrgang *</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="date"
                placeholder="Ausbaudatum"
                defaultValue=""
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 text-gray-400"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
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

