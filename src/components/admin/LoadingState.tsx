'use client'

import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
}

export default function LoadingState({ message = 'Yükleniyor...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}
