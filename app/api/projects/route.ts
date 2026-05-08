import { NextResponse } from 'next/server'
import { ProjectService } from '@/lib/projects/service'

export async function GET() {
  try {
    const projects = await ProjectService.listProjects()
    return NextResponse.json({ projects })
  } catch (err) {
    console.error('[api/projects] GET error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch projects' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const project = await ProjectService.createProject({ 
      title: body.title,
      previewKind: body.previewKind,
      sourceProfile: body.sourceProfile,
      sourceAssetId: body.sourceAssetId,
    })
    return NextResponse.json({ project })
  } catch (err) {
    console.error('[api/projects] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create project' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
