'use client'

import { BrandsTable } from '@/components/admin/BrandsTable'

export default function BrandsPage() {
  const handleDeleteBrand = (brandId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diese Marke löschen möchten?')) {
      // TODO: Implement delete functionality
      console.log('Deleting brand:', brandId)
    }
  }

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
      />
    </div>
  )
} 