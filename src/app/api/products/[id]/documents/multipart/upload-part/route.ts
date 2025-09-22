import { NextRequest, NextResponse } from 'next/server'
import { storageProvider } from '@/lib/storage/storage-factory'
import { USE_S3_STORAGE } from '@/lib/s3-client'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!USE_S3_STORAGE) {
    return NextResponse.json(
      { error: 'Multipart uploads require S3 storage configuration' },
      { status: 400 }
    )
  }

  const provider = storageProvider

  if (!provider.uploadMultipartPart) {
    return NextResponse.json(
      { error: 'Multipart uploads are not supported by the active storage provider' },
      { status: 400 }
    )
  }

  try {
    const key = request.headers.get('x-upload-key') || undefined
    const uploadId = request.headers.get('x-upload-id') || undefined
    const partNumberHeader = request.headers.get('x-upload-part-number') || request.headers.get('x-part-number') || undefined
    const contentType = request.headers.get('x-upload-content-type') || request.headers.get('content-type') || undefined

    if (!key || !uploadId || !partNumberHeader) {
      return NextResponse.json(
        { error: 'Missing multipart upload headers' },
        { status: 400 }
      )
    }

    const partNumber = Number(partNumberHeader)

    if (Number.isNaN(partNumber) || partNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid part number' },
        { status: 400 }
      )
    }

    const arrayBuffer = await request.arrayBuffer()

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: 'Empty part payload' },
        { status: 400 }
      )
    }

    const result = await provider.uploadMultipartPart({
      key,
      uploadId,
      partNumber,
      body: arrayBuffer,
    })

    return NextResponse.json({ etag: result.etag, contentType })
  } catch (error) {
    console.error('Multipart upload-part error:', error)
    return NextResponse.json(
      { error: 'Failed to upload multipart chunk' },
      { status: 500 }
    )
  }
}
