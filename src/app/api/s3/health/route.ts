import { NextResponse } from 'next/server'
import { HeadBucketCommand } from '@aws-sdk/client-s3'
import { s3Client, S3_BUCKET_NAME } from '@/lib/s3-client'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cmd = new HeadBucketCommand({ Bucket: S3_BUCKET_NAME })
    const res = await s3Client.send(cmd)
    return NextResponse.json({ ok: true, bucket: S3_BUCKET_NAME, $metadata: res.$metadata })
  } catch (error: any) {
    const details = {
      name: error?.name,
      code: error?.Code || error?.code,
      message: error?.message,
      $metadata: error?.$metadata,
    }
    console.error('S3 health check failed:', details)
    return NextResponse.json({ ok: false, error: details }, { status: 500 })
  }
}


