'use client'

import { CategoriesTable } from '@/components/admin/CategoriesTable'

export default function CategoriesPage() {
  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten?')) {
      // TODO: Implement delete functionality
      console.log('Deleting category:', categoryId)
      console.log('Category ID:', categoryId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kategorien</h1>
          <p className="text-gray-600">Kategorieverwaltung und -verfolgung</p>
        </div>
      </div>
      
      <CategoriesTable 
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  )
} 