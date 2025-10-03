'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import PhoneInput from 'react-phone-input-2'

type ProtocolFormData = {
  meterAction: 'new' | 'exchange'
  newForm: NewFormData
  exchangeForm: ExchangeFormData
}

type NewFormData = CommonFormFields & {
  zaehlernummer: string
}

type ExchangeFormData = CommonFormFields & {
  zaehlernummer: string
  neueZaehlernummer: string
}

type CommonFormFields = PersonAddress & {
  personType: 'person' | 'company'
  companyName: string
  contactPerson: string
  parcelNumber: string
  building: string
  ownerDifferent: boolean
  managementDifferent: boolean
  ownerInfo: PartyInfo
  managementInfo: PartyInfo
}

type PersonAddress = {
  firstName: string
  lastName: string
  address: string
  postalCode: string
  city: string
  phone: string
  email: string
}

type PartyInfo = PersonAddress

const EMPTY_PARTY_INFO: PartyInfo = {
  firstName: '',
  lastName: '',
  address: '',
  postalCode: '',
  city: '',
  phone: '41',
  email: '',
}

export default function ProtocolPage() {
  const router = useRouter()
  const [formData, setFormData] = React.useState<ProtocolFormData>({
    meterAction: 'new',
    newForm: {
      zaehlernummer: '',
      personType: 'person',
      companyName: '',
      contactPerson: '',
      firstName: '',
      lastName: '',
      address: '',
      postalCode: '',
      city: '',
      phone: '41',
      email: '',
      parcelNumber: '',
      building: '',
      ownerDifferent: false,
      managementDifferent: false,
      ownerInfo: { ...EMPTY_PARTY_INFO },
      managementInfo: { ...EMPTY_PARTY_INFO },
    },
    exchangeForm: {
      zaehlernummer: '',
      neueZaehlernummer: '',
      personType: 'person',
      companyName: '',
      contactPerson: '',
      firstName: '',
      lastName: '',
      address: '',
      postalCode: '',
      city: '',
      phone: '41',
      email: '',
      parcelNumber: '',
      building: '',
      ownerDifferent: false,
      managementDifferent: false,
      ownerInfo: { ...EMPTY_PARTY_INFO },
      managementInfo: { ...EMPTY_PARTY_INFO },
    },
  })

  function updateField<K extends keyof ProtocolFormData>(key: K, value: ProtocolFormData[K]) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const activeForm = formData.meterAction === 'new' ? formData.newForm : formData.exchangeForm

  function updateActiveFormField(key: string, value: any) {
    setFormData(prev => (
      prev.meterAction === 'new'
        ? { ...prev, newForm: { ...prev.newForm, [key]: value } }
        : { ...prev, exchangeForm: { ...prev.exchangeForm, [key]: value } }
    ))
  }

  function updateActiveOwnerField(key: keyof PartyInfo, value: string) {
    setFormData(prev => (
      prev.meterAction === 'new'
        ? { ...prev, newForm: { ...prev.newForm, ownerInfo: { ...prev.newForm.ownerInfo, [key]: value } } }
        : { ...prev, exchangeForm: { ...prev.exchangeForm, ownerInfo: { ...prev.exchangeForm.ownerInfo, [key]: value } } }
    ))
  }

  function isOwnerInfoComplete(info: PartyInfo) {
    return (
      info.firstName.trim().length > 0 &&
      info.lastName.trim().length > 0 &&
      info.address.trim().length > 0 &&
      info.postalCode.trim().length > 0 &&
      info.city.trim().length > 0
    )
  }

  const [isLocationOpen, setIsLocationOpen] = React.useState(false)
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = React.useState(false)
  const [ownerDialogError, setOwnerDialogError] = React.useState<string | null>(null)
  const [ownerDialogMode, setOwnerDialogMode] = React.useState<'create' | 'edit'>('create')

  const [isManagementDialogOpen, setIsManagementDialogOpen] = React.useState(false)
  const [managementDialogError, setManagementDialogError] = React.useState<string | null>(null)
  const [managementDialogMode, setManagementDialogMode] = React.useState<'create' | 'edit'>('create')

  function updateActiveManagementField(key: keyof PartyInfo, value: string) {
    setFormData(prev => (
      prev.meterAction === 'new'
        ? { ...prev, newForm: { ...prev.newForm, managementInfo: { ...prev.newForm.managementInfo, [key]: value } } }
        : { ...prev, exchangeForm: { ...prev.exchangeForm, managementInfo: { ...prev.exchangeForm.managementInfo, [key]: value } } }
    ))
  }

  function isManagementInfoComplete(info: PartyInfo) {
    return (
      info.firstName.trim().length > 0 &&
      info.lastName.trim().length > 0 &&
      info.address.trim().length > 0 &&
      info.postalCode.trim().length > 0 &&
      info.city.trim().length > 0
    )
  }

  // Simple validation regexes
  const PHONE_REGEX = /^\+?[0-9 ()-]{7,}$/
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Derived validation flags for inline messages
  const mainPhoneInvalid = activeForm.phone.trim().length > 0 && !PHONE_REGEX.test(activeForm.phone)
  const mainEmailInvalid = activeForm.email.trim().length > 0 && !EMAIL_REGEX.test(activeForm.email)
  const ownerPhoneInvalid = activeForm.ownerInfo.phone.trim().length > 0 && !PHONE_REGEX.test(activeForm.ownerInfo.phone)
  const ownerEmailInvalid = activeForm.ownerInfo.email.trim().length > 0 && !EMAIL_REGEX.test(activeForm.ownerInfo.email)
  const managementPhoneInvalid = activeForm.managementInfo.phone.trim().length > 0 && !PHONE_REGEX.test(activeForm.managementInfo.phone)
  const managementEmailInvalid = activeForm.managementInfo.email.trim().length > 0 && !EMAIL_REGEX.test(activeForm.managementInfo.email)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: integrate with backend flow
    const active = formData.meterAction === 'new' ? formData.newForm : formData.exchangeForm
    console.log('Protocol form submitted', { meterAction: formData.meterAction, data: active })
    if (typeof window !== 'undefined') {
      try {
        const toStore = {
          personType: active.personType,
          companyName: active.companyName,
          contactPerson: active.contactPerson,
          firstName: active.firstName,
          lastName: active.lastName,
          address: active.address,
          postalCode: active.postalCode,
          city: active.city,
          phone: active.phone,
          email: active.email,
          parcelNumber: active.parcelNumber,
          building: active.building,
          ownerDifferent: active.ownerDifferent,
          managementDifferent: active.managementDifferent,
          ownerInfo: active.ownerInfo,
          managementInfo: active.managementInfo,
          meterAction: formData.meterAction,
          zaehlernummer: active.zaehlernummer,
          neueZaehlernummer: (active as any).neueZaehlernummer || '',
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
                type="number"
                value={activeForm.zaehlernummer}
                onChange={(e) => updateActiveFormField('zaehlernummer', e.target.value)}
                placeholder="Zählernummer"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                inputMode="numeric"
                min={0}
                step={1}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aktuelle Zählernummer</label>
                <input
                  type="number"
                  value={activeForm.zaehlernummer}
                  onChange={(e) => updateActiveFormField('zaehlernummer', e.target.value)}
                  placeholder="Aktuelle Zählernummer"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                  inputMode="numeric"
                  min={0}
                  step={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Neue Zählernummer</label>
                <input
                  type="number"
                  value={(activeForm as ExchangeFormData).neueZaehlernummer || ''}
                  onChange={(e) => updateActiveFormField('neueZaehlernummer', e.target.value)}
                  placeholder="Neue Zählernummer"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                  inputMode="numeric"
                  min={0}
                  step={1}
                />
              </div>
            </div>
          )}

          {/* Einbauort des Messgerätes (collapsible) */}
          <div className="rounded-xl border border-gray-200">
            <div
              role="button"
              aria-expanded={isLocationOpen}
              className="w-full flex items-center justify-between px-4 py-3"
              onClick={() => setIsLocationOpen(v => !v)}
            >
              <span className="text-sm font-medium text-gray-900">Einbauort des Messgerätes</span>
              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 rounded-full p-0.5 border border-gray-200">
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-xs rounded-full transition ${activeForm.personType === 'person' ? 'bg-[#F39236] text-white' : 'text-gray-700'}`}
                    onClick={(e) => { e.stopPropagation(); updateActiveFormField('personType', 'person') }}
                  >
                    Person
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-xs rounded-full transition ${activeForm.personType === 'company' ? 'bg-[#F39236] text-white' : 'text-gray-700'}`}
                    onClick={(e) => { e.stopPropagation(); updateActiveFormField('personType', 'company') }}
                  >
                    Firma
                  </button>
                </div>
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
              </div>
            </div>
            {isLocationOpen && (
              <div className="px-4 pb-4">
                {/* Person and address fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeForm.personType === 'person' ? (
                    <>
                      <div>
                        <input
                          type="text"
                          value={activeForm.firstName}
                          onChange={(e) => updateActiveFormField('firstName', e.target.value)}
                          placeholder="Vorname"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={activeForm.lastName}
                          onChange={(e) => updateActiveFormField('lastName', e.target.value)}
                          placeholder="Nachname"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <input
                          type="text"
                          value={activeForm.companyName}
                          onChange={(e) => updateActiveFormField('companyName', e.target.value)}
                          placeholder="Firmenname"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={activeForm.contactPerson}
                          onChange={(e) => updateActiveFormField('contactPerson', e.target.value)}
                          placeholder="Ansprechsperson"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                    </>
                  )}
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={activeForm.address}
                      onChange={(e) => updateActiveFormField('address', e.target.value)}
                      placeholder="Adresse"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={activeForm.postalCode}
                      onChange={(e) => updateActiveFormField('postalCode', e.target.value)}
                      placeholder="PLZ"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                      min={0}
                      step={1}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={activeForm.city}
                      onChange={(e) => updateActiveFormField('city', e.target.value)}
                      placeholder="Ort"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                    />
                  </div>
                  <div>
                    <PhoneInput
                      country={"ch"}
                      value={activeForm.phone}
                      onChange={(value) => updateActiveFormField('phone', value)}
                      enableSearch
                      placeholder="Telefon"
                      containerClass="w-full"
                      inputStyle={{
                        width: '100%',
                        height: 'auto',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        paddingRight: '0.75rem',
                        paddingLeft: '3.5rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.5rem'
                      }}
                      buttonStyle={{
                        backgroundColor: 'transparent',
                        border: 'none'
                      }}
                      dropdownStyle={{
                        zIndex: 50,
                        borderRadius: '0.5rem'
                      }}
                    />
                    {mainPhoneInvalid && (
                      <p className="text-sm text-red-600 mt-1">Bitte eine gültige Telefonnummer eingeben.</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="email"
                      value={activeForm.email}
                      onChange={(e) => updateActiveFormField('email', e.target.value)}
                      placeholder="E-Mail"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                    />
                    {mainEmailInvalid && (
                      <p className="text-sm text-red-600 mt-1">Bitte eine gültige E-Mail-Adresse eingeben.</p>
                    )}
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
                type="number"
                value={activeForm.parcelNumber}
                onChange={(e) => updateActiveFormField('parcelNumber', e.target.value)}
                placeholder="Parz. Nr. eingeben"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                inputMode="numeric"
                min={0}
                step={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gebäude</label>
              <input
                type="text"
                value={activeForm.building}
                onChange={(e) => updateActiveFormField('building', e.target.value)}
                placeholder="Gebäude. eingeben"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5 cursor-pointer"
                checked={activeForm.ownerDifferent}
                onChange={(e) => {
                  const checked = e.target.checked
                  if (checked) {
                    updateActiveFormField('ownerDifferent', true)
                    setOwnerDialogMode('create')
                    setIsOwnerDialogOpen(true)
                  } else {
                    updateActiveFormField('ownerDifferent', false)
                    setFormData(prev => (
                      prev.meterAction === 'new'
                        ? { ...prev, newForm: { ...prev.newForm, ownerInfo: { ...EMPTY_PARTY_INFO } } }
                        : { ...prev, exchangeForm: { ...prev.exchangeForm, ownerInfo: { ...EMPTY_PARTY_INFO } } }
                    ))
                  }
                }}
              />
              <span className="text-gray-800">Eigentümer abweichend</span>
              {activeForm.ownerDifferent && isOwnerInfoComplete(activeForm.ownerInfo) && (
                <button
                  type="button"
                  className="ml-2 inline-flex items-center rounded-full bg-green-100 text-green-800 text-xs px-2 py-0.5 hover:ring-2 hover:ring-green-200"
                  onClick={() => {
                    setOwnerDialogMode('edit')
                    setIsOwnerDialogOpen(true)
                  }}
                  aria-label="Eigentümerdaten bearbeiten"
                  title="Eigentümerdaten bearbeiten"
                >
                  Gespeichert
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5 cursor-pointer"
                checked={activeForm.managementDifferent}
                onChange={(e) => {
                  const checked = e.target.checked
                  if (checked) {
                    updateActiveFormField('managementDifferent', true)
                    setManagementDialogMode('create')
                    setIsManagementDialogOpen(true)
                  } else {
                    updateActiveFormField('managementDifferent', false)
                    setFormData(prev => (
                      prev.meterAction === 'new'
                        ? { ...prev, newForm: { ...prev.newForm, managementInfo: { ...EMPTY_PARTY_INFO } } }
                        : { ...prev, exchangeForm: { ...prev.exchangeForm, managementInfo: { ...EMPTY_PARTY_INFO } } }
                    ))
                  }
                }}
              />
              <span className="text-gray-800">Verwaltung abweichend</span>
              {activeForm.managementDifferent && isManagementInfoComplete(activeForm.managementInfo) && (
                <button
                  type="button"
                  className="ml-2 inline-flex items-center rounded-full bg-green-100 text-green-800 text-xs px-2 py-0.5 hover:ring-2 hover:ring-green-200"
                  onClick={() => {
                    setManagementDialogMode('edit')
                    setIsManagementDialogOpen(true)
                  }}
                  aria-label="Verwaltungsdaten bearbeiten"
                  title="Verwaltungsdaten bearbeiten"
                >
                  Gespeichert
                </button>
              )}
            </div>
          </div>

          {/* Owner Different Dialog */}
          {isOwnerDialogOpen && (
            <div className="fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                  setIsOwnerDialogOpen(false)
                  setOwnerDialogError(null)
                  if (ownerDialogMode === 'create') {
                    updateActiveFormField('ownerDifferent', false)
                    setFormData(prev => (
                      prev.meterAction === 'new'
                        ? { ...prev, newForm: { ...prev.newForm, ownerInfo: { ...EMPTY_PARTY_INFO } } }
                        : { ...prev, exchangeForm: { ...prev.exchangeForm, ownerInfo: { ...EMPTY_PARTY_INFO } } }
                    ))
                  }
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="px-5 py-4 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">Eigentümer (abweichend)</div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={activeForm.ownerInfo.firstName}
                          onChange={(e) => updateActiveOwnerField('firstName', e.target.value)}
                          placeholder="Vorname"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={activeForm.ownerInfo.lastName}
                          onChange={(e) => updateActiveOwnerField('lastName', e.target.value)}
                          placeholder="Nachname"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={activeForm.ownerInfo.address}
                          onChange={(e) => updateActiveOwnerField('address', e.target.value)}
                          placeholder="Adresse"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={activeForm.ownerInfo.postalCode}
                          onChange={(e) => updateActiveOwnerField('postalCode', e.target.value)}
                          placeholder="PLZ"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                          min={0}
                          step={1}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={activeForm.ownerInfo.city}
                          onChange={(e) => updateActiveOwnerField('city', e.target.value)}
                          placeholder="Ort"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                      <div>
                        <PhoneInput
                          country={"ch"}
                          value={activeForm.ownerInfo.phone}
                          onChange={(value) => updateActiveOwnerField('phone', value)}
                          enableSearch
                          placeholder="Telefon"
                          containerClass="w-full"
                          inputStyle={{
                            width: '100%',
                            height: 'auto',
                            paddingTop: '0.75rem',
                            paddingBottom: '0.75rem',
                            paddingRight: '0.75rem',
                            paddingLeft: '3.5rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #D1D5DB',
                            borderRadius: '0.5rem'
                          }}
                          buttonStyle={{
                            backgroundColor: 'transparent',
                            border: 'none'
                          }}
                          dropdownStyle={{
                            zIndex: 50,
                            borderRadius: '0.5rem'
                          }}
                        />
                        {ownerPhoneInvalid && (
                          <p className="text-sm text-red-600 mt-1">Bitte eine gültige Telefonnummer eingeben.</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="email"
                          value={activeForm.ownerInfo.email}
                          onChange={(e) => updateActiveOwnerField('email', e.target.value)}
                          placeholder="E-Mail"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                        {ownerEmailInvalid && (
                          <p className="text-sm text-red-600 mt-1">Bitte eine gültige E-Mail-Adresse eingeben.</p>
                        )}
                      </div>
                    </div>
                    {ownerDialogError && (
                      <div className="text-sm text-red-600 mt-3">{ownerDialogError}</div>
                    )}
                  </div>
                  <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                      onClick={() => {
                        setIsOwnerDialogOpen(false)
                        setOwnerDialogError(null)
                        if (ownerDialogMode === 'create') {
                          updateActiveFormField('ownerDifferent', false)
                          setFormData(prev => (
                            prev.meterAction === 'new'
                              ? { ...prev, newForm: { ...prev.newForm, ownerInfo: { ...EMPTY_PARTY_INFO } } }
                              : { ...prev, exchangeForm: { ...prev.exchangeForm, ownerInfo: { ...EMPTY_PARTY_INFO } } }
                          ))
                        }
                      }}
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:opacity-95 transition"
                      style={{ backgroundColor: '#4b4b4b' }}
                      onClick={() => {
                        if (isOwnerInfoComplete(activeForm.ownerInfo)) {
                          setIsOwnerDialogOpen(false)
                          setOwnerDialogError(null)
                          updateActiveFormField('ownerDifferent', true)
                        } else {
                          setOwnerDialogError('Bitte erforderliche Felder ausfüllen (Vorname, Nachname, Adresse, PLZ, Ort).')
                        }
                      }}
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Management Different Dialog */}
          {isManagementDialogOpen && (
            <div className="fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                  setIsManagementDialogOpen(false)
                  setManagementDialogError(null)
                  if (managementDialogMode === 'create') {
                    updateActiveFormField('managementDifferent', false)
                    setFormData(prev => (
                      prev.meterAction === 'new'
                        ? { ...prev, newForm: { ...prev.newForm, managementInfo: { ...EMPTY_PARTY_INFO } } }
                        : { ...prev, exchangeForm: { ...prev.exchangeForm, managementInfo: { ...EMPTY_PARTY_INFO } } }
                    ))
                  }
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="px-5 py-4 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">Verwaltung (abweichend)</div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={activeForm.managementInfo.firstName}
                          onChange={(e) => updateActiveManagementField('firstName', e.target.value)}
                          placeholder="Vorname"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={activeForm.managementInfo.lastName}
                          onChange={(e) => updateActiveManagementField('lastName', e.target.value)}
                          placeholder="Nachname"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={activeForm.managementInfo.address}
                          onChange={(e) => updateActiveManagementField('address', e.target.value)}
                          placeholder="Adresse"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={activeForm.managementInfo.postalCode}
                          onChange={(e) => updateActiveManagementField('postalCode', e.target.value)}
                          placeholder="PLZ"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                          min={0}
                          step={1}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={activeForm.managementInfo.city}
                          onChange={(e) => updateActiveManagementField('city', e.target.value)}
                          placeholder="Ort"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                      </div>
                      <div>
                        <PhoneInput
                          country={"ch"}
                          value={activeForm.managementInfo.phone}
                          onChange={(value) => updateActiveManagementField('phone', value)}
                          enableSearch
                          placeholder="Telefon"
                          containerClass="w-full"
                          inputStyle={{
                            width: '100%',
                            height: 'auto',
                            paddingTop: '0.75rem',
                            paddingBottom: '0.75rem',
                            paddingRight: '0.75rem',
                            paddingLeft: '3.5rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #D1D5DB',
                            borderRadius: '0.5rem'
                          }}
                          buttonStyle={{
                            backgroundColor: 'transparent',
                            border: 'none'
                          }}
                          dropdownStyle={{
                            zIndex: 50,
                            borderRadius: '0.5rem'
                          }}
                        />
                        {managementPhoneInvalid && (
                          <p className="text-sm text-red-600 mt-1">Bitte eine gültige Telefonnummer eingeben.</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="email"
                          value={activeForm.managementInfo.email}
                          onChange={(e) => updateActiveManagementField('email', e.target.value)}
                          placeholder="E-Mail"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                        />
                        {managementEmailInvalid && (
                          <p className="text-sm text-red-600 mt-1">Bitte eine gültige E-Mail-Adresse eingeben.</p>
                        )}
                      </div>
                    </div>
                    {managementDialogError && (
                      <div className="text-sm text-red-600 mt-3">{managementDialogError}</div>
                    )}
                  </div>
                  <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                      onClick={() => {
                        setIsManagementDialogOpen(false)
                        setManagementDialogError(null)
                        if (managementDialogMode === 'create') {
                          updateActiveFormField('managementDifferent', false)
                          setFormData(prev => (
                            prev.meterAction === 'new'
                              ? { ...prev, newForm: { ...prev.newForm, managementInfo: { ...EMPTY_PARTY_INFO } } }
                              : { ...prev, exchangeForm: { ...prev.exchangeForm, managementInfo: { ...EMPTY_PARTY_INFO } } }
                          ))
                        }
                      }}
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:opacity-95 transition"
                      style={{ backgroundColor: '#4b4b4b' }}
                      onClick={() => {
                        if (isManagementInfoComplete(activeForm.managementInfo)) {
                          setIsManagementDialogOpen(false)
                          setManagementDialogError(null)
                          updateActiveFormField('managementDifferent', true)
                        } else {
                          setManagementDialogError('Bitte erforderliche Felder ausfüllen (Vorname, Nachname, Adresse, PLZ, Ort).')
                        }
                      }}
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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


