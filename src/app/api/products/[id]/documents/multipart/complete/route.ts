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

  if (!provider.completeMultipartUpload) {
    return NextResponse.json(
      { error: 'Multipart uploads are not supported by the active storage provider' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json().catch(() => null as unknown)

    const key = (body as any)?.key as string | undefined
    const uploadId = (body as any)?.uploadId as string | undefined
    const parts = (body as any)?.parts as Array<{ partNumber: number; etag: string }> | undefined

    if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json(
        { error: 'key, uploadId and parts are required' },
        { status: 400 }
      )
    }

    const normalizedParts = parts.map((part) => ({
      partNumber: Number(part.partNumber),
      etag: part.etag,
    })).filter((part) => !Number.isNaN(part.partNumber) && part.partNumber > 0 && typeof part.etag === 'string')

    if (normalizedParts.length === 0) {
      return NextResponse.json(
        { error: 'parts array is invalid' },
        { status: 400 }
      )
    }

    const result = await provider.completeMultipartUpload({
      key,
      uploadId,
      parts: normalizedParts,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Multipart completion error:', error)
    return NextResponse.json(
      { error: 'Failed to complete multipart upload' },
      { status: 500 }
    )
  }
}
