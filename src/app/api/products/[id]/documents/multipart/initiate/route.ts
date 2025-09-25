import { NextRequest, NextResponse } from 'next/server'
import { storageProvider } from '@/lib/storage/storage-factory'
import { USE_S3_STORAGE } from '@/lib/s3-client'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!USE_S3_STORAGE) {
    return NextResponse.json(
      { error: 'Multipart uploads require S3 storage configuration' },
      { status: 400 }
    )
  }

  const provider = storageProvider

  if (!provider.createMultipartUpload) {
    return NextResponse.json(
      { error: 'Multipart uploads are not supported by the active storage provider' },
      { status: 400 }
    )
  }

  try {
    const { id: productId } = await params
    const body = await request.json().catch(() => null as unknown)

    const fileName = (body as any)?.fileName as string | undefined
    const contentType = (body as any)?.contentType as string | undefined
    const singlePart = Boolean((body as any)?.singlePart)

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      )
    }

    if (singlePart && provider.getPutObjectUrl) {
      const result = await provider.getPutObjectUrl({
        fileName,
        contentType,
        folder: 'products',
        productId,
      })
      return NextResponse.json(result)
    }

    const result = await provider.createMultipartUpload({
      fileName,
      contentType,
      folder: 'products',
      productId,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Multipart initiate error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate multipart upload' },
      { status: 500 }
    )
  }
}
