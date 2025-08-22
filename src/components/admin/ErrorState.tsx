'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ErrorStateProps {
  error?: Error | null
  title?: string
  backUrl?: string
  message?: string
}

export default function ErrorState({ 
  error, 
  title = 'Bir Hata Oluştu', 
  backUrl = '/admin',
  message
}: ErrorStateProps) {
  const errorMessage = message || error?.message || 'Bilinmeyen bir hata oluştu.'

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={backUrl}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">Bir sorun oluştu</p>
        </div>
      </div>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{errorMessage}</p>
      </div>
    </div>
  )
}
