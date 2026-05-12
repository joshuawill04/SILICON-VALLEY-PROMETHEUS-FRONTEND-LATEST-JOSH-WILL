'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'

import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { cn } from '@/lib/utils'

export type PlanStatus = 'pending' | 'running' | 'completed' | 'error'

export interface PlanItem {
  id: string
  title: string
  status: PlanStatus
  progress?: number
  meta?: string
}

export interface PlanProps {
  items: PlanItem[]
  className?: string
}

export function Plan({ items, className }: PlanProps) {
  const reduced = useStableReducedMotion()

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => {
        const icon =
          item.status === 'completed' ? (
            <CheckCircle2 className="size-4 text-emerald-300" />
          ) : item.status === 'error' ? (
            <XCircle className="size-4 text-red-300" />
          ) : item.status === 'running' ? (
            <Loader2 className="size-4 text-white/70 animate-spin" />
          ) : (
            <Circle className="size-4 text-white/25" />
          )

        const progress = Math.max(0, Math.min(1, item.progress ?? (item.status === 'completed' ? 1 : 0)))

        return (
          <div
            key={item.id}
            className="rounded-[16px] border border-white/5 bg-white/[0.04] px-4 py-3.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-white/10"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {icon}
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-white/95">
                    {item.title}
                  </div>
                  {item.meta ? (
                    <div className="truncate text-[11px] font-medium uppercase tracking-[0.1em] text-white/30">{item.meta}</div>
                  ) : null}
                </div>
              </div>
              <div className="text-[11px] font-medium tabular-nums text-white/40">
                {item.status === 'completed'
                  ? '100%'
                  : item.status === 'running'
                    ? `${Math.round(progress * 100)}%`
                    : ''}
              </div>
            </div>

            <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-white/5">
              {reduced ? (
                <div
                  className="h-full bg-white/60"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              ) : (
                <motion.div
                  className="h-full bg-[linear-gradient(90deg,#9b87ff_0%,#7c4dff_100%)] shadow-[0_0_8px_rgba(155,135,255,0.3)]"
                  initial={false}
                  animate={{ width: `${Math.round(progress * 100)}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, mass: 1 }}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
