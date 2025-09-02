'use client'

import { CategoriesTable } from '@/components/admin/CategoriesTable'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAllCategories, useSubCategories } from '@/hooks/useCategories'

export default function CategoriesPage() {
  const queryClient = useQueryClient()

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editSlugTouched, setEditSlugTouched] = useState(false)
  const [editIconPreview, setEditIconPreview] = useState<string | undefined>(undefined)
  const [editIconUploading, setEditIconUploading] = useState(false)
  const editIconInputRef = useRef<HTMLInputElement>(null)
  const [editParentId, setEditParentId] = useState<string | ''>('')
  const [editSelectedSubIds, setEditSelectedSubIds] = useState<string[]>([])

  const { data: allCategoriesResponse } = useAllCategories()
  const allCategories = allCategoriesResponse?.data || []
  const { data: subCategoriesResponse } = useSubCategories()
  const subCategories = subCategoriesResponse?.data || []

  

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Fehler beim Löschen der Kategorie')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Kategorie erfolgreich gelöscht')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsDeleteOpen(false)
      setDeleteCategoryId(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Löschen fehlgeschlagen')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; name?: string; slug?: string }) => {
      const bodyPayload: any = {
        name: payload.name,
        slug: payload.slug,
      }
      // Only main category edit can assign subcategories
      if (activeTab === 'main' && editSelectedSubIds.length > 0) {
        bodyPayload.subcategory_ids = editSelectedSubIds
      }

      const res = await fetch(`/api/categories/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Fehler beim Aktualisieren der Kategorie')
      }
      const updated = await res.json()

      // If new icon selected, upload it
      const file = editIconInputRef.current?.files?.[0]
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const iconRes = await fetch(`/api/categories/${updated.id}/icon`, { method: 'POST', body: formData })
        if (!iconRes.ok) {
          const errTxt = await iconRes.text()
          let errMsg = 'Icon-Upload fehlgeschlagen'
          try { errMsg = (JSON.parse(errTxt)?.error) || errMsg } catch {}
          throw new Error(errMsg)
        }
      }

      return updated
    },
    onSuccess: () => {
      toast.success('Kategorie erfolgreich aktualisiert')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsEditOpen(false)
      setEditingCategory(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Aktualisierung fehlgeschlagen')
    }
  })

  

  const handleDeleteCategory = (categoryId: string) => {
    setDeleteCategoryId(categoryId)
    setIsDeleteOpen(true)
  }

  const handleEditCategory = (category: { id: string; name: string; slug: string } & { emoji?: string | null; icon_url?: string | null; parent?: { id: string; name: string } | null }) => {
    setEditingCategory(category)
    setEditName(category.name)
    setEditSlug(category.slug)
    setEditSlugTouched(false)
    setEditIconPreview((category as any).icon_url || undefined)
    setEditParentId((category as any).parent?.id || '')
    setEditSelectedSubIds([])
    setIsEditOpen(true)
  }

  const generateSlug = (text: string) =>
    (() => {
      const turkishMap: Record<string, string> = {
        'ı': 'i', 'İ': 'i',
        'ö': 'o', 'Ö': 'o',
        'ü': 'u', 'Ü': 'u',
        'ç': 'c', 'Ç': 'c',
        'ğ': 'g', 'Ğ': 'g',
        'ş': 's', 'Ş': 's',
      }
      const replaced = text.replace(/[ıİöÖüÜçÇğĞşŞ]/g, (ch) => turkishMap[ch] || ch)
      return replaced
        .toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}+/gu, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    })()

  const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createSlugTouched, setCreateSlugTouched] = useState(false)
  
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([])
  const [createIconPreview, setCreateIconPreview] = useState<string | undefined>(undefined)
  const [createIconUploading, setCreateIconUploading] = useState(false)
  const createIconInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!createSlugTouched) {
      setCreateSlug(generateSlug(createName))
    }
  }, [createName, createSlugTouched])

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: createName.trim(),
        slug: createSlug.trim(),
      }
      if (activeTab === 'main') {
        payload.parent_id = null
        payload.subcategory_ids = selectedSubcategoryIds
      }
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Kategori oluşturma başarısız')
      }
      const created = await res.json()

      // If SVG selected, upload icon
      const file = createIconInputRef.current?.files?.[0]
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const iconRes = await fetch(`/api/categories/${created.id}/icon`, { method: 'POST', body: formData })
        if (!iconRes.ok) {
          const errTxt = await iconRes.text()
          let errMsg = 'Icon-Upload başarısız'
          try { errMsg = (JSON.parse(errTxt)?.error) || errMsg } catch {}
          throw new Error(errMsg)
        }
      }

      return created
    },
    onSuccess: () => {
      toast.success('Kategori oluşturuldu')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsCreateOpen(false)
      setCreateName('')
      setCreateSlug('')
      setCreateSlugTouched(false)
      setSelectedSubcategoryIds([])
      setCreateIconPreview(undefined)
      if (createIconInputRef.current) createIconInputRef.current.value = ''
    },
    onError: (error: any) => toast.error(error?.message || 'Oluşturma başarısız')
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kategorien</h1>
          <p className="text-gray-600">Kategorieverwaltung und -verfolgung</p>
        </div>
        <div />
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('main')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'main' ? 'border-b-2' : 'text-gray-500'}`}
            style={activeTab === 'main' ? { borderColor: '#F39237', color: '#111827' } : {}}
          >
            Ana Kategoriler
          </button>
          <button
            onClick={() => setActiveTab('sub')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'sub' ? 'border-b-2' : 'text-gray-500'}`}
            style={activeTab === 'sub' ? { borderColor: '#F39237', color: '#111827' } : {}}
          >
            Alt Kategoriler
          </button>
        </div>
        <div className="p-4 space-y-4">
          {activeTab === 'main' ? (
            <div className="flex justify-end">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: '#F39237' }}
              >
                Ana Kategori Ekle
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: '#F39237' }}
              >
                Alt Kategori Ekle
              </button>
            </div>
          )}
          {activeTab === 'main' ? (
            <CategoriesTable 
              onDeleteCategory={handleDeleteCategory}
              onEditCategory={handleEditCategory}
              categoryType="main"
            />
          ) : (
            <CategoriesTable 
              onDeleteCategory={handleDeleteCategory}
              onEditCategory={handleEditCategory}
              categoryType="sub"
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => !deleteMutation.isPending && setIsDeleteOpen(false)}
        onConfirm={() => deleteCategoryId && deleteMutation.mutate(deleteCategoryId)}
        title="Kategorie löschen?"
        message="Diese Aktion kann nicht rückgängig gemacht werden. Möchten Sie die Kategorie wirklich löschen?"
        confirmText="Löschen"
        cancelText="Abbrechen"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />

      {isEditOpen && editingCategory && (
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

            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategorie bearbeiten</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    const value = e.target.value
                    setEditName(value)
                    if (!editSlugTouched) setEditSlug(generateSlug(value))
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237]"
                  placeholder="z.B. Werkzeuge"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => {
                    setEditSlug(e.target.value)
                    setEditSlugTouched(true)
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237]"
                  placeholder="z.B. werkzeuge"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (SVG)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 relative rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                    {editIconPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editIconPreview} alt="Icon Preview" className="w-10 h-10" />
                    ) : (
                      <span className="text-gray-400 text-xs">SVG</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editIconInputRef.current?.click()}
                      className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
                      disabled={editIconUploading || updateMutation.isPending}
                      style={{ color: '#F39237', borderColor: '#F39237' }}
                    >
                      {editIconUploading ? 'Wird gewählt...' : (editIconPreview ? 'Icon ändern' : 'Icon hochladen')}
                    </button>
                    {editIconPreview && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editingCategory) return
                          // Remove existing icon via API
                          const res = await fetch(`/api/categories/${editingCategory.id}/icon`, { method: 'DELETE' })
                          if (res.ok) {
                            setEditIconPreview(undefined)
                            if (editIconInputRef.current) editIconInputRef.current.value = ''
                            toast.success('Icon entfernt')
                          } else {
                            toast.error('Icon konnte nicht entfernt werden')
                          }
                        }}
                        className="px-3 py-2 rounded-lg border text-sm text-red-600 border-red-300 disabled:opacity-50"
                        disabled={editIconUploading || updateMutation.isPending}
                      >
                        Entfernen
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={editIconInputRef}
                  type="file"
                  accept="image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setEditIconUploading(true)
                    const objectUrl = URL.createObjectURL(file)
                    setEditIconPreview(objectUrl)
                    setEditIconUploading(false)
                  }}
                />
              </div>
              {editingCategory && !editingCategory.parent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt Kategoriler (bağla)</label>
                  <div className="max-h-40 overflow-auto border rounded">
                    {subCategories.map((sub: any) => (
                      <label key={sub.id} className="flex items-center gap-2 p-2 border-b last:border-b-0">
                        <input
                          type="checkbox"
                          checked={editSelectedSubIds.includes(sub.id)}
                          onChange={(e) => {
                            setEditSelectedSubIds((prev) => {
                              if (e.target.checked) return Array.from(new Set([...prev, sub.id]))
                              return prev.filter((id) => id !== sub.id)
                            })
                          }}
                        />
                        <span>{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
                onClick={async () => editingCategory && updateMutation.mutate({ 
                  id: editingCategory.id, 
                  name: editName.trim(), 
                  slug: editSlug.trim() || undefined,
                })}
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

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => !createMutation.isPending && setIsCreateOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <button
              onClick={() => !createMutation.isPending && setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={createMutation.isPending}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {activeTab === 'main' ? 'Ana Kategori Ekle' : 'Alt Kategori Ekle'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237]"
                  placeholder="Örn. El Aletleri"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={createSlug}
                  onChange={(e) => { setCreateSlug(e.target.value); setCreateSlugTouched(true) }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#F39237] focus:border-[#F39237]"
                  placeholder="orn-el-aletleri"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (SVG)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 relative rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                    {createIconPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={createIconPreview} alt="Icon Preview" className="w-10 h-10" />
                    ) : (
                      <span className="text-gray-400 text-xs">SVG</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => createIconInputRef.current?.click()}
                      className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
                      disabled={createIconUploading || createMutation.isPending}
                      style={{ color: '#F39237', borderColor: '#F39237' }}
                    >
                      {createIconUploading ? 'Seçiliyor...' : (createIconPreview ? 'Icon değiştir' : 'Icon yükle')}
                    </button>
                    {createIconPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setCreateIconPreview(undefined)
                          if (createIconInputRef.current) createIconInputRef.current.value = ''
                        }}
                        className="px-3 py-2 rounded-lg border text-sm text-red-600 border-red-300 disabled:opacity-50"
                        disabled={createIconUploading || createMutation.isPending}
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={createIconInputRef}
                  type="file"
                  accept="image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setCreateIconUploading(true)
                    const objectUrl = URL.createObjectURL(file)
                    setCreateIconPreview(objectUrl)
                    setCreateIconUploading(false)
                  }}
                />
              </div>
              {/* No parent selection for subcategories */}
              {activeTab === 'main' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt Kategoriler (opsiyonel)</label>
                  <div className="max-h-40 overflow-auto border rounded">
                    {subCategories.map((sub: any) => (
                      <label key={sub.id} className="flex items-center gap-2 p-2 border-b last:border-b-0">
                        <input
                          type="checkbox"
                          checked={selectedSubcategoryIds.includes(sub.id)}
                          onChange={(e) => {
                            setSelectedSubcategoryIds((prev) => {
                              if (e.target.checked) return Array.from(new Set([...prev, sub.id]))
                              return prev.filter((id) => id !== sub.id)
                            })
                          }}
                        />
                        <span>{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded-lg border disabled:opacity-50"
                style={{ color: '#F39237', borderColor: '#F39237' }}
              >
                İptal
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!createName.trim() || !createSlug.trim() || createMutation.isPending}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: '#F39237' }}
              >
                {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
} 