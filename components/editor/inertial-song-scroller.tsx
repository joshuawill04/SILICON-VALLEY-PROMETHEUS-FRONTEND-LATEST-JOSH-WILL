'use client'

import * as React from 'react'
import { motion, useMotionValue } from 'framer-motion'

import { cn } from '@/lib/utils'

const DRAG_THRESHOLD_PX = 6
const MAX_VELOCITY = 52
const OVERSCROLL_RESISTANCE = 0.1
const EDGE_SLOW_ZONE = 96
const EDGE_VELOCITY_ZONE = 88
const WHEEL_VELOCITY_FACTOR = 0.034
const INERTIA_DAMPING = 0.89
const OVERSCROLL_DAMPING = 0.68
const SPRING_STRENGTH = 0.034
const CLICK_SUPPRESSION_MS = 220

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function applyEdgeResistance(position: number, maxScroll: number, delta: number) {
  if (!delta || maxScroll <= 0) return delta

  if (delta < 0) {
    const distanceToTop = position
    if (distanceToTop >= EDGE_SLOW_ZONE) return delta
    const ratio = clamp(distanceToTop / EDGE_SLOW_ZONE, 0, 1)
    return delta * (0.22 + ratio * 0.78)
  }

  const distanceToBottom = maxScroll - position
  if (distanceToBottom >= EDGE_SLOW_ZONE) return delta
  const ratio = clamp(distanceToBottom / EDGE_SLOW_ZONE, 0, 1)
  return delta * (0.22 + ratio * 0.78)
}

function applyResistance(scroll: number, maxScroll: number) {
  if (scroll < 0) return scroll * OVERSCROLL_RESISTANCE
  if (scroll > maxScroll) return maxScroll + (scroll - maxScroll) * OVERSCROLL_RESISTANCE
  return scroll
}

function clampVelocityForBounds(scroll: number, maxScroll: number, velocity: number) {
  if (!velocity || maxScroll <= 0) return clamp(velocity, -MAX_VELOCITY, MAX_VELOCITY)

  if (velocity < 0) {
    const distanceToTop = scroll
    if (distanceToTop >= EDGE_VELOCITY_ZONE) return clamp(velocity, -MAX_VELOCITY, MAX_VELOCITY)
    const ratio = clamp(distanceToTop / EDGE_VELOCITY_ZONE, 0, 1)
    return clamp(velocity, -(12 + 40 * ratio), MAX_VELOCITY)
  }

  const distanceToBottom = maxScroll - scroll
  if (distanceToBottom >= EDGE_VELOCITY_ZONE) return clamp(velocity, -MAX_VELOCITY, MAX_VELOCITY)
  const ratio = clamp(distanceToBottom / EDGE_VELOCITY_ZONE, 0, 1)
  return clamp(velocity, -MAX_VELOCITY, 12 + 40 * ratio)
}

type InertialSongScrollerProps = {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  reducedMotion?: boolean
}

type ScrollState = {
  animationFrame: number | null
  cancelClickUntil: number
  dragDistance: number
  draggedDuringPointer: boolean
  isDragging: boolean
  lastFrameTime: number
  lastPointerTime: number
  lastPointerY: number
  maxScroll: number
  pointerActive: boolean
  pointerId: number | null
  pointerStartY: number
  scroll: number
  velocity: number
}

export function InertialSongScroller({
  children,
  className,
  contentClassName,
  reducedMotion = false,
}: InertialSongScrollerProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const stepRef = React.useRef<(timestamp: number) => void>(() => {})
  const y = useMotionValue(0)
  const stateRef = React.useRef<ScrollState>({
    animationFrame: null,
    cancelClickUntil: 0,
    dragDistance: 0,
    draggedDuringPointer: false,
    isDragging: false,
    lastFrameTime: 0,
    lastPointerTime: 0,
    lastPointerY: 0,
    maxScroll: 0,
    pointerActive: false,
    pointerId: null,
    pointerStartY: 0,
    scroll: 0,
    velocity: 0,
  })

  const stopAnimation = React.useCallback(() => {
    const state = stateRef.current
    if (state.animationFrame !== null) {
      cancelAnimationFrame(state.animationFrame)
      state.animationFrame = null
    }
    state.lastFrameTime = 0
  }, [])

  const syncPosition = React.useCallback(() => {
    y.set(-stateRef.current.scroll)
  }, [y])

  const measure = React.useCallback(() => {
    const viewportHeight = viewportRef.current?.clientHeight ?? 0
    const contentHeight = contentRef.current?.scrollHeight ?? 0
    const state = stateRef.current

    state.maxScroll = Math.max(0, contentHeight - viewportHeight)
    state.scroll = clamp(state.scroll, 0, state.maxScroll)
    if (!state.pointerActive) {
      state.velocity = 0
    }
    syncPosition()
  }, [syncPosition])

  React.useEffect(() => {
    stepRef.current = (timestamp: number) => {
      const state = stateRef.current
      const frameDelta = state.lastFrameTime ? Math.min(34, timestamp - state.lastFrameTime) : 16.667
      const frameScale = frameDelta / 16.667
      state.lastFrameTime = timestamp

      let nextVelocity = state.velocity
      let nextScroll = state.scroll

      if (nextScroll < 0 || nextScroll > state.maxScroll) {
        const bound = nextScroll < 0 ? 0 : state.maxScroll
        const displacement = nextScroll - bound
        nextVelocity += -displacement * SPRING_STRENGTH * frameScale
        nextVelocity *= Math.pow(OVERSCROLL_DAMPING, frameScale)
      } else {
        nextVelocity *= Math.pow(INERTIA_DAMPING, frameScale)
      }

      nextVelocity = clampVelocityForBounds(nextScroll, state.maxScroll, nextVelocity)
      nextScroll += nextVelocity * frameScale

      const clampedScroll = clamp(nextScroll, 0, state.maxScroll)
      const settled = Math.abs(nextVelocity) < 0.07 && Math.abs(nextScroll - clampedScroll) < 0.26

      state.velocity = settled ? 0 : nextVelocity
      state.scroll = settled ? clampedScroll : nextScroll
      syncPosition()

      if (settled) {
        stopAnimation()
        return
      }

      state.animationFrame = requestAnimationFrame(stepRef.current)
    }
  }, [stopAnimation, syncPosition])

  const startAnimation = React.useCallback(() => {
    const state = stateRef.current
    if (reducedMotion || state.animationFrame !== null || state.pointerActive) return
    state.animationFrame = requestAnimationFrame(stepRef.current)
  }, [reducedMotion])

  React.useLayoutEffect(() => {
    measure()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      measure()
    })

    if (viewportRef.current) observer.observe(viewportRef.current)
    if (contentRef.current) observer.observe(contentRef.current)

    return () => observer.disconnect()
  }, [measure])

  React.useLayoutEffect(() => {
    measure()
  }, [children, measure])

  React.useEffect(() => stopAnimation, [stopAnimation])

  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const state = stateRef.current
      if (state.maxScroll <= 0) return

      event.preventDefault()

      const delta = event.deltaY
      if (!delta) return

      stopAnimation()

      const adjustedDelta = reducedMotion ? delta : applyEdgeResistance(state.scroll, state.maxScroll, delta)
      const nextScroll = reducedMotion
        ? clamp(state.scroll + adjustedDelta, 0, state.maxScroll)
        : applyResistance(state.scroll + adjustedDelta, state.maxScroll)

      state.scroll = nextScroll
      state.velocity = reducedMotion
        ? 0
        : clampVelocityForBounds(nextScroll, state.maxScroll, state.velocity + adjustedDelta * WHEEL_VELOCITY_FACTOR)
      syncPosition()

      if (!reducedMotion) {
        startAnimation()
      }
    },
    [reducedMotion, startAnimation, stopAnimation, syncPosition],
  )

  const handlePointerDownCapture = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const state = stateRef.current
    state.cancelClickUntil = 0
    state.dragDistance = 0
    state.draggedDuringPointer = false
    state.pointerActive = true
    state.pointerId = event.pointerId
    state.isDragging = false
    state.pointerStartY = event.clientY
    state.lastPointerY = event.clientY
    state.lastPointerTime = performance.now()
    state.velocity = 0

    stopAnimation()
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [stopAnimation])

  const handlePointerMoveCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = stateRef.current
      if (!state.pointerActive || state.pointerId !== event.pointerId) return

      const now = performance.now()
      const totalDelta = event.clientY - state.pointerStartY
      const deltaY = event.clientY - state.lastPointerY
      state.dragDistance = Math.max(state.dragDistance, Math.abs(totalDelta))

      if (!state.isDragging && Math.abs(totalDelta) > DRAG_THRESHOLD_PX) {
        state.isDragging = true
        state.draggedDuringPointer = true
      }

      if (!state.isDragging) {
        state.lastPointerY = event.clientY
        state.lastPointerTime = now
        return
      }

      event.preventDefault()

      const intendedDelta = reducedMotion ? -deltaY : applyEdgeResistance(state.scroll, state.maxScroll, -deltaY)
      const rawScroll = state.scroll + intendedDelta
      const nextScroll = reducedMotion
        ? clamp(rawScroll, 0, state.maxScroll)
        : applyResistance(rawScroll, state.maxScroll)
      const pointerDeltaMs = Math.max(8, now - state.lastPointerTime)
      const scrollDelta = nextScroll - state.scroll

      state.velocity = reducedMotion
        ? 0
        : clampVelocityForBounds(nextScroll, state.maxScroll, scrollDelta / (pointerDeltaMs / 16.667))
      state.scroll = nextScroll
      state.lastPointerY = event.clientY
      state.lastPointerTime = now
      syncPosition()
    },
    [reducedMotion, syncPosition],
  )

  const finishPointer = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = stateRef.current
      if (state.pointerId !== event.pointerId) return

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      state.pointerActive = false
      state.pointerId = null
      state.lastPointerTime = 0
      state.lastPointerY = 0
      state.pointerStartY = 0

      if (!state.isDragging) {
        state.dragDistance = 0
        state.draggedDuringPointer = false
        return
      }

      state.isDragging = false
      state.cancelClickUntil =
        state.draggedDuringPointer && state.dragDistance > DRAG_THRESHOLD_PX * 2
          ? performance.now() + CLICK_SUPPRESSION_MS
          : 0
      state.dragDistance = 0
      state.draggedDuringPointer = false

      if (reducedMotion) {
        state.scroll = clamp(state.scroll, 0, state.maxScroll)
        state.velocity = 0
        syncPosition()
        return
      }

      startAnimation()
    },
    [reducedMotion, startAnimation, syncPosition],
  )

  const handleClickCapture = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (performance.now() < stateRef.current.cancelClickUntil) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, [])

  return (
    <div
      className={cn('premium-song-scroller', className)}
      onClickCapture={handleClickCapture}
      onPointerCancelCapture={finishPointer}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMoveCapture={handlePointerMoveCapture}
      onPointerUpCapture={finishPointer}
      onWheel={handleWheel}
    >
      <div aria-hidden className="premium-song-scroller-overlay premium-song-scroller-overlay-top" />
      <div aria-hidden className="premium-song-scroller-overlay premium-song-scroller-overlay-bottom" />
      <div aria-hidden className="premium-song-scroller-sheen" />

      <div ref={viewportRef} className="premium-song-scroller-viewport h-full w-full touch-none overflow-hidden">
        <motion.div ref={contentRef} style={{ y }} className={cn('premium-song-scroller-content', contentClassName)}>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
