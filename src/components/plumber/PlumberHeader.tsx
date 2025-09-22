'use client'

import Link from 'next/link'
import Image from 'next/image'
import { LogOut } from 'lucide-react'
import { usePlumberAuth } from '@/contexts/PlumberAuthContext'
import { useRouter } from 'next/navigation'

export function PlumberHeader() {
  const { user, logout } = usePlumberAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/calculator')
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  return (
    <header className="py-4">
      <div className="flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-1 flex justify-start -ml-12">
          <Link href="/plumber" className="flex items-center">
            <div className="relative">
              <Image src="/Bauprodukt-Logo.svg" alt="Bauprodukt" width={192} height={48} className="w-48 h-auto block" />
            </div>
          </Link>
        </div>

        {/* Center: Placeholder (could hold filters later) */}
        <div className="flex-1 flex justify-center" />

        {/* Right: User + Logout */}
        <div className="flex-1 flex items-center justify-end space-x-3 pr-6">
          <button 
            onClick={handleLogout}
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-sm transition-all duration-200"
            title="Abmelden"
          >
            <LogOut size={20} />
          </button>
          <div className="text-left">
            <p className="text-base font-medium text-gray-900">{user?.fullName || user?.email}</p>
            <p className="text-xs text-gray-500">Installateur</p>
          </div>
        </div>
      </div>
    </header>
  )
}


