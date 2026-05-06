'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export function LuxuryVignette({
  tone = 'neutral',
  className,
}: {
  tone?: 'neutral' | 'cool' | 'music'
  className?: string
}) {
  return (
    <div aria-hidden className={cn('premium-vignette-shell', className)}>
      <div className="premium-vignette-edge" />
      <div className="premium-vignette-falloff" data-tone={tone} />
      <div className="premium-vignette-inner-glow" />
    </div>
  )
}
