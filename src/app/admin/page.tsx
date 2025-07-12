'use client'

import { useState } from 'react'

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('Ausstehend')

  // E-commerce data structures
  const topProducts = [
    { id: 1, name: 'Portland Zement 25kg', sales: 156, revenue: 23400, trend: '+12%', category: 'Zement' },
    { id: 2, name: 'Baustahl 12mm', sales: 89, revenue: 18900, trend: '+8%', category: 'Stahl' },
    { id: 3, name: 'Grundierungsfarbe Weiss 15L', sales: 67, revenue: 12600, trend: '-3%', category: 'Farbe' },
    { id: 4, name: 'Rote Ziegel 1000 Stück', sales: 45, revenue: 9800, trend: '+5%', category: 'Ziegel' },
    { id: 5, name: 'Keramikfliesen 60x60', sales: 34, revenue: 8500, trend: '+15%', category: 'Keramik' },
  ]

  const stockAlerts = [
    { id: 1, product: 'Portland Zement 25kg', currentStock: 12, criticalLevel: 15, status: 'critical', category: 'Zement' },
    { id: 2, product: 'Grundierungsfarbe Weiss 15L', currentStock: 28, criticalLevel: 30, status: 'warning', category: 'Farbe' },
    { id: 3, product: 'Baustahl 8mm', currentStock: 45, criticalLevel: 50, status: 'warning', category: 'Stahl' },
    { id: 4, product: 'Bausand 1m³', currentStock: 8, criticalLevel: 20, status: 'critical', category: 'Zuschlagstoffe' },
  ]

  // KPI data
  const kpiData = {
    todaySales: { value: 12450, target: 15000, percentage: 83 },
    monthlyRevenue: { value: 245600, lastMonth: 198700, growth: 23.6 },
    newCustomers: { value: 28, target: 30, percentage: 93 },
    averageOrderValue: { value: 1850, lastWeek: 1720, growth: 7.6 },
  }

  const orders = [
    {
      id: 1,
      title: 'Bestellung #12345',
      description: 'Zement & Materialien - Kadir K.',
      color: 'bg-yellow-100 border-yellow-200',
      iconColor: 'text-yellow-500',
      icon: '⏳',
      status: 'Ausstehend',
      amount: 'CHF 2.450,00'
    },
    {
      id: 2,
      title: 'Bestellung #12344',
      description: 'Stahlbewehrung & Beton - Kadir D.',
      color: 'bg-blue-100 border-blue-200',
      iconColor: 'text-blue-500',
      icon: '🚚',
      status: 'Versandt',
      amount: 'CHF 5.780,00'
    },
    {
      id: 3,
      title: 'Bestellung #12343',
      description: 'Isolationsmaterialien - Ali K.',
      color: 'bg-green-100 border-green-200',
      iconColor: 'text-green-500',
      icon: '✅',
      status: 'Abgeschlossen',
      amount: 'CHF 1.290,00'
    },
    {
      id: 4,
      title: 'Bestellung #12342',
      description: 'Sanitärartikel - Fatma Ö.',
      color: 'bg-red-100 border-red-200',
      iconColor: 'text-red-500',
      icon: '❌',
      status: 'Storniert',
      amount: 'CHF 890,00'
    }
  ]

  return (
    <div className="space-y-12">
      {/* Page Title */}
      <div className="ml-0">
        <p className="text-sm text-gray-500 mb-2">Verwalten und verfolgen Sie Ihr E-Commerce-Geschäft</p>
        <h1 className="text-3xl font-bold text-gray-900">E-Commerce Dashboard</h1>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Orders */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl p-6 min-h-[68vh] max-h-[78vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Bestellungen</h3>
            <button className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Tab Buttons */}
          <div className="flex space-x-1 mb-6">
            {['Ausstehend', 'Abgeschlossen'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTab === tab
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Order Count */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-bold">
              {orders.length}
            </div>
            <span className="text-sm text-gray-600">Gesamtbestellungen</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Orders */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3 pr-2">
              {orders
                .filter(order => {
                  if (selectedTab === 'Ausstehend') {
                    return order.status === 'Ausstehend' || order.status === 'Versandt'
                  }
                  if (selectedTab === 'Abgeschlossen') {
                    return order.status === 'Abgeschlossen' || order.status === 'Storniert'
                  }
                  return true
                })
                .map((order) => (
                <div key={order.id} className={`p-3 rounded-lg border-2 ${order.color} relative`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xl">{order.icon}</span>
                    <div className="text-right">
                      <span className="text-xs font-medium text-gray-500 block">{order.status}</span>
                      <span className="text-sm font-bold text-gray-900">{order.amount}</span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{order.title}</h4>
                  <p className="text-xs text-gray-600">{order.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center Column */}
      <div className="lg:col-span-2">
        <div className="min-h-[68vh] max-h-[78vh] overflow-hidden flex flex-col space-y-3">
          {/* Projects Overview and Income VS Expense */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
            {/* Order Status */}
            <div className="bg-white rounded-2xl p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bestellstatus</h3>
              <div className="flex space-x-2">
                <button className="p-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                <button className="p-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              {/* Donut Chart */}
              <div className="relative w-56 h-56">
                <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle cx="60" cy="60" r="35" fill="none" stroke="#f3f4f6" strokeWidth="8"/>
                  
                  {/* Geliefert - 45% (162 degrees) */}
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="35" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="8" 
                    strokeDasharray="98.96 121.22"
                    strokeLinecap="round"
                    className="drop-shadow-sm"
                  />
                  
                  {/* In Lieferung - 35% (126 degrees) */}
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="35" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="8"
                    strokeDasharray="76.97 143.21"
                    strokeDashoffset="-102"
                    strokeLinecap="round"
                    className="drop-shadow-sm"
                  />
                  
                  {/* Wartend - 20% (72 degrees) */}
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="35" 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="8"
                    strokeDasharray="43.98 176.2"
                    strokeDashoffset="-183"
                    strokeLinecap="round"
                    className="drop-shadow-sm"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">100</p>
                    <p className="text-sm text-gray-500">Bestellungen</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Geliefert</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">45</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">In Lieferung</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">35</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Wartend</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">20</span>
              </div>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="bg-white rounded-2xl p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lagerbestandswarnungen</h3>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600">
                    {stockAlerts.filter(alert => alert.status === 'critical').length}
                  </span>
                </div>
                <button className="p-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {stockAlerts.slice(0, 2).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-xl border-2 ${
                  alert.status === 'critical' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          alert.status === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className="text-xs font-medium text-gray-500">{alert.category}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">{alert.product}</h4>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-600">
                          Aktuell: <span className="font-medium">{alert.currentStock}</span>
                        </span>
                        <span className="text-xs text-gray-600">
                          Kritisch: <span className="font-medium">{alert.criticalLevel}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${
                        alert.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {alert.status === 'critical' ? 'KRITISCH' : 'WARNUNG'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {alert.criticalLevel - alert.currentStock > 0 ? 
                          `${alert.criticalLevel - alert.currentStock} Stück hinzufügen` : 
                          'Lager ausreichend'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          alert.status === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min((alert.currentStock / alert.criticalLevel) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center space-x-1 py-2 bg-transparent hover:bg-transparent transition-colors">
                <span>Alle Lagerbestände anzeigen</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="bg-white rounded-2xl p-4 max-w-full overflow-hidden flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Bestseller</h3>
            <button className="text-xs text-blue-600 hover:text-blue-700">
              Alle
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {topProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-gray-900 truncate">{product.name}</h4>
                  <span className="text-xs text-gray-500">{product.sales} Verkäufe</span>
                </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs font-bold text-gray-900">CHF {product.revenue.toLocaleString('de-CH')}</div>
                    <div className={`text-xs ${
                      product.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.trend}
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-1 min-h-[68vh] max-h-[78vh] overflow-hidden flex flex-col">
        {/* KPI Cards */}
        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Today's Sales */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Ziel: CHF {kpiData.todaySales.target.toLocaleString('de-CH')}</div>
                <div className="text-xs text-blue-600">{kpiData.todaySales.percentage}%</div>
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900 mb-1">
              CHF {kpiData.todaySales.value.toLocaleString('de-CH')}
            </div>
            <div className="text-sm text-gray-600 mb-2">Heutige Verkäufe</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${kpiData.todaySales.percentage}%` }}></div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-600">+{kpiData.monthlyRevenue.growth}%</div>
                <div className="text-xs text-gray-500">vs. letzter Monat</div>
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900 mb-1">
              CHF {kpiData.monthlyRevenue.value.toLocaleString('de-CH')}
            </div>
            <div className="text-sm text-gray-600">Monatlicher Umsatz</div>
          </div>

          {/* New Customers */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Ziel: {kpiData.newCustomers.target}</div>
                <div className="text-xs text-purple-600">{kpiData.newCustomers.percentage}%</div>
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900 mb-1">
              {kpiData.newCustomers.value}
            </div>
            <div className="text-sm text-gray-600 mb-2">Neue Kunden</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${kpiData.newCustomers.percentage}%` }}></div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-orange-600">+{kpiData.averageOrderValue.growth}%</div>
                <div className="text-xs text-gray-500">vs. letzte Woche</div>
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900 mb-2">
              CHF {kpiData.averageOrderValue.value.toLocaleString('de-CH')}
            </div>
            <div className="text-sm text-gray-600 mb-3">Durchschn. Bestellwert</div>
            <div className="text-xs text-gray-500">Anstieg zur Vorwoche</div>
          </div>
        </div>

      </div>
    </div>
    </div>
  )
} 