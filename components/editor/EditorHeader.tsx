'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Undo2, Redo2 } from 'lucide-react'
import { WorkspaceNavBar, type WorkspaceNavItem } from '@/components/ui/anime-navbar'
import { CinematicExportCluster } from '@/components/editor/cinematic-export-cluster'
import { InlineLoadingAnimation } from '@/components/loading-animation'
import { cn } from '@/lib/utils'
import type { Project, ProcessingJob, ProjectExport, HeaderNavMode } from '@/lib/types'
import { toast } from 'sonner'

export interface EditorHeaderProps {
  project: Project | null
  job: ProcessingJob | null
  saveStatus: 'saved' | 'saving' | 'error'
  progressPercent: number
  isEditingTitle: boolean
  tempTitle: string
  setTempTitle: (title: string) => void
  titleInputRef: React.RefObject<HTMLInputElement | null>
  activeWorkspaceTab: HeaderNavMode
  isDeferredChromeReady: boolean
  isExporting: boolean
  isDownloading: boolean
  latestExport: ProjectExport | null
  hasSourceAsset: boolean
  headerNavItems: WorkspaceNavItem[]
  onTitleSave: () => void
  onTitleKeyDown: (e: React.KeyboardEvent) => void
  onTitleStartEdit: () => void
  onWorkspaceTabChange: (name: string) => void
  onPrepareExport: () => void
  onDownload: () => void
}

export function EditorHeader({
  project,
  job,
  saveStatus,
  progressPercent,
  isEditingTitle,
  tempTitle,
  setTempTitle,
  titleInputRef,
  activeWorkspaceTab,
  isDeferredChromeReady,
  isExporting,
  isDownloading,
  latestExport,
  hasSourceAsset,
  headerNavItems,
  onTitleSave,
  onTitleKeyDown,
  onTitleStartEdit,
  onWorkspaceTabChange,
  onPrepareExport,
  onDownload,
}: EditorHeaderProps) {
  const handleUndo = () => {
    toast.info('Undo triggered', {
      description: 'Undo functionality will be available soon.',
    })
  }

  const handleRedo = () => {
    toast.info('Redo triggered', {
      description: 'Redo functionality will be available soon.',
    })
  }

  return (
    <header className="glass-panel sticky top-0 z-[100] h-14 shrink-0 overflow-hidden border-x-0 border-t-0 rounded-none bg-void/40 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1800px] items-center justify-between px-4 lg:px-6">
        {/* Left: Project Info */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={onTitleSave}
                  onKeyDown={onTitleKeyDown}
                  className="bg-transparent text-sm font-medium text-white outline-none"
                  autoFocus
                />
              ) : (
                <h1
                  className="cursor-pointer text-sm font-medium text-white transition-opacity hover:opacity-70"
                  onClick={onTitleStartEdit}
                >
                  {project?.title ?? 'Untitled Project'}
                </h1>
              )}
              
              <div
                className={cn(
                  'flex items-center gap-1.5 text-[10px] uppercase tracking-widest',
                  saveStatus === 'saving' ? 'text-accent-blue' : 'text-white/20'
                )}
              >
                {saveStatus === 'saving' ? (
                  <InlineLoadingAnimation size={12} label="Saving project" />
                ) : (
                  <CheckCircle2 className="size-3" />
                )}
                {saveStatus === 'saving' ? 'Saving' : 'Saved'}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Workspace & History */}
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-8">
          <div className="flex items-center gap-2 border-r border-white/8 pr-8">
            <button
              onClick={handleUndo}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/5 hover:text-white"
              title="Undo (Cmd+Z)"
            >
              <Undo2 className="size-4" />
            </button>
            <button
              onClick={handleRedo}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/5 hover:text-white"
              title="Redo (Cmd+Shift+Z)"
            >
              <Redo2 className="size-4" />
            </button>
          </div>

          <WorkspaceNavBar
            items={headerNavItems}
            defaultActive={activeWorkspaceTab}
            activeItem={activeWorkspaceTab}
            onChange={onWorkspaceTabChange}
            className="h-10"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {isDeferredChromeReady ? (
            <CinematicExportCluster
              onExport={onPrepareExport}
              isExporting={isExporting}
              isCompleted={latestExport?.status === 'completed'}
              onDownload={onDownload}
              isDownloading={isDownloading}
            />
          ) : (
            <div className="flex h-9 w-[180px] items-center justify-center">
              <InlineLoadingAnimation size={20} label="Loading export controls" />
            </div>
          )}
        </div>
      </div>
      
      {/* Chrome Glow Line */}
      <div className="absolute bottom-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  )
}
