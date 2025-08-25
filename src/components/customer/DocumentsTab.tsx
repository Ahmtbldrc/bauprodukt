'use client'

import { useState } from 'react'
import { FileText, Download, Eye, FileImage } from 'lucide-react'
import Image from 'next/image'
import { jsPDF } from 'jspdf'

interface ProductDocument {
  id: string
  title: string
  file_url: string
  file_type?: string
  file_size?: number
}

interface CustomerDocumentsTabProps {
  documents: ProductDocument[]
}

export default function CustomerDocumentsTab({ documents }: CustomerDocumentsTabProps) {
  const [selectedDocument, setSelectedDocument] = useState<ProductDocument | null>(null)
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false)
  const [isCombinedPdfViewerOpen, setIsCombinedPdfViewerOpen] = useState(false)
  const [combinedPdfUrl, setCombinedPdfUrl] = useState<string | null>(null)

  const handleViewDocument = (document: ProductDocument) => {
    setSelectedDocument(document)
    setIsPdfViewerOpen(true)
  }

  const handleDownloadPdf = async () => {
    if (!selectedDocument) return

    try {
      // Create a new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Add title
      pdf.setFontSize(20)
      pdf.text('Produktdokumente', 20, 30)
      
      // Add document title
      pdf.setFontSize(16)
      pdf.text(selectedDocument.title, 20, 50)
      
      // Add timestamp
      pdf.setFontSize(12)
      pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 70)
      
      // Add image to PDF using fetch
      try {
        const response = await fetch(selectedDocument.file_url)
        if (response.ok) {
          const blob = await response.blob()
          
          // Convert blob to base64
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const imgData = reader.result as string
              
              // Create temporary image to get dimensions using window.Image
              const tempImg = new window.Image()
              tempImg.onload = () => {
                try {
                  // Calculate image dimensions to fit on page
                  const imgWidth = 170 // A4 width - margins
                  const imgHeight = (tempImg.height * imgWidth) / tempImg.width
                  
                  // If image is too tall, scale it down
                  const maxHeight = 200
                  const finalHeight = Math.min(imgHeight, maxHeight)
                  const finalWidth = (tempImg.width * finalHeight) / tempImg.height
                  
                  // Center image horizontally
                  const x = (210 - finalWidth) / 2
                  
                  // Add image to PDF using base64 data
                  pdf.addImage(imgData, 'JPEG', x, 80, finalWidth, finalHeight)
                  
                  // Save PDF
                  pdf.save(`${selectedDocument.title}_dokumente.pdf`)
                } catch (error) {
                  console.error('Error adding image to PDF:', error)
                  pdf.text('Bild konnte nicht geladen werden', 20, 80)
                  pdf.save(`${selectedDocument.title}_dokumente.pdf`)
                }
              }
              
              tempImg.onerror = () => {
                pdf.text('Bild konnte nicht geladen werden', 20, 80)
                pdf.save(`${selectedDocument.title}_dokumente.pdf`)
              }
              
              tempImg.src = imgData
            } catch (error) {
              console.error('Error processing image data:', error)
              pdf.text('Bild konnte nicht geladen werden', 20, 80)
              pdf.save(`${selectedDocument.title}_dokumente.pdf`)
            }
          }
          
          reader.onerror = () => {
            pdf.text('Bild konnte nicht geladen werden', 20, 80)
            pdf.save(`${selectedDocument.title}_dokumente.pdf`)
          }
          
          reader.readAsDataURL(blob)
        } else {
          pdf.text('Bild konnte nicht geladen werden', 20, 80)
          pdf.save(`${selectedDocument.title}_dokumente.pdf`)
        }
      } catch (error) {
        console.error('Error fetching image:', error)
        pdf.text('Bild konnte nicht geladen werden', 20, 80)
        pdf.save(`${selectedDocument.title}_dokumente.pdf`)
      }
    } catch (error) {
      console.error('Error creating PDF:', error)
      alert('Fehler beim Erstellen der PDF-Datei')
    }
  }

  const handleDownloadAllAsPdf = async () => {
    if (documents.length === 0) return

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Process all images sequentially - each gets its own page
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        
        // Each document gets its own page (except first one)
        if (i > 0) {
          pdf.addPage()
        }
        
        // Add title
        pdf.setFontSize(20)
        pdf.text('Alle Produktdokumente', 20, 30)
        
        // Add timestamp
        pdf.setFontSize(12)
        pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 50)
        
        // Add document title
        pdf.setFontSize(16)
        pdf.text(`${i + 1}. ${doc.title}`, 20, 70)
        
        // Process image synchronously using fetch
        try {
          await new Promise(async (resolve) => {
            try {
              // Fetch image as blob
              const response = await fetch(doc.file_url)
              if (!response.ok) {
                throw new Error('Failed to fetch image')
              }
              
              const blob = await response.blob()
              
              // Convert blob to base64
              const reader = new FileReader()
              reader.onload = () => {
                try {
                  const imgData = reader.result as string
                  
                  // Create temporary image to get dimensions using window.Image
                  const tempImg = new window.Image()
                  tempImg.onload = () => {
                    try {
                      // Calculate image dimensions - larger since it's the only image on page
                      const imgWidth = 180
                      const imgHeight = (tempImg.height * imgWidth) / tempImg.width
                      
                      // If image is too tall, scale it down
                      const maxHeight = 200
                      const finalHeight = Math.min(imgHeight, maxHeight)
                      const finalWidth = (tempImg.width * finalHeight) / tempImg.height
                      
                      // Center image horizontally
                      const x = (210 - finalWidth) / 2
                      
                      // Add image to PDF using base64 data
                      pdf.addImage(imgData, 'JPEG', x, 90, finalWidth, finalHeight)
                      resolve(true)
                    } catch (error) {
                      console.error('Error adding image to PDF:', error)
                      pdf.text('Bild konnte nicht geladen werden', 20, 90)
                      resolve(true)
                    }
                  }
                  
                  tempImg.onerror = () => {
                    pdf.text('Bild konnte nicht geladen werden', 20, 90)
                    resolve(true)
                  }
                  
                  tempImg.src = imgData
                } catch (error) {
                  console.error('Error processing image data:', error)
                  pdf.text('Bild konnte nicht geladen werden', 20, 90)
                  resolve(true)
                }
              }
              
              reader.onerror = () => {
                pdf.text('Bild konnte nicht geladen werden', 20, 90)
                resolve(true)
              }
              
              reader.readAsDataURL(blob)
            } catch (error) {
              console.error('Error fetching image:', error)
              pdf.text('Bild konnte nicht geladen werden', 20, 90)
              resolve(true)
            }
          })
        } catch (error) {
          console.error('Error in image processing:', error)
          pdf.text('Bild konnte nicht geladen werden', 20, 90)
        }
      }
      
      // Save PDF after all images are processed
      pdf.save('alle_produktdokumente.pdf')
      
    } catch (error) {
      console.error('Error creating PDF:', error)
      alert('Fehler beim Erstellen der PDF-Datei')
    }
  }

  const handleViewCombinedPdf = async () => {
    if (documents.length === 0) return

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Process all images sequentially - each gets its own page
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        
        // Each document gets its own page (except first one)
        if (i > 0) {
          pdf.addPage()
        }
        
        // Add title
        pdf.setFontSize(20)
        pdf.text('Alle Produktdokumente', 20, 30)
        
        // Add timestamp
        pdf.setFontSize(12)
        pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 50)
        
        // Add document title
        pdf.setFontSize(16)
        pdf.text(`${i + 1}. ${doc.title}`, 20, 70)
        
        // Process image synchronously using fetch
        try {
          await new Promise(async (resolve) => {
            try {
              // Fetch image as blob
              const response = await fetch(doc.file_url)
              if (!response.ok) {
                throw new Error('Failed to fetch image')
              }
              
              const blob = await response.blob()
              
              // Convert blob to base64
              const reader = new FileReader()
              reader.onload = () => {
                try {
                  const imgData = reader.result as string
                  
                  // Create temporary image to get dimensions using window.Image
                  const tempImg = new window.Image()
                  tempImg.onload = () => {
                    try {
                      // Calculate image dimensions - larger since it's the only image on page
                      const imgWidth = 180
                      const imgHeight = (tempImg.height * imgWidth) / tempImg.width
                      
                      // If image is too tall, scale it down
                      const maxHeight = 200
                      const finalHeight = Math.min(imgHeight, maxHeight)
                      const finalWidth = (tempImg.width * finalHeight) / tempImg.height
                      
                      // Center image horizontally
                      const x = (210 - finalWidth) / 2
                      
                      // Add image to PDF using base64 data
                      pdf.addImage(imgData, 'JPEG', x, 90, finalWidth, finalHeight)
                      resolve(true)
                    } catch (error) {
                      console.error('Error adding image to PDF:', error)
                      pdf.text('Bild konnte nicht geladen werden', 20, 90)
                      resolve(true)
                    }
                  }
                  
                  tempImg.onerror = () => {
                    pdf.text('Bild konnte nicht geladen werden', 20, 90)
                    resolve(true)
                  }
                  
                  tempImg.src = imgData
                } catch (error) {
                  console.error('Error processing image data:', error)
                  pdf.text('Bild konnte nicht geladen werden', 20, 90)
                  resolve(true)
                }
              }
              
              reader.onerror = () => {
                pdf.text('Bild konnte nicht geladen werden', 20, 90)
                resolve(true)
              }
              
              reader.readAsDataURL(blob)
            } catch (error) {
              console.error('Error fetching image:', error)
              pdf.text('Bild konnte nicht geladen werden', 20, 90)
              resolve(true)
            }
          })
        } catch (error) {
          console.error('Error in image processing:', error)
          pdf.text('Bild konnte nicht geladen werden', 20, 90)
        }
      }
      
      // Convert PDF to blob URL for viewing
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      setCombinedPdfUrl(pdfUrl)
      setIsCombinedPdfViewerOpen(true)
      
    } catch (error) {
      console.error('Error creating PDF:', error)
      alert('Fehler beim Erstellen der PDF-Datei')
    }
  }

  if (documents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-[#F39236]" />
          <h3 className="text-xl font-semibold text-gray-900">Produktdokumente</h3>
        </div>
        
        <div className="text-center py-12">
          <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Keine Dokumente verfügbar
          </h4>
          <p className="text-gray-600">
            Für dieses Produkt sind noch keine Dokumente hochgeladen worden.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-[#F39236]" />
          <h3 className="text-xl font-semibold text-gray-900">Produktdokumente</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
            {documents.length} Dokument{documents.length === 1 ? '' : 'e'}
          </span>
          
          <button
            onClick={handleDownloadAllAsPdf}
            className="flex items-center gap-2 px-4 py-2 bg-[#F39236] text-white rounded-lg hover:bg-[#E67E22] transition-colors"
          >
            <Download className="h-4 w-4" />
            Alle als PDF herunterladen
          </button>
        </div>
      </div>

      {/* PDF Card with Image */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          {/* PDF Image with Play Icon */}
          <div className="relative mb-6">
            <div className="w-32 h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 mx-auto flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">PDF</p>
              </div>
            </div>
            
            {/* Play/View Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handleViewCombinedPdf}
                className="w-12 h-12 bg-[#F39236] rounded-full flex items-center justify-center hover:bg-[#E67E22] transition-colors shadow-lg border-2 border-[#F39236]"
              >
                <Eye className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            {documents.length} Dokument{documents.length === 1 ? '' : 'e'} in einem PDF zusammengefasst
          </p>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {isPdfViewerOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDocument.title}
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-3 py-2 bg-[#F39236] text-white rounded hover:bg-[#E67E22] transition-colors"
                >
                  <Download className="h-4 w-4" />
                  PDF herunterladen
                </button>
                
                <button
                  onClick={() => setIsPdfViewerOpen(false)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="text-center">
                <Image
                  src={selectedDocument.file_url}
                  alt={selectedDocument.title}
                  width={600}
                  height={600}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combined PDF Viewer Modal */}
      {isCombinedPdfViewerOpen && combinedPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-md bg-gray-900/20 transition-all duration-300 opacity-100"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={() => {
              setIsCombinedPdfViewerOpen(false)
              setCombinedPdfUrl(null)
            }}
          />
          
          {/* Dialog */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-6xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 transform opacity-100 scale-100 translate-y-0 border border-white/20">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsCombinedPdfViewerOpen(false)
                setCombinedPdfUrl(null)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-6 w-6" style={{color: '#F39236'}} />
              <h2 className="text-xl font-semibold text-gray-900">
                Birleşik PDF Görüntüleyici
              </h2>
            </div>
            
            {/* PDF Viewer */}
            <div className="mb-6">
              <div className="bg-gray-100 rounded-lg overflow-hidden min-h-[600px]">
                <iframe
                  src={combinedPdfUrl}
                  className="w-full h-full min-h-[600px] border-0"
                  title="Birleşik PDF Görüntüleyici"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleDownloadAllAsPdf}
                className="px-4 py-2 bg-[#F39236] text-white font-medium rounded-lg hover:bg-[#E67E22] transition-colors"
              >
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
