'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { chamberEase, chamberSpring } from '@/lib/chamber-motion'
import { cn } from '@/lib/utils'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'

export type AiLampDialogAction = {
  label: string
  description: string
  icon: LucideIcon
  onSelect: () => void
}

type AiLampDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  badge?: string
  actions: AiLampDialogAction[]
  className?: string
}

export function AiLampDialog({
  open,
  onOpenChange,
  title,
  description,
  badge = 'AI Direction',
  actions,
  className,
}: AiLampDialogProps) {
  const reduceMotion = useStableReducedMotion()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-[760px] overflow-hidden border-white/10 bg-[#040611]/96 p-0 shadow-[0_40px_120px_-48px_rgba(0,0,0,0.98)]', className)}>
        <div className="relative overflow-hidden rounded-[inherit]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(50,194,230,0.16)_0%,rgba(50,194,230,0.07)_24%,rgba(4,6,17,0)_56%),linear-gradient(180deg,rgba(5,8,18,0.72)_0%,rgba(4,6,17,1)_56%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_42px] opacity-[0.06]"
          />

          <div className="relative min-h-[460px] px-6 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
            <div className="relative isolate flex min-h-[250px] items-start justify-center overflow-hidden rounded-[28px] border border-white/6 bg-[rgba(6,9,19,0.86)]">
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(148,240,255,0.95),transparent)]" />
              <motion.div
                initial={reduceMotion ? false : { opacity: 0.6, width: '17rem' }}
                animate={reduceMotion ? undefined : { opacity: 1, width: '36rem' }}
                transition={reduceMotion ? undefined : { delay: 0.06, duration: 0.72, ease: chamberEase }}
                style={{ backgroundImage: 'conic-gradient(var(--conic-position), var(--tw-gradient-stops))' }}
                className="absolute right-1/2 top-0 h-60 w-[36rem] overflow-visible bg-gradient-conic from-cyan-400 via-transparent to-transparent [--conic-position:from_72deg_at_center_top]"
              >
                <div className="absolute bottom-0 left-0 h-44 w-full bg-[#060913] [mask-image:linear-gradient(to_top,white,transparent)]" />
                <div className="absolute bottom-0 left-0 h-full w-40 bg-[#060913] [mask-image:linear-gradient(to_right,white,transparent)]" />
              </motion.div>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0.6, width: '17rem' }}
                animate={reduceMotion ? undefined : { opacity: 1, width: '36rem' }}
                transition={reduceMotion ? undefined : { delay: 0.06, duration: 0.72, ease: chamberEase }}
                style={{ backgroundImage: 'conic-gradient(var(--conic-position), var(--tw-gradient-stops))' }}
                className="absolute left-1/2 top-0 h-60 w-[36rem] bg-gradient-conic from-transparent via-transparent to-cyan-400 [--conic-position:from_288deg_at_center_top]"
              >
                <div className="absolute bottom-0 right-0 h-full w-40 bg-[#060913] [mask-image:linear-gradient(to_left,white,transparent)]" />
                <div className="absolute bottom-0 right-0 h-44 w-full bg-[#060913] [mask-image:linear-gradient(to_top,white,transparent)]" />
              </motion.div>
              <div className="absolute top-[38%] h-40 w-full translate-y-6 scale-x-125 bg-[#050712] blur-2xl" />
              <div className="absolute top-[38%] z-10 h-40 w-full bg-transparent opacity-10 backdrop-blur-md" />
              <div className="absolute z-10 h-28 w-[24rem] translate-y-4 rounded-full bg-cyan-400/45 blur-3xl" />
              <motion.div
                initial={reduceMotion ? false : { width: '8rem' }}
                animate={reduceMotion ? undefined : { width: '15rem' }}
                transition={reduceMotion ? undefined : { delay: 0.08, duration: 0.72, ease: chamberEase }}
                className="absolute z-20 h-24 -translate-y-6 rounded-full bg-cyan-300/55 blur-2xl"
              />
              <motion.div
                initial={reduceMotion ? false : { width: '17rem' }}
                animate={reduceMotion ? undefined : { width: '36rem' }}
                transition={reduceMotion ? undefined : { delay: 0.06, duration: 0.72, ease: chamberEase }}
                className="absolute z-20 h-px -translate-y-[4.5rem] bg-cyan-300/95"
              />
              <div className="absolute z-20 h-36 w-full -translate-y-[8.9rem] bg-[#060913]" />

              <div className="relative z-30 flex min-h-[250px] max-w-[32rem] flex-col items-center justify-center px-6 py-10 text-center">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 18, filter: 'blur(12px)' }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={reduceMotion ? undefined : chamberSpring}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100/82"
                >
                  {badge}
                </motion.div>
                <DialogTitle asChild>
                  <motion.h2
                    initial={reduceMotion ? false : { opacity: 0.5, y: 42 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={reduceMotion ? undefined : { delay: 0.14, duration: 0.74, ease: chamberEase }}
                    className="mt-7 bg-gradient-to-br from-slate-100 via-cyan-50 to-slate-400 bg-clip-text text-[2.35rem] font-medium leading-[0.95] tracking-[-0.045em] text-transparent sm:text-[3.5rem]"
                  >
                    {title}
                  </motion.h2>
                </DialogTitle>
                <DialogDescription asChild>
                  <motion.p
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={reduceMotion ? undefined : { delay: 0.2, duration: 0.56, ease: chamberEase }}
                    className="mt-4 max-w-[29rem] text-sm leading-6 text-white/54 sm:text-[0.95rem]"
                  >
                    {description}
                  </motion.p>
                </DialogDescription>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {actions.map(({ label, description: actionDescription, icon: Icon, onSelect }, index) => (
                <motion.button
                  key={label}
                  type="button"
                  onClick={onSelect}
                  initial={reduceMotion ? false : { opacity: 0, y: 10, filter: 'blur(8px)' }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={
                    reduceMotion
                      ? undefined
                      : {
                          ...chamberSpring,
                          delay: 0.18 + index * 0.05,
                        }
                  }
                  whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,24,37,0.92)_0%,rgba(12,15,24,0.94)_100%)] p-4 text-left shadow-[0_18px_32px_-24px_rgba(0,0,0,0.92)] transition-[border-color,background-color,box-shadow] duration-200 hover:border-cyan-200/18 hover:bg-[linear-gradient(180deg,rgba(22,27,41,0.95)_0%,rgba(14,18,28,0.98)_100%)]"
                >
                  <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(111,226,255,0.14)_0%,rgba(111,226,255,0)_34%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  <div className="relative flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-100/88">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.96rem] font-medium tracking-[-0.02em] text-white">{label}</div>
                      <div className="mt-1 text-sm leading-5 text-white/48">{actionDescription}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
