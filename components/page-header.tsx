'use client'

import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between gap-6 border-b border-white/8 bg-[linear-gradient(180deg,rgba(10,12,18,0.88)_0%,rgba(8,10,14,0.72)_100%)] px-8 py-5 shadow-[0_18px_42px_-34px_rgba(0,0,0,0.95)] backdrop-blur-xl',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white/96 md:text-3xl">
          {title}
        </h1>
        {description ? <p className="mt-1 text-sm leading-6 text-white/58">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}
