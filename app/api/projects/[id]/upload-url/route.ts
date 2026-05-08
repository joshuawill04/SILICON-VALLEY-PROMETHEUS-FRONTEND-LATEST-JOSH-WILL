import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ProjectService } from '@/lib/projects/service'
import { R2Keys } from '@/lib/r2/keys'
import { getPresignedPutUrl } from '@/lib/r2/presigned-url'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await req.json().catch(() => ({}))
    const { filename, mimeType, sizeBytes } = body

    if (!filename || !mimeType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Confirm user owns the project
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const assetId = crypto.randomUUID()
    const bucket = process.env.R2_BUCKET_SOURCES || 'prometheus-sources'
    const objectKey = R2Keys.sourceAsset(user.id, projectId, assetId, filename)

    const uploadUrl = await getPresignedPutUrl(bucket, objectKey, mimeType)

    return NextResponse.json({
      asset: {
        id: assetId,
        projectId,
        storageProvider: 'r2',
        bucket,
        objectKey,
        mimeType,
        sizeBytes,
      },
      upload: {
        url: uploadUrl,
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
      },
    })
  } catch (err) {
    console.error('[api/projects/[id]/upload-url] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate upload URL' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
