'use client'

import * as React from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Pause, Play, Plus } from 'lucide-react'
import Image from 'next/image'

import { InertialSongScroller } from '@/components/editor/inertial-song-scroller'
import { LuxuryVignette } from '@/components/editor/luxury-vignette'
import { TextReveal } from '@/components/editor/text-reveal'
import ExpandableSearchBar from '@/components/ui/expandable-search-bar'
import { MusicPlayer } from '@/components/ui/music-player'
import { chamberEase, chamberSpring } from '@/lib/chamber-motion'
import type { MusicRecommendation } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'

const rowHoverSpring = {
  stiffness: 240,
  damping: 22,
  mass: 0.58,
}

type SelectedSongDisplay = {
  id: string
  title: string
  metadataLine: string
  artwork: string
  artworkPosition: string
  audioSrc: string
}

function buildParallaxRange(reduceMotion: boolean, output: [number, number]) {
  return reduceMotion ? [0, 0] : output
}

function buildSelectedSongDisplay(track: MusicRecommendation): SelectedSongDisplay {
  const sourceLabel = track.sourcePlatform === 'online' ? 'Streaming' : 'Prometheus Audio'
  const metadataLine = [track.artist, track.subtitle || sourceLabel, track.genre].filter(Boolean).join(' / ')

  return {
    id: track.id,
    title: track.title,
    metadataLine,
    artwork: track.coverArtUrl,
    artworkPosition: track.coverArtPosition ?? 'center',
    audioSrc: track.previewUrl,
  }
}

function SongRailItem({
  index,
  isFocused,
  isSelected,
  isPlaying,
  onFocus,
  onPlayPause,
  onSelect,
  reduceMotion,
  track,
}: {
  index: number
  isFocused: boolean
  isSelected: boolean
  isPlaying: boolean
  onFocus: () => void
  onPlayPause: () => void
  onSelect: () => void
  reduceMotion: boolean
  track: MusicRecommendation
}) {
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const previousSelectedRef = React.useRef(isSelected)
  const [selectionBurst, setSelectionBurst] = React.useState(0)

  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], buildParallaxRange(reduceMotion, [2.4, -2.4])), rowHoverSpring)
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], buildParallaxRange(reduceMotion, [-3, 3])), rowHoverSpring)
  const bodyX = useSpring(useTransform(pointerX, [-0.5, 0.5], buildParallaxRange(reduceMotion, [-1.3, 1.3])), rowHoverSpring)
  const bodyY = useSpring(useTransform(pointerY, [-0.5, 0.5], buildParallaxRange(reduceMotion, [-1, 1])), rowHoverSpring)
  const artX = useSpring(useTransform(pointerX, [-0.5, 0.5], buildParallaxRange(reduceMotion, [-2.2, 2.2])), rowHoverSpring)
  const artY = useSpring(useTransform(pointerY, [-0.5, 0.5], buildParallaxRange(reduceMotion, [-1.8, 1.8])), rowHoverSpring)

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reduceMotion) return

      const rect = event.currentTarget.getBoundingClientRect()
      const nextX = (event.clientX - rect.left) / rect.width - 0.5
      const nextY = (event.clientY - rect.top) / rect.height - 0.5

      pointerX.set(nextX)
      pointerY.set(nextY)
    },
    [pointerX, pointerY, reduceMotion],
  )

  const handlePointerLeave = React.useCallback(() => {
    pointerX.set(0)
    pointerY.set(0)
  }, [pointerX, pointerY])

  React.useEffect(() => {
    if (isSelected && !previousSelectedRef.current) {
      setSelectionBurst((value) => value + 1)
    }

    previousSelectedRef.current = isSelected
  }, [isSelected])

  return (
    <motion.div
      role="button"
      tabIndex={0}
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 12, filter: 'blur(8px)' }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8, filter: 'blur(5px)' }}
      transition={
        reduceMotion
          ? undefined
          : {
              ...chamberSpring,
              delay: 0.04 + index * 0.03,
            }
      }
      whileHover={reduceMotion ? undefined : { scale: 1.008, y: -1.5 }}
      onClick={onFocus}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onFocus()
        }
      }}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={reduceMotion ? undefined : { x: bodyX, y: bodyY, rotateX, rotateY, transformPerspective: 1100 }}
      className={cn(
        'group relative mb-2 flex items-center gap-2.5 overflow-hidden rounded-[22px] border px-2.5 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-220 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none',
        isSelected
          ? 'border-[#84dfff]/30 bg-[rgba(22,28,40,0.88)] shadow-[0_14px_30px_-28px_rgba(113,214,255,0.38),inset_0_1px_0_rgba(255,255,255,0.08)]'
          : isFocused
            ? 'border-white/16 bg-[rgba(22,26,36,0.82)] shadow-[0_16px_34px_-30px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.07)]'
            : 'border-white/10 bg-[rgba(18,21,30,0.72)] shadow-[0_14px_28px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/14 hover:bg-[rgba(21,25,35,0.82)]',
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0)_28%,rgba(0,0,0,0.22)_100%)]" />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-[1px] rounded-[21px] border',
          isSelected ? 'border-[#b6efff]/18' : 'border-white/5',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-220',
          isSelected
            ? 'opacity-100 bg-[radial-gradient(circle_at_12%_50%,rgba(117,214,255,0.18)_0%,rgba(117,214,255,0.06)_24%,rgba(117,214,255,0)_54%)]'
            : 'group-hover:opacity-100 bg-[radial-gradient(circle_at_14%_26%,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_40%)]',
        )}
      />

      <div className="focus-ring-glow relative z-10 flex min-w-0 flex-1 items-center gap-3 rounded-[18px] pr-1">
        <motion.div
          style={reduceMotion ? undefined : { x: artX, y: artY }}
          className="relative h-[3.5rem] w-[3.5rem] shrink-0 overflow-hidden rounded-[16px] border border-white/8 bg-black/30 shadow-[0_12px_28px_-20px_rgba(0,0,0,0.95)]"
        >
          <Image
            src={track.coverArtUrl}
            alt={track.title}
            fill
            sizes="56px"
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            className="object-cover"
            style={{ objectPosition: track.coverArtPosition ?? 'center' }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_34%,rgba(0,0,0,0.28)_100%)]" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.98rem] font-medium tracking-[-0.025em] text-white">{track.title}</div>
          <div className="mt-0.5 truncate text-[0.82rem] text-white/46">{track.artist}</div>
        </div>
      </div>

      <motion.button
        type="button"
        aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        onClick={(event) => {
          event.stopPropagation()
          onPlayPause()
        }}
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        className={cn(
          'relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-[border-color,background-color,color] duration-200',
          isPlaying
            ? 'border-white/22 bg-white text-black'
            : 'border-white/10 bg-white/[0.03] text-white/76 hover:border-white/18 hover:bg-white/[0.08] hover:text-white',
        )}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={isPlaying ? `pause-${track.id}` : `play-${track.id}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.72 }}
            transition={{ duration: reduceMotion ? 0 : 0.16, ease: chamberEase }}
            className="inline-flex items-center justify-center"
          >
            {isPlaying ? <Pause className="size-[17px]" strokeWidth={1.9} /> : <Play className="ml-0.5 size-[17px]" strokeWidth={1.9} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <motion.button
        type="button"
        aria-label={isSelected ? `${track.title} selected for this video` : `Add ${track.title} to this video`}
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
        whileHover={reduceMotion ? undefined : { scale: 1.05, rotate: 2 }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        data-slot="button"
        style={{ ['--button-glow' as string]: isSelected ? '127 242 255' : '255 255 255' }}
        className={cn(
          'relative z-10 grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[16px] border backdrop-blur-xl transition-[background-color,border-color,color,box-shadow] duration-220',
          isSelected
            ? 'border-[#86e7ff]/32 bg-[rgba(74,121,170,0.24)] text-white shadow-[0_14px_24px_-22px_rgba(101,213,255,0.32)]'
            : 'border-white/10 bg-white/[0.06] text-white/64 hover:border-white/16 hover:bg-white/[0.1] hover:text-white',
        )}
      >
        <AnimatePresence>
          {selectionBurst > 0 && isSelected ? (
            <motion.span
              key={`pulse-${selectionBurst}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 0.36, 0], scale: [0.7, 1.2, 1.34] }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.46, ease: chamberEase }}
              className="pointer-events-none absolute inset-[-3px] rounded-[18px] border border-[#8ce7ff]/32"
            />
          ) : null}
        </AnimatePresence>
        <span aria-hidden className="pointer-events-none absolute inset-[1px] rounded-[15px] bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_34%,rgba(255,255,255,0)_100%)]" />
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={isSelected ? `selected-${track.id}` : `add-${track.id}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.78, rotate: -14 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.72, rotate: 18 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: chamberEase }}
            className="inline-flex items-center justify-center"
          >
            {isSelected ? (
              <motion.svg
                viewBox="0 0 16 16"
                fill="none"
                className="size-4"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
              >
                <motion.path
                  d="M3.5 8.4 6.6 11.4 12.6 4.8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduceMotion ? false : { pathLength: 0, opacity: 0.4 }}
                  animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.24, ease: chamberEase }}
                />
              </motion.svg>
            ) : (
              <Plus className="size-4" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}

export function MusicTabPanel({
  tracks,
  projectTitle,
  selectedTrackId,
  onSelectTrack,
}: {
  tracks: MusicRecommendation[]
  projectTitle: string
  selectedTrackId: string | null
  onSelectTrack: (track: MusicRecommendation) => void
}) {
  const reduceMotion = useStableReducedMotion()
  const [localSelectedTrackId, setLocalSelectedTrackId] = React.useState<string | null>(selectedTrackId ?? tracks[0]?.id ?? null)
  const [focusedTrackId, setFocusedTrackId] = React.useState<string | null>(selectedTrackId ?? tracks[0]?.id ?? null)
  const [playingTrackId, setPlayingTrackId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredTracks = React.useMemo(() => {
    if (!normalizedQuery) return tracks

    return tracks.filter((track) => {
      const haystack = [track.title, track.artist, track.subtitle, track.description, track.reason]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [normalizedQuery, tracks])

  React.useEffect(() => {
    if (!selectedTrackId && !localSelectedTrackId && tracks[0]) {
      setLocalSelectedTrackId(tracks[0].id)
      onSelectTrack(tracks[0])
    }
  }, [localSelectedTrackId, onSelectTrack, selectedTrackId, tracks])

  React.useEffect(() => {
    const trackIds = new Set(tracks.map((track) => track.id))
    if (!trackIds.size) {
      setLocalSelectedTrackId(null)
      return
    }

    if (selectedTrackId && trackIds.has(selectedTrackId)) {
      setLocalSelectedTrackId(selectedTrackId)
      return
    }

    setLocalSelectedTrackId((current) => (current && trackIds.has(current) ? current : tracks[0]?.id ?? null))
  }, [selectedTrackId, tracks])

  React.useEffect(() => {
    const trackIds = new Set(tracks.map((track) => track.id))
    if (!trackIds.size) {
      setFocusedTrackId(null)
      return
    }

    const fallbackTrackId = selectedTrackId && trackIds.has(selectedTrackId) ? selectedTrackId : tracks[0]?.id ?? null
    setFocusedTrackId((current) => (current && trackIds.has(current) ? current : fallbackTrackId))
  }, [selectedTrackId, tracks])

  React.useEffect(() => {
    if (!filteredTracks.length) return

    const filteredIds = new Set(filteredTracks.map((track) => track.id))
    const fallbackTrackId =
      (selectedTrackId && filteredIds.has(selectedTrackId) ? selectedTrackId : null)
      ?? filteredTracks[0]?.id
      ?? null

    setFocusedTrackId((current) => (current && filteredIds.has(current) ? current : fallbackTrackId))
  }, [filteredTracks, selectedTrackId])

  const focusedTrack = React.useMemo(
    () =>
      filteredTracks.find((track) => track.id === focusedTrackId)
      ?? tracks.find((track) => track.id === focusedTrackId)
      ?? tracks.find((track) => track.id === selectedTrackId)
      ?? tracks[0]
      ?? null,
    [filteredTracks, focusedTrackId, selectedTrackId, tracks],
  )

  const selectedTrack = React.useMemo(
    () => tracks.find((track) => track.id === localSelectedTrackId) ?? tracks.find((track) => track.id === selectedTrackId) ?? null,
    [localSelectedTrackId, selectedTrackId, tracks],
  )
  const activeTrack = React.useMemo(() => selectedTrack ?? focusedTrack, [focusedTrack, selectedTrack])
  const selectedSong = React.useMemo(
    () => (activeTrack ? buildSelectedSongDisplay(activeTrack) : null),
    [activeTrack],
  )
  const playerTrackCount = React.useMemo(
    () => (filteredTracks.length ? filteredTracks : tracks).length,
    [filteredTracks, tracks],
  )

  const handlePlayerStep = React.useCallback(
    (direction: 'previous' | 'next', options: { shuffle: boolean }) => {
      const playlist = filteredTracks.length ? filteredTracks : tracks
      const governingTrack = selectedTrack ?? focusedTrack
      if (!playlist.length || !governingTrack) return

      let nextTrack: MusicRecommendation | null = null

      if (options.shuffle && playlist.length > 1) {
        const candidates = playlist.filter((track) => track.id !== governingTrack.id)
        nextTrack = candidates[Math.floor(Math.random() * candidates.length)] ?? null
      } else {
        const currentIndex = playlist.findIndex((track) => track.id === governingTrack.id)
        const safeIndex = currentIndex >= 0 ? currentIndex : 0
        const delta = direction === 'next' ? 1 : -1
        const nextIndex = (safeIndex + delta + playlist.length) % playlist.length
        nextTrack = playlist[nextIndex] ?? null
      }

      if (!nextTrack) return
      setLocalSelectedTrackId(nextTrack.id)
      setFocusedTrackId(nextTrack.id)
      setPlayingTrackId((current) => (current ? nextTrack.id : current))
      onSelectTrack(nextTrack)
    },
    [filteredTracks, focusedTrack, onSelectTrack, selectedTrack, tracks],
  )

  const handleTrackSelection = React.useCallback(
    (track: MusicRecommendation) => {
      setLocalSelectedTrackId(track.id)
      setFocusedTrackId(track.id)
      onSelectTrack(track)
    },
    [onSelectTrack],
  )

  const handleTrackPlayPause = React.useCallback(
    (track: MusicRecommendation) => {
      handleTrackSelection(track)
      setPlayingTrackId((current) => (current === track.id ? null : track.id))
    },
    [handleTrackSelection],
  )

  if (!tracks.length) {
    return (
      <section className="premium-ambient-panel premium-vignette-surface flex w-full max-w-[1060px] self-center rounded-[30px] px-5 py-5 shadow-[0_28px_64px_-38px_rgba(0,0,0,0.95)]">
        <LuxuryVignette tone="music" />
        <div className="relative z-10">
          <TextReveal as="div" text="Music" className="text-[11px] uppercase tracking-[0.22em] text-white/56" />
          <TextReveal
            as="div"
            text="Soundtrack options will appear here"
            delay={0.08}
            className="editor-display-soft mt-4 text-lg text-white"
          />
          <TextReveal
            as="p"
            text="Prometheus will surface the song picker once the edit context is ready."
            delay={0.12}
            className="mt-2 max-w-[36rem] text-sm leading-6 text-white/52"
          />
        </div>
      </section>
    )
  }

  return (
    <motion.section
      key="editor-music-tab-panel"
      aria-label={`${projectTitle} soundtrack selector`}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
      transition={{ duration: reduceMotion ? 0 : 0.3, ease: chamberEase }}
      className="relative flex min-h-0 w-full max-w-[1080px] flex-1 self-center overflow-hidden rounded-[32px] border border-white/8 bg-black px-4 py-4 sm:px-5 sm:py-5"
    >
      <div className="relative z-10 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(18rem,1.04fr)_minmax(21rem,0.9fr)] xl:grid-cols-[minmax(20rem,1.08fr)_minmax(22rem,0.92fr)]">
        <div className="flex min-h-0 min-w-0">
          {selectedSong ? (
            <div className="music-hero-shell relative flex min-h-0 flex-1 flex-col rounded-[28px] border border-white/8 bg-black p-4 shadow-[0_24px_54px_-44px_rgba(0,0,0,0.98)] sm:p-5">
              <MusicPlayer
                albumArt={selectedSong.artwork}
                albumArtPosition={selectedSong.artworkPosition}
                songTitle={selectedSong.title}
                artistName={selectedSong.metadataLine}
                audioSrc={selectedSong.audioSrc}
                isPlaying={playingTrackId === selectedSong.id}
                onPlayingChange={(nextPlaying) => {
                  setPlayingTrackId(nextPlaying ? selectedSong.id : null)
                }}
                onPrevious={({ shuffle }) => handlePlayerStep('previous', { shuffle })}
                onNext={({ shuffle }) => handlePlayerStep('next', { shuffle })}
                canPrevious={playerTrackCount > 1}
                canNext={playerTrackCount > 1}
                className="relative z-10 flex-1"
              />
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 min-w-0 flex-col pl-2 pr-1 pt-1 sm:pl-3 sm:pr-2">
          <div className="flex items-center justify-end gap-3 pr-4 sm:pr-5">
            <div className="flex min-w-0 flex-1 justify-end">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 4, scale: 0.96, filter: 'blur(6px)' }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={reduceMotion ? undefined : chamberSpring}
                className="shrink-0"
              >
                <ExpandableSearchBar
                  expandDirection="left"
                  width={216}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  onSearch={setSearchQuery}
                  placeholder="Search tracks"
                  className="shrink-0"
                  buttonClassName="border-white/18 bg-black text-white/72 shadow-none hover:border-white/28 hover:bg-black hover:text-white"
                  surfaceClassName="border-white/18 bg-black px-0 shadow-none"
                  inputClassName="pr-2 text-white placeholder:text-white/28"
                />
              </motion.div>
            </div>
          </div>

          <InertialSongScroller className="mt-4 min-h-0 flex-1" contentClassName="px-0.5 py-3" reducedMotion={reduceMotion}>
            {filteredTracks.length ? (
              <div>
                {filteredTracks.map((track, index) => (
                  <SongRailItem
                    key={track.id}
                    track={track}
                    index={index}
                    isFocused={focusedTrack?.id === track.id}
                    isSelected={selectedTrack?.id === track.id}
                    isPlaying={playingTrackId === track.id}
                    reduceMotion={reduceMotion}
                    onFocus={() => handleTrackSelection(track)}
                    onPlayPause={() => handleTrackPlayPause(track)}
                    onSelect={() => handleTrackSelection(track)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-[220px] items-center justify-center px-4 text-center">
                <div>
                  <div className="text-base font-medium text-white/78">No soundtracks found</div>
                  <div className="mt-2 text-sm text-white/42">Try a different song, artist, or soundtrack phrase.</div>
                </div>
              </div>
            )}
          </InertialSongScroller>
        </div>
      </div>
    </motion.section>
  )
}
