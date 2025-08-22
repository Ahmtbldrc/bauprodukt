'use client'

import React from 'react'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-orange-500'
                  : 'border-transparent'
              }`}
              style={{
                color: activeTab === tab.id ? '#F39237' : '#6b7280',
                borderBottomColor: activeTab === tab.id ? '#F39237' : 'transparent'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#F39237'
                  e.currentTarget.style.borderBottomColor = '#F39237'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#6b7280'
                  e.currentTarget.style.borderBottomColor = 'transparent'
                }
              }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
