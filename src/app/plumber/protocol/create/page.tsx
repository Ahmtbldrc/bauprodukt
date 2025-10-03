"use client"

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabasePlumberClient } from '@/lib/supabase'
import type { MeterData } from '@/types/database'
import { ProtocolSuccessDialog } from '@/components/ui'

export default function ProtocolCreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [agree, setAgree] = React.useState(false)
  const [prefill, setPrefill] = React.useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [existingProtocol, setExistingProtocol] = React.useState<any | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false)
  const [createdProtocolId, setCreatedProtocolId] = React.useState<string | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  
  // Get plumber_calculation_id from URL params or localStorage
  const plumberCalculationId = React.useMemo(() => {
    const urlParam = searchParams.get('calculation_id')
    if (urlParam) return urlParam
    
    // Fallback to localStorage (last calculation)
    try {
      const raw = localStorage.getItem('bauprodukt_calc_results_v1')
      if (!raw) return undefined
      const list = JSON.parse(raw) as any[]
      if (!Array.isArray(list) || list.length === 0) return undefined
      const last = list[list.length - 1]
      return last?.id
    } catch {
      return undefined
    }
  }, [searchParams])

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

  // Fetch existing protocol if calculation_id is provided
  React.useEffect(() => {
    async function fetchExistingProtocol() {
      if (!plumberCalculationId) return
      
      try {
        const { data: { session }, error: sessionError } = await supabasePlumberClient.auth.getSession()
        if (sessionError || !session?.access_token) {
          console.error('No session for protocol fetch')
          return
        }

        const response = await fetch(`/api/plumber-protocols?calculation_id=${plumberCalculationId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.data) {
            setExistingProtocol(result.data)
          }
        }
      } catch (error) {
        console.error('Error fetching existing protocol:', error)
      }  
    }

    fetchExistingProtocol()
  }, [plumberCalculationId])

  // Update dnAuto when existingProtocol is loaded
  React.useEffect(() => {
    if (!existingProtocol?.new_meter_data?.dimension) return
    
    // Extract DN number from dimension (e.g., "DN 20 - 3/4\"" -> 20)
    const dimension = existingProtocol.new_meter_data.dimension
    const match = dimension.match(/DN\s*(\d+)/)
    if (!match) return
    
    const dnNumeric = parseInt(match[1], 10)
    const map = DN_MAP[dnNumeric as 20 | 25 | 32 | 40 | 50]
    if (map) {
      setDnAuto({ dn: dnNumeric, ...map })
    }
  }, [existingProtocol, DN_MAP])

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formRef.current || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const formData = new FormData(formRef.current)
      
      // Get auth token
      const { data: { session }, error: sessionError } = await supabasePlumberClient.auth.getSession()
      if (sessionError || !session?.access_token) {
        alert('Sie müssen angemeldet sein, um ein Protokoll zu erstellen.')
        return
      }

      // Helper function to filter out placeholder values
      const filterPlaceholder = (value: any, placeholder: string) => {
        const val = value as string
        // Filter out empty strings, the placeholder text, and whitespace-only values
        return val && val.trim() !== '' && val !== placeholder ? val : undefined
      }

      // Helper function to get form value or keep existing value
      const getValueOrKeepExisting = (formValue: any, existingValue: any) => {
        const val = formValue as string
        if (val && val.trim() !== '') {
          return val
        }
        return existingValue !== undefined ? existingValue : undefined
      }

      // Helper function to merge meter data (keep existing values for empty fields)
      const mergeMeterData = (formPrefix: 'old' | 'new', existingData?: MeterData | null): MeterData | null => {
        const manufacturer = formData.get(`${formPrefix}_manufacturer`) as string
        const meterNumber = formData.get(`${formPrefix}_meter_number`) as string
        const installationLength = formData.get(`${formPrefix}_installation_length`) as any
        const meterReadingRaw = formData.get(`${formPrefix}_meter_reading`)
        const dimension = formData.get(`${formPrefix}_dimension`) as any
        const flowRate = formData.get(`${formPrefix}_flow_rate`) as any
        const inletMaterial = formData.get(`${formPrefix}_inlet_material`) as any
        const inletSizeRaw = formData.get(`${formPrefix}_inlet_size`)
        const outletMaterial = formData.get(`${formPrefix}_outlet_material`) as any
        const outletSizeRaw = formData.get(`${formPrefix}_outlet_size`)
        const installationType = formData.get(`${formPrefix}_installation_type`) as any
        const installationLocation = formData.get(`${formPrefix}_installation_location`) as any
        const yearVintage = formData.get(`${formPrefix}_year_vintage`) as string
        const dateField = formPrefix === 'old' ? formData.get('old_removal_date') : formData.get('new_installation_date')

        return {
          manufacturer: getValueOrKeepExisting(manufacturer, existingData?.manufacturer) || (formPrefix === 'new' ? 'TOPAS ESKR' : undefined),
          meter_number: getValueOrKeepExisting(meterNumber, existingData?.meter_number),
          installation_length: getValueOrKeepExisting(installationLength, existingData?.installation_length),
          meter_reading: meterReadingRaw ? parseFloat(meterReadingRaw as string) : existingData?.meter_reading,
          dimension: getValueOrKeepExisting(dimension, existingData?.dimension),
          flow_rate: getValueOrKeepExisting(flowRate, existingData?.flow_rate),
          inlet_material: getValueOrKeepExisting(inletMaterial, existingData?.inlet_material),
          inlet_size: filterPlaceholder(inletSizeRaw, 'Grösse') || existingData?.inlet_size,
          outlet_material: getValueOrKeepExisting(outletMaterial, existingData?.outlet_material),
          outlet_size: filterPlaceholder(outletSizeRaw, 'Grösse') || existingData?.outlet_size,
          installation_type: getValueOrKeepExisting(installationType, existingData?.installation_type),
          installation_location: getValueOrKeepExisting(installationLocation, existingData?.installation_location),
          year_vintage: getValueOrKeepExisting(yearVintage, existingData?.year_vintage) || (formPrefix === 'new' ? new Date().getFullYear().toString() : undefined),
          ...(formPrefix === 'old' 
            ? { removal_date: getValueOrKeepExisting(dateField, existingData?.removal_date) }
            : { installation_date: getValueOrKeepExisting(dateField, existingData?.installation_date) || new Date().toISOString().split('T')[0] }
          ),
        } as MeterData
      }

      // Build old meter data (only if exchange or existing data)
      const isExchange = prefill?.meterAction === 'exchange' || existingProtocol?.old_meter_data
      const oldMeterData: MeterData | null = isExchange 
        ? mergeMeterData('old', existingProtocol?.old_meter_data)
        : null

      // Build new meter data
      const newMeterData: MeterData = mergeMeterData('new', existingProtocol?.new_meter_data) as MeterData

      // Build request body (keep existing values for empty fields)
      const requestBody = {
        plumber_calculation_id: plumberCalculationId,
        person_type: (existingProtocol?.person_type === 'company' || prefill?.personType === 'company') ? 'company' : 'person',
        company_name: getValueOrKeepExisting(formData.get('company_name'), existingProtocol?.company_name),
        contact_person: getValueOrKeepExisting(formData.get('contact_person'), existingProtocol?.contact_person),
        person_name: getValueOrKeepExisting(formData.get('person_name'), existingProtocol?.person_name),
        street: getValueOrKeepExisting(formData.get('street'), existingProtocol?.street),
        additional_info: getValueOrKeepExisting(formData.get('additional_info'), existingProtocol?.additional_info),
        postal_code: getValueOrKeepExisting(formData.get('postal_code'), existingProtocol?.postal_code),
        city: getValueOrKeepExisting(formData.get('city'), existingProtocol?.city),
        phone: getValueOrKeepExisting(formData.get('phone'), existingProtocol?.phone),
        email: getValueOrKeepExisting(formData.get('email'), existingProtocol?.email),
        old_meter_data: oldMeterData,
        new_meter_data: newMeterData,
        notes: getValueOrKeepExisting(formData.get('notes'), existingProtocol?.notes),
      }

      // Send to API
      const response = await fetch('/api/plumber-protocols', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Erstellen des Protokolls')
      }

      const result = await response.json()
      
      // Success - show dialog with protocol ID
      setCreatedProtocolId(result.data?.id || null)
      setShowSuccessDialog(true)
      
    } catch (error) {
      console.error('Protocol submission error:', error)
      alert(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDialogClose = () => {
    setShowSuccessDialog(false)
  }

  return (
    <div className="w-full mr-auto">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">Austauschprotokoll für einen Wasserzähler</h1>
      
      {/* Success Dialog */}
      <ProtocolSuccessDialog
        isOpen={showSuccessDialog}
        onClose={handleDialogClose}
        protocolId={createdProtocolId}
        isUpdate={!!existingProtocol}
      />

      <form 
        key={existingProtocol?.id || 'new-form'} 
        ref={formRef} 
        onSubmit={onSubmit} 
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6"
      >
        {/* Einbauort des Messgerätes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm font-medium text-gray-900">Einbauort des Messgerätes</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {(existingProtocol?.person_type === 'company' || prefill?.personType === 'company') ? (
              <>
                <div className="md:col-span-12">
                  <label className="sr-only">Firmenname *</label>
                  <input
                    type="text"
                    name="company_name"
                placeholder="Firmenname *"
                    defaultValue={existingProtocol?.company_name ?? prefill?.companyName ?? ''}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                    style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                  />
                </div>
                <div className="md:col-span-12">
                  <label className="sr-only">Ansprechsperson *</label>
                  <input
                    type="text"
                    name="contact_person"
                placeholder="Ansprechsperson *"
                    defaultValue={existingProtocol?.contact_person ?? prefill?.contactPerson ?? ''}
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
                  name="person_name"
                  placeholder="Name *"
                  defaultValue={existingProtocol?.person_name ?? `${prefill?.firstName ?? ''}${prefill?.lastName ? ` ${prefill?.lastName}` : ''}`}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: '#F3923620' }}
                />
              </div>
            )}
            <div className="md:col-span-6">
              <label className="sr-only">Strasse / Nr. *</label>
              <input
                type="text"
                name="street"
                placeholder="Strasse / Nr. *"
                defaultValue={existingProtocol?.street ?? prefill?.address ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-6">
              <label className="sr-only">Zusatz *</label>
              <input
                type="text"
                name="additional_info"
                placeholder="Zusatz *"
                defaultValue={existingProtocol?.additional_info ?? [prefill?.parcelNumber, prefill?.building].filter(Boolean).join(', ')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-3">
              <label className="sr-only">PLZ *</label>
              <input
                type="text"
                name="postal_code"
                inputMode="numeric"
                placeholder="PLZ *"
                defaultValue={existingProtocol?.postal_code ?? prefill?.postalCode ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-3">
              <label className="sr-only">Ort *</label>
              <input
                type="text"
                name="city"
                placeholder="Ort *"
                defaultValue={existingProtocol?.city ?? prefill?.city ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-3">
              <label className="sr-only">Telefon *</label>
              <input
                type="tel"
                name="phone"
                placeholder="Telefon *"
                defaultValue={existingProtocol?.phone ?? prefill?.phone ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div className="md:col-span-3">
              <label className="sr-only">E‑Mail *</label>
              <input
                type="email"
                name="email"
                placeholder="E‑Mail *"
                defaultValue={existingProtocol?.email ?? prefill?.email ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
          </div>
        </div>

        {/* Messgerätedaten / Einbausituation – altes Messgerät (nur bei Austausch) */}
        {(existingProtocol?.old_meter_data || prefill?.meterAction === 'exchange') && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm font-medium text-gray-900">Messgerätedaten / Einbausituation</div>
            <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200">Altes Messgerät</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input type="text" name="old_manufacturer"
                placeholder="Hersteller *" defaultValue={existingProtocol?.old_meter_data?.manufacturer ?? ''} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input type="text" name="old_meter_number"
                placeholder="Zähler‑Nr. *" defaultValue={existingProtocol?.old_meter_data?.meter_number ?? prefill?.zaehlernummer ?? ''} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <select
                name="old_installation_length"
                defaultValue={existingProtocol?.old_meter_data?.installation_length ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.installation_length ? 'text-gray-900' : 'text-gray-400'}`}
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
              <input type="number" name="old_meter_reading"
                placeholder="Zählerstand in m³" step="0.01" defaultValue={existingProtocol?.old_meter_data?.meter_reading ?? ''} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 placeholder-gray-400" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <select
                name="old_dimension"
                defaultValue={existingProtocol?.old_meter_data?.dimension ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.dimension ? 'text-gray-900' : 'text-gray-400'}`}
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Dimension *</option>
                <option>DN 20 - 3/4&quot;</option>
                <option>DN 25 - 1&quot;</option>
                <option>DN 32 - 1 1/4&quot;</option>
                <option>DN 40 - 1 1/2&quot;</option>
                <option>DN 50 - 2&quot;</option>
              </select>
            </div>
            <div>
              <select
                name="old_flow_rate"
                defaultValue={existingProtocol?.old_meter_data?.flow_rate ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.flow_rate ? 'text-gray-900' : 'text-gray-400'}`}
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
                name="old_inlet_material"
                defaultValue={existingProtocol?.old_meter_data?.inlet_material ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.inlet_material ? 'text-gray-900' : 'text-gray-400'}`}
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
                name="old_inlet_size"
                defaultValue={existingProtocol?.old_meter_data?.inlet_size ?? "Grösse"}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '' || e.currentTarget.value === 'Grösse')}
                className={`w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.inlet_size && existingProtocol?.old_meter_data?.inlet_size !== 'Grösse' ? 'text-gray-900' : 'text-gray-400'}`}
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="Grösse">Grösse</option>
                <option value='1/2"'>1/2&quot;</option>
                <option value='3/4"'>3/4&quot;</option>
                <option value='1"'>1&quot;</option>
                <option value='1 1/4"'>1 1/4&quot;</option>
                <option value='1 1/2"'>1 1/2&quot;</option>
                <option value='2"'>2&quot;</option>
                <option value='2 1/2"'>2 1/2&quot;</option>
                <option value='3"'>3&quot;</option>
                <option value="15 mm">15 mm</option>
                <option value="16 mm">16 mm</option>
                <option value="18 mm">18 mm</option>
                <option value="20 mm">20 mm</option>
                <option value="22 mm">22 mm</option>
                <option value="26 mm">26 mm</option>
                <option value="28 mm">28 mm</option>
                <option value="32 mm">32 mm</option>
                <option value="35 mm">35 mm</option>
                <option value="40 mm">40 mm</option>
                <option value="42 mm">42 mm</option>
                <option value="50 mm">50 mm</option>
                <option value="54 mm">54 mm</option>
                <option value="63 mm">63 mm</option>
                <option value="76.1 mm">76.1 mm</option>
              </select>
            </div>
            <div className="flex gap-3">
              <select
                name="old_outlet_material"
                defaultValue={existingProtocol?.old_meter_data?.outlet_material ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.outlet_material ? 'text-gray-900' : 'text-gray-400'}`}
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
                name="old_outlet_size"
                defaultValue={existingProtocol?.old_meter_data?.outlet_size ?? "Grösse"}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '' || e.currentTarget.value === 'Grösse')}
                className={`w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.outlet_size && existingProtocol?.old_meter_data?.outlet_size !== 'Grösse' ? 'text-gray-900' : 'text-gray-400'}`}
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="Grösse">Grösse</option>
                <option value='1/2"'>1/2&quot;</option>
                <option value='3/4"'>3/4&quot;</option>
                <option value='1"'>1&quot;</option>
                <option value='1 1/4"'>1 1/4&quot;</option>
                <option value='1 1/2"'>1 1/2&quot;</option>
                <option value='2"'>2&quot;</option>
                <option value='2 1/2"'>2 1/2&quot;</option>
                <option value='3"'>3&quot;</option>
                <option value="15 mm">15 mm</option>
                <option value="16 mm">16 mm</option>
                <option value="18 mm">18 mm</option>
                <option value="20 mm">20 mm</option>
                <option value="22 mm">22 mm</option>
                <option value="26 mm">26 mm</option>
                <option value="28 mm">28 mm</option>
                <option value="32 mm">32 mm</option>
                <option value="35 mm">35 mm</option>
                <option value="40 mm">40 mm</option>
                <option value="42 mm">42 mm</option>
                <option value="50 mm">50 mm</option>
                <option value="54 mm">54 mm</option>
                <option value="63 mm">63 mm</option>
                <option value="76.1 mm">76.1 mm</option>
              </select>
            </div>
            <div>
              <select
                name="old_installation_type"
                defaultValue={existingProtocol?.old_meter_data?.installation_type ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.installation_type ? 'text-gray-900' : 'text-gray-400'}`}
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Einbauart *</option>
                <option>waagerecht</option>
                <option>senkrecht</option>
              </select>
            </div>
            <div>
              <select
                name="old_installation_location"
                defaultValue={existingProtocol?.old_meter_data?.installation_location ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.installation_location ? 'text-gray-900' : 'text-gray-400'}`}
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
                name="old_year_vintage"
                defaultValue={existingProtocol?.old_meter_data?.year_vintage ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.year_vintage ? 'text-gray-900' : 'text-gray-400'}`}
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
                name="old_removal_date"
                placeholder="Ausbaudatum"
                defaultValue={existingProtocol?.old_meter_data?.removal_date ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.old_meter_data?.removal_date ? 'text-gray-900' : 'text-gray-400'}`}
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
                name="new_meter_number"
                placeholder="Zähler‑Nr. *"
                defaultValue={existingProtocol?.new_meter_data?.meter_number ?? (prefill?.neueZaehlernummer ?? prefill?.zaehlernummer) ?? ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
            <div>
              <input
                type="text"
                name="new_installation_length"
                placeholder="Einbaulänge *"
                defaultValue={existingProtocol?.new_meter_data?.installation_length ?? dnAuto?.mm ?? ''}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none"
              />
            </div>
            <div>
              <input type="number" name="new_meter_reading"
                placeholder="Zählerstand in m³" defaultValue={existingProtocol?.new_meter_data?.meter_reading ?? ''} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 placeholder-gray-400" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
            </div>
            <div>
              <input
                type="text"
                name="new_dimension"
                placeholder="Dimension *"
                defaultValue={existingProtocol?.new_meter_data?.dimension ?? dnAuto?.dimLabel ?? ''}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                name="new_flow_rate"
                placeholder="Dauerdurchfluss in m³/h"
                defaultValue={existingProtocol?.new_meter_data?.flow_rate ?? dnAuto?.q3 ?? ''}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 px-3 py-3 focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <select
                name="new_inlet_material"
                defaultValue={existingProtocol?.new_meter_data?.inlet_material ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.new_meter_data?.inlet_material ? 'text-gray-900' : 'text-gray-400'}`}
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
                name="new_inlet_size"
                defaultValue={existingProtocol?.new_meter_data?.inlet_size ?? "Grösse"}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '' || e.currentTarget.value === 'Grösse')}
                className={`w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.new_meter_data?.inlet_size && existingProtocol?.new_meter_data?.inlet_size !== 'Grösse' ? 'text-gray-900' : 'text-gray-400'}`}
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="Grösse">Grösse</option>
                <option value='1/2"'>1/2&quot;</option>
                <option value='3/4"'>3/4&quot;</option>
                <option value='1"'>1&quot;</option>
                <option value='1 1/4"'>1 1/4&quot;</option>
                <option value='1 1/2"'>1 1/2&quot;</option>
                <option value='2"'>2&quot;</option>
                <option value='2 1/2"'>2 1/2&quot;</option>
                <option value='3"'>3&quot;</option>
                <option value="15 mm">15 mm</option>
                <option value="16 mm">16 mm</option>
                <option value="18 mm">18 mm</option>
                <option value="20 mm">20 mm</option>
                <option value="22 mm">22 mm</option>
                <option value="26 mm">26 mm</option>
                <option value="28 mm">28 mm</option>
                <option value="32 mm">32 mm</option>
                <option value="35 mm">35 mm</option>
                <option value="40 mm">40 mm</option>
                <option value="42 mm">42 mm</option>
                <option value="50 mm">50 mm</option>
                <option value="54 mm">54 mm</option>
                <option value="63 mm">63 mm</option>
                <option value="76.1 mm">76.1 mm</option>
              </select>
            </div>
            <div className="flex gap-3">
              <select
                name="new_outlet_material"
                defaultValue={existingProtocol?.new_meter_data?.outlet_material ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.new_meter_data?.outlet_material ? 'text-gray-900' : 'text-gray-400'}`}
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
                name="new_outlet_size"
                defaultValue={existingProtocol?.new_meter_data?.outlet_size ?? "Grösse"}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '' || e.currentTarget.value === 'Grösse')}
                className={`w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.new_meter_data?.outlet_size && existingProtocol?.new_meter_data?.outlet_size !== 'Grösse' ? 'text-gray-900' : 'text-gray-400'}`}
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="Grösse">Grösse</option>
                <option value='1/2"'>1/2&quot;</option>
                <option value='3/4"'>3/4&quot;</option>
                <option value='1"'>1&quot;</option>
                <option value='1 1/4"'>1 1/4&quot;</option>
                <option value='1 1/2"'>1 1/2&quot;</option>
                <option value='2"'>2&quot;</option>
                <option value='2 1/2"'>2 1/2&quot;</option>
                <option value='3"'>3&quot;</option>
                <option value="15 mm">15 mm</option>
                <option value="16 mm">16 mm</option>
                <option value="18 mm">18 mm</option>
                <option value="20 mm">20 mm</option>
                <option value="22 mm">22 mm</option>
                <option value="26 mm">26 mm</option>
                <option value="28 mm">28 mm</option>
                <option value="32 mm">32 mm</option>
                <option value="35 mm">35 mm</option>
                <option value="40 mm">40 mm</option>
                <option value="42 mm">42 mm</option>
                <option value="50 mm">50 mm</option>
                <option value="54 mm">54 mm</option>
                <option value="63 mm">63 mm</option>
                <option value="76.1 mm">76.1 mm</option>
              </select>
            </div>
            <div>
              <select
                name="new_installation_type"
                defaultValue={existingProtocol?.new_meter_data?.installation_type ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.new_meter_data?.installation_type ? 'text-gray-900' : 'text-gray-400'}`}
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              >
                <option value="">Einbauart *</option>
                <option>waagerecht</option>
                <option>senkrecht</option>
              </select>
            </div>
            <div>
              <select
                name="new_installation_location"
                defaultValue={existingProtocol?.new_meter_data?.installation_location ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.new_meter_data?.installation_location ? 'text-gray-900' : 'text-gray-400'}`}
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
                name="new_year_vintage"
                defaultValue={existingProtocol?.new_meter_data?.year_vintage ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.new_meter_data?.year_vintage ? 'text-gray-900' : 'text-gray-400'}`}
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
                name="new_installation_date"
                placeholder="Einbaudatum"
                defaultValue={existingProtocol?.new_meter_data?.installation_date ?? ""}
                onChange={(e) => e.currentTarget.classList.toggle('text-gray-400', e.currentTarget.value === '')}
                className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 ${existingProtocol?.new_meter_data?.installation_date ? 'text-gray-900' : 'text-gray-400'}`}
                style={{ ['--tw-ring-color' as any]: '#F3923620' }}
              />
            </div>
          </div>
        </div>
        }

        {/* Bemerkung */}
        <div>
          <label className="sr-only">Bemerkung</label>
          <textarea name="notes"
              placeholder="Eine Bemerkung verfassen..." defaultValue={existingProtocol?.notes ?? ''} className="w-full min-h-[96px] rounded-lg border border-gray-300 bg-white px-3 py-3 focus:outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: '#F3923620' }} />
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
              disabled={!agree || isSubmitting}
              className="w-full px-5 py-2.5 rounded-lg text-white text-base font-medium shadow-sm disabled:opacity-60"
              style={{ backgroundColor: '#4b4b4b' }}
            >
              {isSubmitting 
                ? 'Wird gespeichert...' 
                : existingProtocol 
                  ? 'Protokoll aktualisieren und versenden'
                  : 'Protokoll an die Gemeinde versenden'
              }
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

