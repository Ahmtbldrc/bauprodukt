'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Mail, Bell, HelpCircle, Settings } from 'lucide-react'

export function AdminHeader() {
  const [activeFilter, setActiveFilter] = useState('Dieser Monat')
  
  const timeFilters = ['Heute', 'Diese Woche', 'Dieser Monat', 'Berichte']

  return (
    <header className="py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Logo */}
        <div className="flex-1 flex justify-start -ml-12">
          <Link href="/admin" className="flex items-center">
            <div className="relative">
              <img 
                src="/Bauprodukt-Logo.svg" 
                alt="Bauprodukt" 
                className="w-48 h-auto block"
                style={{ maxWidth: '192px', height: 'auto' }}
              />
              <span 
                className="text-xl font-bold text-gray-900 absolute top-0 left-0 hidden"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                Bauprodukt
              </span>
            </div>
          </Link>
        </div>
        
        {/* Center Section - Time Filters */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center space-x-1">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-8 py-3 text-sm font-medium rounded-full border border-gray-300 transition-all duration-200 ${
                  activeFilter === filter
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                style={{ fontFamily: 'var(--font-blinker)' }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        
        {/* Right Section - User */}
        <div className="flex-1 flex items-center justify-end space-x-2 pr-6">
          {/* Mail Button */}
          <button className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200">
            <Mail size={20} />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#eeeeee]"></div>
          </button>

          {/* Bell Notification Button */}
          <button className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200">
            <Bell size={20} />
          </button>

          {/* Help Button */}
          <button className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200">
            <HelpCircle size={20} />
          </button>

          {/* Settings Button */}
          <button className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200">
            <Settings size={20} />
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 ml-2">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Benutzer-Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <p className="text-base font-medium text-gray-900" style={{ fontFamily: 'var(--font-blinker)' }}>Hans Schmidt</p>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-blinker)' }}>Projektmanager</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 