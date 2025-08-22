'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backUrl: string
  rightContent?: React.ReactNode
}

export default function PageHeader({ title, subtitle, backUrl, rightContent }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link
          href={backUrl}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {rightContent && (
        <div className="flex items-center space-x-4">
          {rightContent}
        </div>
      )}
    </div>
  )
}
