'use client'

import { ProductsTable } from '@/components/admin/ProductsTable'

export default function ProductsPage() {
  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Löschen fehlgeschlagen')
      }
    } catch (e: any) {
      alert(e?.message || 'Beim Löschen ist ein Fehler aufgetreten')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produkte</h1>
          <p className="text-gray-600">Produktverwaltung und -verfolgung</p>
        </div>
      </div>
      
      <ProductsTable 
        onDeleteProduct={handleDeleteProduct}
      />
    </div>
  )
} 