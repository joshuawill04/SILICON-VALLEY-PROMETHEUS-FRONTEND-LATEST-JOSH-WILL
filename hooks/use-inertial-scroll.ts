'use client'

import * as React from 'react'

type InertialScrollOptions = {
  enabled?: boolean
  axis?: 'y' | 'x'
}

export function useInertialScroll<T extends HTMLElement>({
  enabled = true,
  axis = 'y',
}: InertialScrollOptions = {}) {
  const ref = React.useRef<T | null>(null)

  React.useEffect(() => {
    if (!enabled) return

    const element = ref.current
    if (!element || typeof window === 'undefined') return

    let rafId = 0
    let velocity = 0
    let current = axis === 'y' ? element.scrollTop : element.scrollLeft

    const decay = 0.84
    const threshold = 0.35

    const stop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
        rafId = 0
      }
      velocity = 0
    }

    const clampScroll = (next: number) => {
      if (axis === 'y') {
        const max = Math.max(0, element.scrollHeight - element.clientHeight)
        return Math.min(Math.max(0, next), max)
      }

      const max = Math.max(0, element.scrollWidth - element.clientWidth)
      return Math.min(Math.max(0, next), max)
    }

    const step = () => {
      current = clampScroll(current + velocity)

      if (axis === 'y') {
        element.scrollTop = current
      } else {
        element.scrollLeft = current
      }

      velocity *= decay

      if (Math.abs(velocity) < threshold) {
        stop()
        return
      }

      rafId = window.requestAnimationFrame(step)
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return

      const primaryDelta = axis === 'y' ? event.deltaY : event.deltaX
      const secondaryDelta = axis === 'y' ? event.deltaX : event.deltaY
      const normalizedPrimary = event.deltaMode === 1 ? primaryDelta * 18 : primaryDelta

      if (Math.abs(normalizedPrimary) < 18) return
      if (Math.abs(normalizedPrimary) < Math.abs(secondaryDelta) * 1.2) return

      const atStart = axis === 'y' ? element.scrollTop <= 0 : element.scrollLeft <= 0
      const atEnd =
        axis === 'y'
          ? element.scrollTop + element.clientHeight >= element.scrollHeight - 1
          : element.scrollLeft + element.clientWidth >= element.scrollWidth - 1

      if ((normalizedPrimary < 0 && atStart) || (normalizedPrimary > 0 && atEnd)) {
        stop()
        return
      }

      event.preventDefault()
      current = axis === 'y' ? element.scrollTop : element.scrollLeft
      velocity += normalizedPrimary * 0.16

      if (!rafId) {
        rafId = window.requestAnimationFrame(step)
      }
    }

    element.addEventListener('wheel', handleWheel, { passive: false })
    element.addEventListener('pointerdown', stop)

    return () => {
      stop()
      element.removeEventListener('wheel', handleWheel)
      element.removeEventListener('pointerdown', stop)
    }
  }, [axis, enabled])

  return ref
}
