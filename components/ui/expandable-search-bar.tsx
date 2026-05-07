'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'

import { cn } from '@/lib/utils'

export type ExpandableSearchBarProps = {
  expandDirection?: 'left' | 'right'
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
  defaultOpen?: boolean
  width?: number
  value?: string
  onValueChange?: (query: string) => void
  buttonClassName?: string
  surfaceClassName?: string
  inputClassName?: string
}

const COLLAPSED_SIZE = 40

export default function ExpandableSearchBar({
  expandDirection = 'right',
  placeholder = 'Search...',
  onSearch,
  className,
  defaultOpen = false,
  width = 280,
  value: valueProp,
  onValueChange,
  buttonClassName,
  surfaceClassName,
  inputClassName,
}: ExpandableSearchBarProps) {
  const isControlled = valueProp !== undefined
  const [open, setOpen] = React.useState(defaultOpen || Boolean(valueProp?.trim()))
  const [internalValue, setInternalValue] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const value = isControlled ? valueProp ?? '' : internalValue
  const inputPadding = expandDirection === 'right' ? 'pl-11' : 'pl-10'
  const placeholderLeft = expandDirection === 'right' ? 'left-11' : 'left-10'

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue)
      }
      onValueChange?.(nextValue)
    },
    [isControlled, onValueChange],
  )

  const closeAndClear = React.useCallback(() => {
    setOpen(false)
    setValue('')
  }, [setValue])

  React.useEffect(() => {
    if (value.trim()) {
      setOpen(true)
    }
  }, [value])

  React.useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node) && open && value === '') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocumentMouseDown)
    return () => document.removeEventListener('mousedown', onDocumentMouseDown)
  }, [open, value])

  React.useEffect(() => {
    if (!open) return

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 120)
    return () => window.clearTimeout(timeoutId)
  }, [open])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        closeAndClear()
      }

      if (event.key === 'Enter' && open && value.trim()) {
        onSearch?.(value.trim())
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeAndClear, onSearch, open, value])

  const handleSubmit = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      onSearch?.(value.trim())
    },
    [onSearch, value],
  )

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block shrink-0', className)}
      style={{ width: COLLAPSED_SIZE, height: COLLAPSED_SIZE }}
    >
      <button
        type="button"
        aria-label={open ? 'Close search' : 'Open search'}
        onClick={() => {
          if (open) {
            closeAndClear()
            return
          }

          setOpen(true)
        }}
        className={cn(
          'absolute inset-0 z-20 grid place-items-center rounded-full border border-white/10 bg-[rgba(18,21,30,0.92)] text-white/60 shadow-[0_14px_26px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-[border-color,background-color,color,transform] duration-200 hover:border-white/14 hover:bg-[rgba(22,26,36,0.96)] hover:text-white/84',
          buttonClassName,
        )}
      >
        {open ? <X className="size-4" /> : <Search className="size-4" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.form
            key="expandable-search-form"
            onSubmit={handleSubmit}
            className={cn(
              'absolute top-0 flex h-10 items-center overflow-hidden rounded-full border border-white/10 bg-[rgba(18,21,30,0.92)] text-white shadow-[0_18px_34px_-28px_rgba(0,0,0,0.96)] backdrop-blur-xl',
              expandDirection === 'left' ? 'right-0' : 'left-0',
              surfaceClassName,
            )}
            initial={{ width: COLLAPSED_SIZE, opacity: 0.98 }}
            animate={{ width, opacity: 1 }}
            exit={{
              width: COLLAPSED_SIZE,
              opacity: 0,
              transition: { type: 'spring', stiffness: 260, damping: 28 },
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <span className="absolute left-3 z-10 text-white/34">
              <Search className="size-4" />
            </span>

            <div className="relative flex min-w-0 flex-1 items-center">
              <input
                ref={inputRef}
                type="search"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className={cn(
                  'w-full bg-transparent text-sm text-white outline-none placeholder-transparent',
                  inputPadding,
                  inputClassName,
                )}
              />

              <AnimatePresence>
                {open && !value ? (
                  <motion.span
                    key="expandable-search-placeholder"
                    className={cn(
                      'pointer-events-none absolute top-1/2 w-full -translate-y-1/2 truncate text-left text-sm select-none text-white/34',
                      placeholderLeft,
                    )}
                    initial={{ opacity: 1, x: 0 }}
                    animate={{ opacity: 0.9, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {placeholder}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>

            <AnimatePresence initial={false}>
              {open ? (
                <motion.button
                  key="expandable-search-submit"
                  type="submit"
                  className="grid h-10 w-10 place-items-center text-white/42 transition-colors hover:text-white/86"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  aria-label="Search"
                >
                  <Search className="size-4" />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </motion.form>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
