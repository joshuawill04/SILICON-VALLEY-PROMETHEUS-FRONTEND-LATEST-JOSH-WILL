import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ProjectService } from '@/lib/projects/service'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await req.json().catch(() => ({}))
    const { 
      assetId,
      storageProvider = 'r2',
      bucket,
      objectKey,
      filename,
      mimeType,
      sizeBytes,
      durationMs,
      width,
      height,
      profile
    } = body

    if (!assetId || !objectKey) {
      return NextResponse.json({ error: 'Missing assetId or objectKey' }, { status: 400 })
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

    // Insert source asset metadata
    const { data: asset, error: assetError } = await supabase
      .from('source_assets')
      .insert({
        id: assetId,
        project_id: projectId,
        user_id: user.id,
        storage_bucket: bucket,
        storage_path: objectKey,
        original_filename: filename,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        duration_ms: durationMs,
        width: width,
        height: height,
        profile: profile || {},
      })
      .select()
      .single()

    if (assetError) throw assetError

    // Update project with the new source_asset_id
    await ProjectService.updateProject(projectId, {
      sourceAssetId: assetId
    })

    return NextResponse.json({ asset })
  } catch (err) {
    console.error('[api/projects/[id]/assets] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to register asset' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
