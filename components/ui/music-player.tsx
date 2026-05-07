'use client'

import * as React from 'react'
import { AnimatePresence, motion, useAnimationFrame, useMotionValue } from 'framer-motion'
import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward } from 'lucide-react'
import Image from 'next/image'

import { chamberEase } from '@/lib/chamber-motion'
import { cn } from '@/lib/utils'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'

const formatTime = (timeInSeconds: number): string => {
  if (Number.isNaN(timeInSeconds)) return '00:00'
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

type MusicPlayerProps = {
  albumArt: string
  albumArtPosition?: string
  songTitle: string
  artistName: string
  audioSrc: string
  isPlaying?: boolean
  onPlayingChange?: (nextPlaying: boolean) => void
  onPrevious?: (options: { shuffle: boolean }) => void
  onNext?: (options: { shuffle: boolean }) => void
  canPrevious?: boolean
  canNext?: boolean
  className?: string
}

export function MusicPlayer({
  albumArt,
  albumArtPosition = 'center',
  songTitle,
  artistName,
  audioSrc,
  isPlaying: isPlayingProp,
  onPlayingChange,
  onPrevious,
  onNext,
  canPrevious = false,
  canNext = false,
  className,
}: MusicPlayerProps) {
  const reduceMotion = useStableReducedMotion()
  const [internalIsPlaying, setInternalIsPlaying] = React.useState(false)
  const [duration, setDuration] = React.useState(0)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [isShuffle, setIsShuffle] = React.useState(false)
  const [isRepeat, setIsRepeat] = React.useState(false)

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const progressBarRef = React.useRef<HTMLInputElement | null>(null)
  const rotation = useMotionValue(0)
  const isControlledPlaying = typeof isPlayingProp === 'boolean'
  const isPlaying = isControlledPlaying ? isPlayingProp : internalIsPlaying

  const setPlayingState = React.useCallback(
    (nextPlaying: boolean) => {
      if (!isControlledPlaying) {
        setInternalIsPlaying(nextPlaying)
      }

      onPlayingChange?.(nextPlaying)
    },
    [isControlledPlaying, onPlayingChange],
  )

  const syncProgressVisual = React.useCallback((time: number, totalDuration: number) => {
    if (!progressBarRef.current) return
    const progress = totalDuration > 0 ? (time / totalDuration) * 100 : 0
    progressBarRef.current.style.setProperty('--progress', `${progress}%`)
  }, [])

  React.useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
    syncProgressVisual(0, 0)
    if (!reduceMotion) {
      rotation.set((rotation.get() + 24) % 360)
    }
  }, [audioSrc, reduceMotion, rotation, syncProgressVisual])

  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const setAudioData = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0
      setDuration(nextDuration)
      setCurrentTime(audio.currentTime)
      syncProgressVisual(audio.currentTime, nextDuration)
    }

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime)
      syncProgressVisual(audio.currentTime, audio.duration)
    }

    const handleEnded = () => {
      if (isRepeat) return
      setPlayingState(false)
    }

    audio.addEventListener('loadedmetadata', setAudioData)
    audio.addEventListener('timeupdate', setAudioTime)
    audio.addEventListener('ended', handleEnded)

    if (isPlaying) {
      void audio.play().catch(() => {
        // Keep the visual playback state alive even if the browser blocks preview audio.
      })
    } else {
      audio.pause()
    }

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData)
      audio.removeEventListener('timeupdate', setAudioTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioSrc, isPlaying, isRepeat, setPlayingState, syncProgressVisual])

  useAnimationFrame((_, delta) => {
    if (reduceMotion) return
    const speed = isPlaying ? 0.013 : 0.0028
    rotation.set((rotation.get() + delta * speed) % 360)
  })

  const handleSeek = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!audioRef.current) return
      const nextTime = Number(event.target.value)
      audioRef.current.currentTime = nextTime
      setCurrentTime(nextTime)
      syncProgressVisual(nextTime, duration)
    },
    [duration, syncProgressVisual],
  )

  const handlePrevious = React.useCallback(() => {
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      setCurrentTime(0)
      syncProgressVisual(0, duration)
      return
    }

    onPrevious?.({ shuffle: isShuffle })
  }, [duration, isShuffle, onPrevious, syncProgressVisual])

  const handleNext = React.useCallback(() => {
    onNext?.({ shuffle: isShuffle })
  }, [isShuffle, onNext])

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center rounded-[26px] bg-black px-5 py-6 text-white sm:px-6 sm:py-6',
        className,
      )}
    >
      <style>{`
        .music-player-progress {
          --progress: 0%;
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 2px;
          border-radius: 999px;
          outline: none;
          cursor: pointer;
          background: rgba(255,255,255,0.18);
          background-image: linear-gradient(rgba(255,255,255,0.96), rgba(255,255,255,0.96));
          background-size: var(--progress) 100%;
          background-repeat: no-repeat;
        }

        .music-player-progress::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          margin-top: -6px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.96);
          background: rgba(255,255,255,0.96);
          box-shadow: 0 4px 18px rgba(0,0,0,0.42);
        }

        .music-player-progress::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.96);
          background: rgba(255,255,255,0.96);
          box-shadow: 0 4px 18px rgba(0,0,0,0.42);
        }
      `}</style>

      <audio ref={audioRef} src={audioSrc} loop={isRepeat} preload="metadata" />

      <div className="relative mb-5 flex min-h-[14.5rem] items-center justify-center">
        <motion.div
          key={albumArt}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: chamberEase }}
          style={reduceMotion ? undefined : { rotate: rotation }}
          className="relative z-10 h-44 w-44 overflow-hidden rounded-full border border-white/8 shadow-[0_20px_42px_-30px_rgba(0,0,0,0.98)] sm:h-48 sm:w-48"
        >
          <Image
            src={albumArt}
            alt={`${songTitle} album art`}
            fill
            sizes="192px"
            priority
            className="object-cover"
            style={{ objectPosition: albumArtPosition }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_20%,rgba(0,0,0,0.4)_100%)]" />
          <div className="absolute inset-[1px] rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black shadow-[0_0_0_8px_rgba(0,0,0,0.92)]" />
        </motion.div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${songTitle}-${artistName}`}
          initial={reduceMotion ? false : { opacity: 0, y: 8, filter: 'blur(6px)' }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6, filter: 'blur(4px)' }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: chamberEase }}
          className="w-full"
        >
          <div className="text-center">
            <h2 className="text-[1.38rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.55rem]">{songTitle}</h2>
            <p className="mt-1 text-[0.92rem] text-white/72">{artistName}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 w-full max-w-[18rem]">
        <div className="mb-7 flex items-center gap-x-3">
          <span className="w-12 text-left font-mono text-[11px] text-white/78">{formatTime(currentTime)}</span>
          <input
            ref={progressBarRef}
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="music-player-progress flex-grow"
          />
          <span className="w-12 text-right font-mono text-[11px] text-white/78">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-6">
          <motion.button
            type="button"
            whileHover={reduceMotion ? undefined : { scale: 1.06 }}
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            onClick={() => setIsShuffle((value) => !value)}
            className={cn(
              'grid h-8 w-8 place-items-center text-white transition-colors',
              isShuffle ? 'text-white' : 'text-white/72 hover:text-white',
            )}
            aria-label="Toggle shuffle"
          >
            <Shuffle className="size-[17px]" />
          </motion.button>

          <motion.button
            type="button"
            whileHover={reduceMotion ? undefined : { scale: 1.06 }}
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            onClick={handlePrevious}
            disabled={!canPrevious}
            className="grid h-9 w-9 place-items-center text-white transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Previous track"
          >
            <SkipBack className="size-6" strokeWidth={1.85} />
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setPlayingState(!isPlaying)}
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            className="flex h-10 w-10 items-center justify-center text-white"
            aria-label={isPlaying ? 'Pause track' : 'Play track'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isPlaying ? 'pause' : 'play'}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                className="inline-flex items-center justify-center"
              >
                {isPlaying ? <Pause className="size-7" strokeWidth={1.9} /> : <Play className="ml-0.5 size-7" strokeWidth={1.9} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <motion.button
            type="button"
            whileHover={reduceMotion ? undefined : { scale: 1.06 }}
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            onClick={handleNext}
            disabled={!canNext}
            className="grid h-9 w-9 place-items-center text-white transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Next track"
          >
            <SkipForward className="size-6" strokeWidth={1.85} />
          </motion.button>

          <motion.button
            type="button"
            whileHover={reduceMotion ? undefined : { scale: 1.06 }}
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            onClick={() => setIsRepeat((value) => !value)}
            className={cn(
              'grid h-8 w-8 place-items-center text-white transition-colors',
              isRepeat ? 'text-white' : 'text-white/72 hover:text-white',
            )}
            aria-label="Toggle repeat"
          >
            <Repeat className="size-[17px]" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
