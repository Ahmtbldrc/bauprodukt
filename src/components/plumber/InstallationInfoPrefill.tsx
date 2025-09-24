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

  if (from !== 'protocol' || !data) return null

  return (
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
  )
}

export default InstallationInfoPrefill


