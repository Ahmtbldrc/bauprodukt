'use client'

import { BrandsTable } from '@/components/admin/BrandsTable'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function BrandsPage() {
  const [deleteBrandId, setDeleteBrandId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (brandId: string) => {
      const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Fehler beim Löschen der Marke')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Marke erfolgreich gelöscht')
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      setIsDeleteOpen(false)
      setDeleteBrandId(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Löschen fehlgeschlagen')
    }
  })

  const handleDeleteBrand = (brandId: string) => {
    setDeleteBrandId(brandId)
    setIsDeleteOpen(true)
  }

  const handleEditBrand = (brand: { id: string; name: string; slug: string }) => {
    setEditingBrand(brand)
    setEditName(brand.name)
    setEditSlug(brand.slug)
    setIsEditOpen(true)
  }

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; name?: string; slug?: string }) => {
      const res = await fetch(`/api/brands/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: payload.name, slug: payload.slug })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Fehler beim Aktualisieren der Marke')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Marke erfolgreich aktualisiert')
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      setIsEditOpen(false)
      setEditingBrand(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Aktualisierung fehlgeschlagen')
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marken</h1>
          <p className="text-gray-600">Markenverwaltung und -verfolgung</p>
        </div>
      </div>
      
      <BrandsTable 
        onDeleteBrand={handleDeleteBrand}
        onEditBrand={handleEditBrand}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => !deleteMutation.isPending && setIsDeleteOpen(false)}
        onConfirm={() => deleteBrandId && deleteMutation.mutate(deleteBrandId)}
        title="Marke löschen?"
        message="Diese Aktion kann nicht rückgängig gemacht werden. Möchten Sie die Marke wirklich löschen?"
        confirmText="Löschen"
        cancelText="Abbrechen"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />

      {isEditOpen && editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => !updateMutation.isPending && setIsEditOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <button
              onClick={() => !updateMutation.isPending && setIsEditOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={updateMutation.isPending}
            >
              ×
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">Marke bearbeiten</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237]"
                  placeholder="z.B. Bosch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237]"
                  placeholder="z.B. bosch"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsEditOpen(false)}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-lg border disabled:opacity-50"
                style={{ color: '#F39237', borderColor: '#F39237' }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => editingBrand && updateMutation.mutate({ id: editingBrand.id, name: editName.trim(), slug: editSlug.trim() || undefined })}
                disabled={!editName.trim() || updateMutation.isPending}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: '#F39237' }}
              >
                {updateMutation.isPending ? 'Wird gespeichert...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 