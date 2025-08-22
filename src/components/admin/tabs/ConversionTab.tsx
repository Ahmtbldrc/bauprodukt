'use client'

import { Calculator } from 'lucide-react'

interface ConversionFactors {
  length_units: boolean
  weight_units: boolean
  volume_units: boolean
  temperature_units: boolean
}

interface ConversionTabProps {
  conversionFactors: ConversionFactors
  setConversionFactors: (factors: ConversionFactors | ((prev: ConversionFactors) => ConversionFactors)) => void
}

export default function ConversionTab({ conversionFactors, setConversionFactors }: ConversionTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-6 w-6 text-[#F39236]" />
        <h3 className="text-xl font-semibold text-gray-900">Dönüşüm Faktörleri</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Uzunluk Birimleri</h4>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={conversionFactors.length_units}
                onChange={(e) => setConversionFactors(prev => ({ ...prev, length_units: e.target.checked }))}
                className="h-4 w-4 text-[#F39236] focus:ring-[#F39236] border-gray-300 rounded"
                style={{accentColor: '#F39236'}}
              />
              <label className="ml-2 text-sm text-gray-700">
                Uzunluk birimlerini göster
              </label>
            </div>
            
            <div className="ml-6 space-y-2 text-sm text-gray-600">
              <p>• 1 Metre (m) = 100 cm</p>
              <p>• 1 Santimetre (cm) = 10 mm</p>
              <p>• 1 Milimetre (mm) = 0.001 m</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Ağırlık Birimleri</h4>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={conversionFactors.weight_units}
                onChange={(e) => setConversionFactors(prev => ({ ...prev, weight_units: e.target.checked }))}
                className="h-4 w-4 text-[#F39236] focus:ring-[#F39236] border-gray-300 rounded"
                style={{accentColor: '#F39236'}}
              />
              <label className="ml-2 text-sm text-gray-700">
                Ağırlık birimlerini göster
              </label>
            </div>
            
            <div className="ml-6 space-y-2 text-sm text-gray-600">
              <p>• 1 Kilogram (kg) = 1000 g</p>
              <p>• 1 Gram (g) = 0.001 kg</p>
              <p>• 1 Ton (t) = 1000 kg</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Hacim Birimleri</h4>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={conversionFactors.volume_units}
                onChange={(e) => setConversionFactors(prev => ({ ...prev, volume_units: e.target.checked }))}
                className="h-4 w-4 text-[#F39236] focus:ring-[#F39236] border-gray-300 rounded"
                style={{accentColor: '#F39236'}}
              />
              <label className="ml-2 text-sm text-gray-700">
                Hacim birimlerini göster
              </label>
            </div>
            
            <div className="ml-6 space-y-2 text-sm text-gray-600">
              <p>• 1 Litre (L) = 1000 ml</p>
              <p>• 1 Mililitre (ml) = 0.001 L</p>
              <p>• 1 Metreküp (m³) = 1000 L</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Sıcaklık Birimleri</h4>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={conversionFactors.temperature_units}
                onChange={(e) => setConversionFactors(prev => ({ ...prev, temperature_units: e.target.checked }))}
                className="h-4 w-4 text-[#F39236] focus:ring-[#F39236] border-gray-300 rounded"
                style={{accentColor: '#F39236'}}
              />
              <label className="ml-2 text-sm text-gray-700">
                Sıcaklık birimlerini göster
              </label>
            </div>
            
            <div className="ml-6 space-y-2 text-sm text-gray-600">
              <p>• °C = (°F - 32) × 5/9</p>
              <p>• °F = (°C × 9/5) + 32</p>
              <p>• K = °C + 273.15</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
