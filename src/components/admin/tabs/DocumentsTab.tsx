'use client'

import { useState } from 'react'
import { FileText, Upload, Trash2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { validateFile } from '@/lib/upload'

interface DocumentImage {
  id: string
  file: File
  previewUrl: string
  name: string
  file_url?: string
  file_key?: string
  file_type?: string
  file_size?: number
}

interface DocumentsTabProps {
  documents: DocumentImage[]
  setDocuments: (documents: DocumentImage[]) => void
  openDeleteDialog: (index: number) => void
  productId: string
}

interface UploadState {
  inProgress: boolean
  progress: number
  fileName?: string
}

const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024
const MIN_CHUNK_SIZE = 5 * 1024 * 1024
const MAX_CONCURRENCY = 10

export default function DocumentsTab({ documents, setDocuments, openDeleteDialog, productId }: DocumentsTabProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>({ inProgress: false, progress: 0 })
  const canUpload = Boolean(productId)

  const updateProgress = (progress: number, fileName?: string) => {
    setUploadState(prev => (
      prev.inProgress
        ? { ...prev, progress: Math.min(100, Math.max(progress, 0)), fileName: fileName ?? prev.fileName }
        : prev
    ))
  }

  const handleDocumentUpload = async (file: File) => {
    if (!canUpload) {
      alert('Önce ürünü oluşturun veya mevcut ürünü açın. Ürün ID olmadan doküman yüklenemez.')
      return
    }

    const validation = validateFile(file, Number.MAX_SAFE_INTEGER, ['application/pdf', 'image/*'])
    if (!validation.valid) {
      alert(validation.error || 'Datei konnte nicht validiert werden.')
      return
    }

    setUploadState({ inProgress: true, progress: 0, fileName: file.name })

    const pushDocument = (doc: DocumentImage) => {
      setDocuments([...documents, doc])
    }

    try {
      const multipartResult = await uploadWithMultipart(file, productId, updateProgress)

      if (multipartResult) {
        pushDocument(multipartResult)
        return
      }

      const fallbackResult = await uploadWithFormData(file, productId, updateProgress)
      pushDocument(fallbackResult)
    } catch (error) {
      console.error('Document upload error:', error)
      alert(`Fehler beim Hochladen des Dokuments: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setUploadState(prev => ({ ...prev, inProgress: false }))
      setTimeout(() => setUploadState({ inProgress: false, progress: 0 }), 400)
    }
  }

  const handleFilesSequentially = async (files: File[]) => {
    for (const file of files) {
      await handleDocumentUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (!canUpload) {
      alert('Önce ürünü oluşturun veya mevcut ürünü açın. Ürün ID olmadan doküman yüklenemez.')
      return
    }

    const files = Array.from(e.dataTransfer.files)
    const acceptedFiles = files.filter(file =>
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|pdf)$/i)
    )

    if (acceptedFiles.length > 0) {
      await handleFilesSequentially(acceptedFiles)
    } else {
      alert('Bitte ziehen Sie eine gültige Bild- oder PDF-Datei hierher')
    }
  }

  const removeImage = (index: number) => {
    openDeleteDialog(index)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-[#F39236]" />
          <h3 className="text-xl font-semibold text-gray-900">Produktdokumente</h3>
        </div>
        {documents.length > 0 && (
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
            {documents.length} Dokumente hochgeladen
          </div>
        )}
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-16 text-center transition-all duration-200 min-h-[400px] flex items-center justify-center ${
          isDragOver
            ? 'border-[#F39236] bg-[#FFF0E2]'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!canUpload ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                <FileText className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Ürün oluşturulmadan doküman yüklenemez
              </h4>
              <p className="text-gray-600">
                Lütfen önce ürünü oluşturun veya mevcut ürünü açın.
              </p>
            </div>
          </div>
        ) : uploadState.inProgress ? (
          <div className="space-y-4 w-full max-w-md">
            <div className="flex justify-center">
              <div className="relative w-16 h-16 rounded-full bg-[#F39236] text-white flex items-center justify-center">
                <span className="text-lg font-semibold">{uploadState.progress}%</span>
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Lade {uploadState.fileName ? `„${uploadState.fileName}“` : 'Dokument'} hoch…
              </h4>
              <p className="text-gray-600 text-sm">
                Bitte warten Sie, bis der Vorgang abgeschlossen ist.
              </p>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F39236] transition-all duration-150"
                style={{ width: `${Math.max(uploadState.progress, 2)}%` }}
              />
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Dateien hierher ziehen
              </h4>
              <p className="text-gray-600 mb-4">
                Unterstützt JPG, PNG, GIF, BMP, WebP, SVG und PDF Formate
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-sm text-gray-500">
                  oder
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.pdf"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || [])
                      await handleFilesSequentially(files)
                    }}
                    className="hidden"
                    disabled={!canUpload}
                  />
                  <span className="px-4 py-2 bg-[#F39236] text-white rounded-lg hover:bg-[#E67E22] transition-colors">
                    Datei auswählen
                  </span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
              {documents.map((image, index) => (
                <div key={image.id ?? index} className="bg-white rounded-lg border border-gray-200 hover:border-[#F39236] transition-colors overflow-hidden">
                  <div className="aspect-square bg-gray-100 overflow-hidden flex items-center justify-center">
                    {((image as any).file && (image as any).file.type && (image as any).file.type.startsWith('image/')) || /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(image.previewUrl) ? (
                      <Image
                        src={image.previewUrl}
                        alt={image.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-400" />
                        <a href={image.previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs mt-2 text-[#F39236] hover:underline">
                          PDF ansehen
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <h5 className="font-medium text-gray-900 truncate text-sm mb-1">{image.name}</h5>
                    <div className="space-y-0.5 text-xs text-gray-600">
                      <p>{image.file_size ? (image.file_size / 1024 / 1024).toFixed(1) : 'Unbekannt'} MB</p>
                      <p>{image.file_type ? image.file_type.toUpperCase() : 'Unbekannt'}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="mt-2 w-full px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded text-xs transition-colors border border-red-200 hover:border-red-300"
                      title="Datei löschen"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.pdf"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || [])
                    await handleFilesSequentially(files)
                  }}
                  className="hidden"
                  disabled={!canUpload}
                />
                <span className="px-6 py-3 bg-[#F39236] text-white rounded-lg hover:bg-[#E67E22] transition-colors flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Weitere Dateien hinzufügen
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

async function uploadWithMultipart(
  file: File,
  productId: string,
  onProgress: (progress: number, fileName?: string) => void,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): Promise<DocumentImage | null> {
  const title = file.name.replace(/\.[^/.]+$/, '')

  // single part path for <5 MiB
  if (file.size < MIN_CHUNK_SIZE) {
    const singleInit = await fetch(`/api/products/${productId}/documents/multipart/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream', singlePart: true }),
    })
    if (!singleInit.ok) {
      const errorBody = await singleInit.json().catch(() => null as unknown)
      throw new Error((errorBody as any)?.error || 'Upload konnte nicht gestartet werden.')
    }
    const { url, key } = await singleInit.json() as { url: string; key: string }
    const putResp = await fetch(url, { method: 'PUT', body: file })
    if (!putResp.ok) {
      throw new Error('Direkter Upload fehlgeschlagen')
    }
    onProgress(99, file.name)
    const metadataResponse = await fetch(`/api/products/${productId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        file_url: `${url.split('?')[0]}`.replace(/\?.*$/, ''),
        file_key: key,
        file_type: file.type,
        file_size: file.size,
      }),
    })
    if (!metadataResponse.ok) {
      const metadataError = await metadataResponse.json().catch(() => null as unknown)
      throw new Error((metadataError as any)?.error || 'Dokument konnte nicht gespeichert werden.')
    }
    const metadata = await metadataResponse.json() as any
    onProgress(100, file.name)
    return {
      id: metadata.id,
      file,
      previewUrl: metadata.file_url,
      name: metadata.title,
      file_url: metadata.file_url,
      file_key: metadata.file_key,
      file_type: metadata.file_type || file.type,
      file_size: metadata.file_size || file.size,
    }
  }

  const initiateResponse = await fetch(`/api/products/${productId}/documents/multipart/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream' }),
  })

  if (initiateResponse.status === 400) {
    return null
  }

  if (!initiateResponse.ok) {
    const errorBody = await initiateResponse.json().catch(() => null as unknown)
    throw new Error((errorBody as any)?.error || 'Multipart-Upload konnte nicht gestartet werden.')
  }

  const { uploadId, key } = await initiateResponse.json() as { uploadId: string; key: string }

  const totalSize = Math.max(file.size, 1)
  const normalizedChunkSize = Math.max(MIN_CHUNK_SIZE, chunkSize)
  const totalParts = Math.ceil(totalSize / normalizedChunkSize) || 1
  const parts: Array<{ partNumber: number; etag: string }> = []
  let uploadedBytes = 0

  // Fetch all presigned URLs in parallel
  const presignedUrls = await Promise.all(
    Array.from({ length: totalParts }, (_, i) => {
      const partNumber = i + 1
      return fetch(`/api/products/${productId}/documents/multipart/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, uploadId, partNumber }),
      })
      .then(res => {
        if (!res.ok) throw new Error(`Sign URL failed (part ${partNumber})`)
        return res.json() as Promise<{ url: string }>
      })
      .then(data => ({ partNumber, url: data.url }))
    })
  )

  const uploadPart = async (url: string, partNumber: number, blob: Blob) => {
    const resp = await fetch(url, { method: 'PUT', body: blob })
    if (!resp.ok) throw new Error(`Part ${partNumber} upload failed (${resp.status})`)
    const etag = resp.headers.get('etag') || resp.headers.get('ETag')
    if (!etag) throw new Error(`Part ${partNumber} missing ETag`)

    uploadedBytes += blob.size
    onProgress(Math.min(99, Math.floor((uploadedBytes / totalSize) * 100)), file.name)
    parts[partNumber - 1] = { partNumber, etag: etag.replace(/"/g, '') }
  }

  try {
    const tasks: Array<() => Promise<void>> = presignedUrls.map(({ partNumber, url }, index) => {
      const start = index * normalizedChunkSize
      const end = Math.min(start + normalizedChunkSize, totalSize)
      const blob = file.slice(start, end)
      return () => uploadPart(url, partNumber, blob)
    })

    const workers: Promise<void>[] = []
    for (let i = 0; i < Math.min(MAX_CONCURRENCY, tasks.length); i++) {
      workers.push((async function run() {
        while (tasks.length) {
          const task = tasks.shift()
          if (!task) break
          await task()
        }
      })())
    }
    await Promise.all(workers)

    const completeResponse = await fetch(`/api/products/${productId}/documents/multipart/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, uploadId, parts }),
    })

    if (!completeResponse.ok) {
      const completeError = await completeResponse.json().catch(() => null as unknown)
      throw new Error((completeError as any)?.error || 'Multipart-Upload konnte nicht abgeschlossen werden.')
    }

    const completeResult = await completeResponse.json() as { success: boolean; url?: string; key: string }

    if (!completeResult.success) {
      throw new Error('S3 Multipart-Upload wurde nicht erfolgreich abgeschlossen.')
    }

    onProgress(99, file.name)

    const metadataResponse = await fetch(`/api/products/${productId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        file_url: completeResult.url,
        file_key: completeResult.key,
        file_type: file.type,
        file_size: file.size,
      }),
    })

    if (!metadataResponse.ok) {
      const metadataError = await metadataResponse.json().catch(() => null as unknown)
      throw new Error((metadataError as any)?.error || 'Dokument konnte nicht gespeichert werden.')
    }

    const metadata = await metadataResponse.json() as any
    onProgress(100, file.name)

    return {
      id: metadata.id,
      file,
      previewUrl: metadata.file_url,
      name: metadata.title,
      file_url: metadata.file_url,
      file_key: metadata.file_key,
      file_type: metadata.file_type || file.type,
      file_size: metadata.file_size || file.size,
    }
  } catch (error) {
    await fetch(`/api/products/${productId}/documents/multipart/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, uploadId }),
    }).catch(() => undefined)

    const status = (error as any)?.status as number | undefined
    const message = error instanceof Error ? error.message : ''
    const isPayloadIssue = status === 413 || /413/.test(message) || /payload too large/i.test(message)

    if (isPayloadIssue && normalizedChunkSize > MIN_CHUNK_SIZE) {
      const nextChunkSize = Math.max(MIN_CHUNK_SIZE, Math.floor(normalizedChunkSize / 2))
      if (nextChunkSize < normalizedChunkSize) {
        console.warn(`Retrying multipart upload with smaller chunk size (${Math.round(nextChunkSize / 1024 / 1024)}MB)`)
        onProgress(0, file.name)
        return uploadWithMultipart(file, productId, onProgress, nextChunkSize)
      }
    }

    throw error
  }
}

function uploadWithFormData(
  file: File,
  productId: string,
  onProgress: (progress: number, fileName?: string) => void,
): Promise<DocumentImage> {
  const title = file.name.replace(/\.[^/.]+$/, '')

  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file_0', file)
    formData.append('title_0', title)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/products/${productId}/documents/bulk`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(99, Math.floor((event.loaded / Math.max(file.size, 1)) * 100))
        onProgress(percent, file.name)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          const doc = response?.data?.[0]
          if (!doc) {
            reject(new Error('Die Antwort für den Dokument-Upload war unvollständig.'))
            return
          }
          onProgress(100, file.name)
          resolve({
            id: doc.id,
            file,
            previewUrl: doc.file_url,
            name: doc.title,
            file_url: doc.file_url,
            file_key: doc.file_key,
            file_type: doc.file_type || file.type,
            file_size: doc.file_size || file.size,
          })
        } catch (parseError) {
          reject(parseError instanceof Error ? parseError : new Error('Antwort konnte nicht gelesen werden.'))
        }
      } else {
        reject(new Error(`Upload fehlgeschlagen (Status ${xhr.status})`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Netzwerkfehler beim Dokument-Upload.'))
    }

    xhr.send(formData)
  })
}
