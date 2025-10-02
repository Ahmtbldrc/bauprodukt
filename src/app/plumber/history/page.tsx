'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui'

type SavedCalc = {
  id: number
  name: string
  createdAt: string
  inputs: { counts: Record<string, number | undefined>; method: 'm1' | 'm2'; includeHydrantExtra?: boolean }
  result: { totalLU: number; totalLps: number; totalM3PerHour: number; dn: string | null }
}

const STORAGE_KEY = 'bauprodukt_calc_results_v1'

export default function PlumberHistoryPage() {
  const router = useRouter()
  const [items, setItems] = React.useState<SavedCalc[]>([])
  const [selected, setSelected] = React.useState<SavedCalc | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [confirmItem, setConfirmItem] = React.useState<SavedCalc | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmLoading, setConfirmLoading] = React.useState(false)
  const pageSize = 10

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const list = raw ? (JSON.parse(raw) as SavedCalc[]) : []
      setItems(list.sort((a, b) => b.id - a.id))
    } catch {
      setItems([])
    }
  }, [])

  function formatDate(iso?: string) {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString('de-CH')
    } catch {
      return iso
    }
  }

  function openDialog(it: SavedCalc) {
    setSelected(it)
    setIsDialogOpen(true)
  }

  function deleteItem(id: number) {
    setItems(prev => {
      const next = prev.filter(x => x.id !== id)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {}
      }
      return next
    })
    setIsDialogOpen(false)
    setSelected(null)
  }

  function requestDelete(it: SavedCalc) {
    setConfirmItem(it)
    setConfirmOpen(true)
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const pageItems = items.slice(startIndex, startIndex + pageSize)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Berechnungsverlauf</h1>
        <button
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          onClick={() => router.push('/plumber/calculator')}
        >
          Neue Berechnung
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-600">Keine gespeicherten Berechnungen gefunden.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {pageItems.map((it) => (
              <div key={it.id} className="rounded-xl border border-gray-200 bg-white p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">{it.name || 'Unbenannte Berechnung'}</div>
                  <div className="text-xs text-gray-500">{formatDate(it.createdAt)}</div>
                  <div className="text-xs text-gray-600">
                    LU: {(it.result.totalLU * 0.1).toLocaleString('de-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    {' '}| QD (l/s): {it.result.totalLps.toLocaleString('de-CH', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                    {' '}| m³/h: {it.result.totalM3PerHour.toLocaleString('de-CH', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                    {' '}| DN: {it.result.dn ?? '–'}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <button
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => openDialog(it)}
                  >
                    Ergebnisse anzeigen
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg text-white font-medium shadow-sm hover:opacity-95 transition"
                    style={{ backgroundColor: '#F39236' }}
                    onClick={() => router.push('/plumber/protocol/create')}
                  >
                    Protokoll erstellen
                  </button>
                  <button
                    className="p-2 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50"
                    onClick={() => requestDelete(it)}
                    aria-label="Löschen"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Zurück
            </button>
            <span className="text-sm text-gray-600">Seite {currentPage} von {totalPages}</span>
            <button
              className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Weiter
            </button>
          </div>
        </>
      )}

      {/* Results Dialog */}
      {isDialogOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur to match ConfirmDialog */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setIsDialogOpen(false)}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-900">Ergebnisse – {selected.name || 'Unbenannte Berechnung'}</div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setIsDialogOpen(false)} aria-label="Schliessen">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Total LU</div>
                  <div className="text-lg font-semibold text-gray-900">{(selected.result.totalLU * 0.1).toLocaleString('de-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Spitzendurchfluss (l/s)</div>
                  <div className="text-lg font-semibold text-gray-900">{selected.result.totalLps.toLocaleString('de-CH', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Volumenstrom (m³/h)</div>
                  <div className="text-lg font-semibold text-gray-900">{selected.result.totalM3PerHour.toLocaleString('de-CH', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Empfohlener DN</div>
                  <div className="text-lg font-semibold text-gray-900">{selected.result.dn ?? '–'}</div>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                Methode: {selected.inputs.method === 'm1' ? 'Methode 1' : 'Methode 2'}
                {selected.inputs.includeHydrantExtra ? ' • Wasserlöschposten berücksichtigt' : ''}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:opacity-95 transition"
                style={{ backgroundColor: '#F39236' }}
                onClick={() => { setIsDialogOpen(false); router.push('/plumber/calculator') }}
              >
                Im Rechner ansehen
              </button>
              <button
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setIsDialogOpen(false)}
              >
                Schliessen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setConfirmItem(null) }}
        onConfirm={async () => {
          if (!confirmItem) return
          try {
            setConfirmLoading(true)
            deleteItem(confirmItem.id)
          } finally {
            setConfirmLoading(false)
            setConfirmOpen(false)
            setConfirmItem(null)
          }
        }}
        title="Eintrag löschen"
        message={`Möchten Sie die Berechnung "${confirmItem?.name || 'Unbenannte Berechnung'}" dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Ja, löschen"
        cancelText="Abbrechen"
        variant="danger"
      />
    </div>
  )
}


