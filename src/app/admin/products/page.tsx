'use client'

import { ProductsTable } from '@/components/admin/ProductsTable'

export default function ProductsPage() {
  const handleDeleteProduct = (productId: string) => {
    if (confirm('Sind Sie sicher, dass Sie dieses Produkt löschen möchten?')) {
      // TODO: Implement delete functionality
      console.log('Deleting product:', productId)
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