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

  if (!provider.getMultipartUploadUrl) {
    return NextResponse.json(
      { error: 'Multipart uploads are not supported by the active storage provider' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json().catch(() => null as unknown)
    const key = (body as any)?.key as string | undefined
    const uploadId = (body as any)?.uploadId as string | undefined
    const partNumber = Number((body as any)?.partNumber)

    if (!key || !uploadId || Number.isNaN(partNumber) || partNumber < 1) {
      return NextResponse.json(
        { error: 'key, uploadId and partNumber are required' },
        { status: 400 }
      )
    }

    const url = await provider.getMultipartUploadUrl({ key, uploadId, partNumber })
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Multipart upload-part sign error:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL for part' },
      { status: 500 }
    )
  }
}
