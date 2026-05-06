export const chamberEase = [0.22, 1, 0.36, 1] as const

export const chamberSpring = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 24,
  mass: 0.84,
}

export function buildBlurUpReveal({
  delay = 0,
  distance = 14,
  blur = 10,
  duration = 0.42,
}: {
  delay?: number
  distance?: number
  blur?: number
  duration?: number
} = {}) {
  return {
    hidden: {
      opacity: 0,
      y: distance,
      filter: `blur(${blur}px)`,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration,
        delay,
        ease: chamberEase,
      },
    },
  }
}

export function buildTextStagger({
  delayChildren = 0,
  staggerChildren = 0.02,
}: {
  delayChildren?: number
  staggerChildren?: number
} = {}) {
  return {
    hidden: {},
    visible: {
      transition: {
        delayChildren,
        staggerChildren,
      },
    },
  }
}
