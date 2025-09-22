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

  if (!provider.abortMultipartUpload) {
    return NextResponse.json(
      { error: 'Multipart uploads are not supported by the active storage provider' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json().catch(() => null as unknown)

    const key = (body as any)?.key as string | undefined
    const uploadId = (body as any)?.uploadId as string | undefined

    if (!key || !uploadId) {
      return NextResponse.json(
        { error: 'key and uploadId are required' },
        { status: 400 }
      )
    }

    await provider.abortMultipartUpload({ key, uploadId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Multipart abort error:', error)
    return NextResponse.json(
      { error: 'Failed to abort multipart upload' },
      { status: 500 }
    )
  }
}
