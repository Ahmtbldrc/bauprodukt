"use client"

import InstallationInfoPrefill from '@/components/plumber/InstallationInfoPrefill'

export default function CalculatorAPage() {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Service Public</h2>
        <p className="text-gray-600">Bestimmung Belastungswerte, Spitzendurchfluss und Wasserzähler</p>
      </div>
      <InstallationInfoPrefill />
      <p className="text-gray-600">Bu sayfa daha sonra doldurulacak placeholder içeriktir.</p>
    </div>
  )
}


