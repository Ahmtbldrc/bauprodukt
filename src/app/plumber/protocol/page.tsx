'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

type ProtocolFormData = {
  meterAction: 'new' | 'exchange'
  zaehlernummer: string
  neueZaehlernummer?: string
  einbauort: string
  firstName: string
  lastName: string
  address: string
  postalCode: string
  city: string
  phone: string
  email: string
  parcelNumber: string
  building: string
  ownerDifferent: boolean
  managementDifferent: boolean
}

export default function ProtocolPage() {
  const router = useRouter()
  const [formData, setFormData] = React.useState<ProtocolFormData>({
    meterAction: 'new',
    zaehlernummer: '',
    einbauort: '',
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    parcelNumber: '',
    building: '',
    ownerDifferent: false,
    managementDifferent: false,
  })

  function updateField<K extends keyof ProtocolFormData>(key: K, value: ProtocolFormData[K]) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const [isLocationOpen, setIsLocationOpen] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: integrate with backend flow
    // eslint-disable-next-line no-console
    console.log('Protocol form submitted', formData)
    if (typeof window !== 'undefined') {
      try {
        const toStore = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          postalCode: formData.postalCode,
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          parcelNumber: formData.parcelNumber,
          building: formData.building,
        }
        localStorage.setItem('bauprodukt_protocol_form_v1', JSON.stringify(toStore))
      } catch {}
    }
    router.replace('/plumber/calculator?from=protocol')
  }

  return (
    <div className="w-full mr-auto">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">Rechner + Protokoll erstellen</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Meter action */}
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                className="sr-only peer"
                name="meterAction"
                checked={formData.meterAction === 'new'}
                onChange={() => updateField('meterAction', 'new')}
              />
              <span
                className="h-4 w-4 rounded-full border-2 border-[#F39236] relative transition peer-focus:ring-2 peer-focus:ring-[#F3923620] peer-checked:bg-[#F39236] after:content-[''] after:absolute after:inset-1 after:rounded-full after:bg-white after:scale-0 peer-checked:after:scale-100 after:transition"
              />
              <span className="text-gray-800">Neuer Wasserzähler</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                className="sr-only peer"
                name="meterAction"
                checked={formData.meterAction === 'exchange'}
                onChange={() => updateField('meterAction', 'exchange')}
              />
              <span
                className="h-4 w-4 rounded-full border-2 border-[#F39236] relative transition peer-focus:ring-2 peer-focus:ring-[#F3923620] peer-checked:bg-[#F39236] after:content-[''] after:absolute after:inset-1 after:rounded-full after:bg-white after:scale-0 peer-checked:after:scale-100 after:transition"
              />
              <span className="text-gray-800">Austausch Wasserzähler</span>
            </label>
          </div>

          {/* Zählernummer section */}
          {formData.meterAction === 'new' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zählernummer</label>
              <input
                type="text"
                value={formData.zaehlernummer}
                onChange={(e) => updateField('zaehlernummer', e.target.value)}
                placeholder="Zählernummer"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aktuelle Zählernummer</label>
                <input
                  type="text"
                  value={formData.zaehlernummer}
                  onChange={(e) => updateField('zaehlernummer', e.target.value)}
                  placeholder="Aktuelle Zählernummer"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Neue Zählernummer</label>
                <input
                  type="text"
                  value={formData.neueZaehlernummer || ''}
                  onChange={(e) => updateField('neueZaehlernummer', e.target.value)}
                  placeholder="Neue Zählernummer"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                />
              </div>
            </div>
          )}

          {/* Einbauort des Messgerätes (collapsible) */}
          <div className="rounded-xl border border-gray-200">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3"
              onClick={() => setIsLocationOpen(v => !v)}
            >
              <span className="text-sm font-medium text-gray-900">Einbauort des Messgerätes</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`h-4 w-4 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isLocationOpen && (
              <div className="px-4 pb-4">
                {/* Person and address fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      placeholder="Vorname"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      placeholder="Nachname"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Adresse"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.postalCode}
                      onChange={(e) => updateField('postalCode', e.target.value)}
                      placeholder="PLZ"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Ort"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="Telefon"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="E-Mail"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Parcel and building */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parz. Nr.</label>
              <input
                type="text"
                value={formData.parcelNumber}
                onChange={(e) => updateField('parcelNumber', e.target.value)}
                placeholder="Parz. Nr. eingeben"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gebäude</label>
              <input
                type="text"
                value={formData.building}
                onChange={(e) => updateField('building', e.target.value)}
                placeholder="Gebäude. eingeben"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={formData.ownerDifferent}
                onChange={(e) => updateField('ownerDifferent', e.target.checked)}
              />
              <span className="text-gray-800">Eigentümer abweichend</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={formData.managementDifferent}
                onChange={(e) => updateField('managementDifferent', e.target.checked)}
              />
              <span className="text-gray-800">Verwaltung abweichend</span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-white text-base font-medium shadow-sm hover:opacity-95 transition"
              style={{ backgroundColor: '#4b4b4b' }}
            >
              Starten
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


