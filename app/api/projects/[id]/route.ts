import { NextResponse } from 'next/server'
import { ProjectService, type ProjectPatch } from '@/lib/projects/service'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await ProjectService.getProject(id)
    return NextResponse.json({ project })
  } catch (err) {
    console.error('[api/projects/[id]] GET error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch project' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await req.json().catch(() => ({}))) as ProjectPatch
    const project = await ProjectService.updateProject(id, body)
    return NextResponse.json({ project })
  } catch (err) {
    console.error('[api/projects/[id]] PATCH error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update project' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await ProjectService.deleteProject(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/projects/[id]] DELETE error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete project' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
