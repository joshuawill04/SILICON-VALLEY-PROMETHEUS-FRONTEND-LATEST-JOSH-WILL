'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Copy, Link2, Pencil, Trash2 } from 'lucide-react'

import { InlineLoadingAnimation } from '@/components/loading-animation'
import { GlassCard } from '@/components/ui/glass-card'
import type { ProjectListItem } from '@/lib/projects/types'
import { cn } from '@/lib/utils'

export interface ProjectCardProps {
  project: ProjectListItem
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onShare: (id: string) => void
}

function formatDuration(duration: number | null) {
  if (!duration || duration <= 0) return null
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function initialsFromTitle(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join('') || 'PR'
}

function badgeClass(status: ProjectListItem['status']) {
  switch (status) {
    case 'rendering':
      return 'bg-amber-500/10 text-amber-300'
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-300'
    case 'failed':
      return 'bg-red-500/10 text-red-300'
    default:
      return 'bg-white/5 text-white/50'
  }
}

export function ProjectCard({ project, onEdit, onDuplicate, onDelete, onShare }: ProjectCardProps) {
  const [thumbnailFailed, setThumbnailFailed] = React.useState(false)
  const durationLabel = formatDuration(project.duration)
  const resolutionLabel =
    project.width && project.height ? `${project.width}x${project.height}` : null
  const lastEdited = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })

  const actions = [
    { label: 'Edit project', icon: Pencil, onClick: () => onEdit(project.id) },
    { label: 'Duplicate project', icon: Copy, onClick: () => onDuplicate(project.id) },
    { label: 'Share project', icon: Link2, onClick: () => onShare(project.id) },
    { label: 'Delete project', icon: Trash2, onClick: () => onDelete(project.id), danger: true },
  ]

  return (
    <GlassCard as="article" className="group" contentClassName="overflow-hidden" staggerChildren>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_52%),linear-gradient(160deg,rgba(99,102,241,0.22)_0%,rgba(8,10,16,0.95)_100%)]">
        {project.thumbnailUrl && !thumbnailFailed ? (
          // R2/public thumbnails can be external or blob/data URLs, so next/image is not guaranteed to fit.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={`${project.title} thumbnail`}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold tracking-[0.18em] text-white/72">
            {initialsFromTitle(project.title)}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">{project.title}</h3>
            {project.description ? (
              <p className="mt-1 truncate text-sm text-white/50">{project.description}</p>
            ) : null}
          </div>
          <div
            role={project.status === 'rendering' ? 'status' : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              badgeClass(project.status),
            )}
          >
            {project.status === 'rendering' ? (
              <InlineLoadingAnimation size={14} label={`Rendering ${project.title}`} />
            ) : null}
            <span className="capitalize">{project.status}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/40">
          <span>{lastEdited}</span>
          {durationLabel ? <span>{durationLabel}</span> : null}
          {resolutionLabel ? <span>{resolutionLabel}</span> : null}
        </div>

        {project.status === 'rendering' ? (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-white/46">
              <span>Rendering</span>
              <span>{project.progress ?? 0}%</span>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              aria-label={action.label}
              title={action.label}
              onClick={action.onClick}
              className={cn(
                'flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
                action.danger && 'hover:border-red-300/30 hover:bg-red-500/[0.08] hover:text-red-100',
              )}
            >
              <action.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
