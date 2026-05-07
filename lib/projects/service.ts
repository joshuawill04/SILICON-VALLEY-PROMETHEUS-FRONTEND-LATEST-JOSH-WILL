import { createClient } from '@/lib/supabase/server'
import type { Project, ProjectStatus, SourceProfile, AnimationPlan } from '@/lib/types'

export interface ProjectPatch {
  title?: string
  status?: ProjectStatus
  thumbnailUrl?: string
  previewKind?: 'video' | 'image'
  sourceProfile?: SourceProfile
  editorState?: any
  animationPlan?: AnimationPlan
  sourceAssetId?: string
}

export const ProjectService = {
  async listProjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapProjectFromDb)
  },

  async getProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    return mapProjectFromDb(data)
  },

  async createProject(params: { title?: string } = {}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: params.title || 'Untitled project',
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error
    return mapProjectFromDb(data)
  },

  async updateProject(id: string, patch: ProjectPatch) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const updateData: any = {}
    if (patch.title !== undefined) updateData.title = patch.title
    if (patch.status !== undefined) updateData.status = patch.status
    if (patch.thumbnailUrl !== undefined) updateData.thumbnail_url = patch.thumbnailUrl
    if (patch.previewKind !== undefined) updateData.preview_kind = patch.previewKind
    if (patch.sourceProfile !== undefined) updateData.source_profile = patch.sourceProfile
    if (patch.editorState !== undefined) updateData.editor_state = patch.editorState
    if (patch.animationPlan !== undefined) updateData.animation_plan = patch.animationPlan
    if (patch.sourceAssetId !== undefined) updateData.source_asset_id = patch.sourceAssetId

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return mapProjectFromDb(data)
  },

  async deleteProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return true
  }
}

function mapProjectFromDb(row: any): Project {
  return {
    id: row.id,
    title: row.title,
    status: row.status as ProjectStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    thumbnailUrl: row.thumbnail_url,
    previewKind: row.preview_kind,
    sourceProfile: row.source_profile,
    sourceAssetId: row.source_asset_id,
    editorState: row.editor_state,
    animationPlan: row.animation_plan,
  }
}
