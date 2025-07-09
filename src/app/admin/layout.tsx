import { AdminLayout } from '@/components/admin/AdminLayout'
import { ReactNode } from 'react'

interface AdminRootLayoutProps {
  children: ReactNode
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  )
} 