'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { buildBlurUpReveal, buildTextStagger, chamberEase } from '@/lib/chamber-motion'
import { cn } from '@/lib/utils'

const motionTags = {
  div: motion.div,
  span: motion.span,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
}

type MotionTag = keyof typeof motionTags

type TextRevealProps = {
  as?: MotionTag
  text: string
  className?: string
  split?: 'line' | 'words' | 'chars'
  delay?: number
  stagger?: number
}

export function TextReveal({
  as = 'span',
  text,
  className,
  split = 'line',
  delay = 0,
  stagger,
}: TextRevealProps) {
  const reduceMotion = useStableReducedMotion()
  const MotionTag = motionTags[as]

  if (reduceMotion || split === 'line') {
    return (
      <MotionTag
        variants={reduceMotion ? undefined : buildBlurUpReveal({ delay })}
        initial={reduceMotion ? false : 'hidden'}
        animate={reduceMotion ? undefined : 'visible'}
        className={className}
      >
        {text}
      </MotionTag>
    )
  }

  const segments = split === 'chars' ? Array.from(text) : text.split(' ')

  return (
    <MotionTag
      aria-label={text}
      className={className}
      variants={buildTextStagger({ delayChildren: delay, staggerChildren: stagger ?? (split === 'chars' ? 0.014 : 0.03) })}
      initial="hidden"
      animate="visible"
    >
      <span className="sr-only">{text}</span>
      <motion.span aria-hidden className={cn('inline-flex flex-wrap', split === 'words' ? 'gap-x-[0.35em]' : '')}>
        {segments.map((segment, index) => (
          <motion.span
            key={`${segment}-${index}`}
            variants={buildBlurUpReveal({ distance: split === 'chars' ? 10 : 12, blur: split === 'chars' ? 8 : 10, duration: 0.36 })}
            transition={{ ease: chamberEase }}
            className="inline-block"
          >
            {segment === ' ' ? '\u00A0' : segment}
          </motion.span>
        ))}
      </motion.span>
    </MotionTag>
  )
}
