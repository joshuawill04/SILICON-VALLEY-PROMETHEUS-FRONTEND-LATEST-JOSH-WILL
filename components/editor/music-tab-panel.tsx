'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Music4, Plus, Search, Sparkles } from 'lucide-react'
import Image from 'next/image'

import { LuxuryVignette } from '@/components/editor/luxury-vignette'
import { TextReveal } from '@/components/editor/text-reveal'
import { chamberEase, chamberSpring } from '@/lib/chamber-motion'
import type { MusicRecommendation } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'

export function MusicTabPanel({
  tracks,
  projectTitle,
  selectedTrackId,
  reasoningSummary,
  onSelectTrack,
}: {
  tracks: MusicRecommendation[]
  projectTitle: string
  selectedTrackId: string | null
  reasoningSummary?: string
  onSelectTrack: (track: MusicRecommendation) => void
}) {
  const reduceMotion = useStableReducedMotion()
  const [focusedTrackId, setFocusedTrackId] = React.useState<string | null>(selectedTrackId ?? tracks[0]?.id ?? null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchFocused, setSearchFocused] = React.useState(false)

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
    () => tracks.find((track) => track.id === selectedTrackId) ?? null,
    [selectedTrackId, tracks],
  )
  const ambientTrack = selectedTrack ?? focusedTrack
  const resultsLabel = normalizedQuery
    ? `${filteredTracks.length} match${filteredTracks.length === 1 ? '' : 'es'}`
    : `${tracks.length} picks`

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
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
      transition={{ duration: reduceMotion ? 0 : 0.32, ease: chamberEase }}
      className="premium-ambient-panel premium-vignette-surface relative flex min-h-0 w-full max-w-[1080px] flex-1 self-center overflow-hidden rounded-[32px] px-5 py-5 sm:px-6 sm:py-6"
    >
      <LuxuryVignette tone="music" />

      {ambientTrack ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute left-[-5rem] top-[18%] h-60 w-60 rounded-full blur-3xl"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 72%), url(${ambientTrack.coverArtUrl})`,
              backgroundPosition: ambientTrack.coverArtPosition ?? 'center',
              backgroundSize: 'cover',
              opacity: 0.32,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-[-5rem] right-[-4rem] h-72 w-72 rounded-full blur-3xl"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,214,92,0.16) 0%, rgba(255,214,92,0) 68%), url(${ambientTrack.coverArtUrl})`,
              backgroundPosition: ambientTrack.coverArtPosition ?? 'center',
              backgroundSize: 'cover',
              opacity: 0.18,
            }}
          />
        </>
      ) : null}

      <div className="relative z-10 grid min-h-0 flex-1 gap-8 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <div className="flex min-h-0 min-w-0 flex-col">
          <TextReveal
            as="div"
            text="Music"
            delay={0.03}
            className="text-[11px] uppercase tracking-[0.22em] text-white/54"
          />

          <div className="mt-5">
            <TextReveal
              as="h2"
              text="Select a soundtrack"
              split="chars"
              delay={0.08}
              className="editor-display text-[clamp(2rem,3vw,2.75rem)] text-white"
            />
            <TextReveal as="p" text={projectTitle} delay={0.16} className="mt-3 text-sm leading-6 text-white/48" />
          </div>

          {focusedTrack ? (
            <div className="mt-8">
              <div className="relative flex min-h-[280px] items-center justify-center">
                <div
                  aria-hidden
                  className="absolute h-56 w-56 rounded-full blur-[76px]"
                  style={{
                    backgroundImage: `url(${focusedTrack.coverArtUrl})`,
                    backgroundPosition: focusedTrack.coverArtPosition ?? 'center',
                    backgroundSize: 'cover',
                    opacity: selectedTrack?.id === focusedTrack.id ? 0.36 : 0.22,
                  }}
                />

                <motion.button
                  type="button"
                  onClick={() => onSelectTrack(focusedTrack)}
                  whileHover={reduceMotion ? undefined : { scale: 1.018 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.988 }}
                  className="group relative grid h-[236px] w-[236px] place-items-center rounded-full"
                >
                  <motion.div
                    animate={reduceMotion ? undefined : { rotate: 360 }}
                    transition={
                      reduceMotion
                        ? undefined
                        : {
                            duration: 21,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: 'linear',
                          }
                    }
                    className="relative h-[236px] w-[236px] rounded-full p-[3px] shadow-[0_26px_58px_-30px_rgba(0,0,0,0.98)]"
                    style={{
                      background:
                        selectedTrack?.id === focusedTrack.id
                          ? 'conic-gradient(from 180deg, rgba(255,255,255,0.34), rgba(255,214,92,0.28), rgba(255,255,255,0.12), rgba(255,255,255,0.34))'
                          : 'conic-gradient(from 180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08), rgba(255,255,255,0.16), rgba(255,255,255,0.22))',
                    }}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-full bg-black">
                      <Image
                        src={focusedTrack.coverArtUrl}
                        alt={focusedTrack.title}
                        fill
                        sizes="236px"
                        priority
                        className="object-cover"
                        style={{ objectPosition: focusedTrack.coverArtPosition ?? 'center' }}
                      />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_26%),linear-gradient(180deg,rgba(0,0,0,0)_38%,rgba(0,0,0,0.52)_100%)]" />
                      <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/16 bg-[#090a0f] shadow-[0_0_0_10px_rgba(8,9,14,0.82)]" />
                    </div>
                  </motion.div>
                </motion.button>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={focusedTrack.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 8, filter: 'blur(6px)' }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6, filter: 'blur(4px)' }}
                  transition={{ duration: reduceMotion ? 0 : 0.24, ease: chamberEase }}
                  className="mt-3"
                >
                  <TextReveal
                    as="div"
                    text={focusedTrack.title}
                    delay={0.02}
                    className="editor-display-soft text-[1.5rem] text-white"
                  />
                  <TextReveal
                    as="div"
                    text={`${focusedTrack.artist}${focusedTrack.subtitle ? ` / ${focusedTrack.subtitle}` : ''}`}
                    delay={0.07}
                    className="mt-1.5 text-sm text-white/54"
                  />
                  <TextReveal
                    as="p"
                    text={focusedTrack.reason || focusedTrack.description || 'Balanced soundtrack recommendation for this edit.'}
                    delay={0.11}
                    className="mt-3 max-w-[30rem] text-sm leading-6 text-white/48"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <motion.button
                      type="button"
                      onClick={() => onSelectTrack(focusedTrack)}
                      whileHover={reduceMotion ? undefined : { y: -1 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium tracking-[-0.02em] transition-[background-color,color,box-shadow] duration-200',
                        selectedTrack?.id === focusedTrack.id
                          ? 'bg-white text-[#0d1118] shadow-[0_16px_34px_-24px_rgba(255,255,255,0.88)]'
                          : 'bg-white/[0.08] text-white/88 hover:bg-white/[0.12]',
                      )}
                    >
                      {selectedTrack?.id === focusedTrack.id ? <Check className="size-4" /> : <Plus className="size-4" />}
                      <TextReveal
                        as="span"
                        text={selectedTrack?.id === focusedTrack.id ? 'Selected for this video' : 'Add song'}
                        className="whitespace-nowrap"
                      />
                    </motion.button>

                    <TextReveal
                      as="span"
                      text={`${focusedTrack.bpm} BPM`}
                      delay={0.14}
                      className="text-xs uppercase tracking-[0.22em] text-white/34"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <TextReveal as="div" text="Songs" delay={0.1} className="text-base font-semibold tracking-[-0.02em] text-white" />
              <TextReveal
                as="p"
                text="Choose one track for this video."
                delay={0.14}
                className="mt-1 text-xs leading-5 text-white/44"
              />
            </div>

            <div className="flex w-full min-w-0 max-w-[26rem] items-center justify-end gap-2 self-end sm:w-auto">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 4, scaleX: 0.86, filter: 'blur(6px)' }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        scaleX: searchFocused ? 1.02 : 1,
                        filter: 'blur(0px)',
                      }
                }
                transition={reduceMotion ? undefined : chamberSpring}
                className="premium-search-pill flex min-w-0 flex-1 origin-center items-center gap-2 rounded-full px-3 py-2"
              >
                <Search className="size-4 shrink-0 text-white/34" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search soundtracks..."
                  aria-label="Search soundtracks"
                  className="premium-search-input min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
                />
              </motion.div>

              <TextReveal
                as="div"
                text={resultsLabel}
                delay={0.18}
                className="shrink-0 rounded-full bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/36"
              />
            </div>
          </div>

          <div className="premium-scroll-mask mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-3 [scrollbar-width:thin]">
            {filteredTracks.length ? (
              <div className="space-y-1.5">
                {filteredTracks.map((track, index) => {
                  const isFocused = focusedTrack?.id === track.id
                  const isSelected = selectedTrack?.id === track.id

                  return (
                    <motion.div
                      key={track.id}
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: 14, filter: 'blur(8px)' }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -10, filter: 'blur(6px)' }}
                      transition={
                        reduceMotion
                          ? undefined
                          : {
                              ...chamberSpring,
                              delay: 0.05 + index * 0.035,
                            }
                      }
                      className={cn(
                        'group relative flex items-center gap-3 rounded-[24px] px-2 py-2.5 transition-[background-color,transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        isSelected
                          ? 'bg-white/[0.08] shadow-[0_20px_30px_-28px_rgba(255,255,255,0.2)]'
                          : isFocused
                            ? 'bg-white/[0.05]'
                            : 'hover:bg-white/[0.04]',
                      )}
                    >
                      {isSelected ? (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_left,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_64%)]"
                        />
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setFocusedTrackId(track.id)}
                        className="focus-ring-glow relative z-10 flex min-w-0 flex-1 items-center gap-3 rounded-[20px] text-left"
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[18px] bg-black/30 shadow-[0_14px_24px_-20px_rgba(0,0,0,0.95)]">
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
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(0,0,0,0.2)_100%)]" />
                        </div>

                        <div className="min-w-0">
                          <TextReveal
                            as="div"
                            text={track.title}
                            delay={0.04 + index * 0.025}
                            className="truncate text-[1rem] font-medium tracking-[-0.03em] text-white"
                          />
                          <TextReveal
                            as="div"
                            text={track.artist}
                            delay={0.06 + index * 0.025}
                            className="truncate text-sm text-white/52"
                          />
                        </div>
                      </button>

                      <motion.button
                        type="button"
                        aria-label={isSelected ? `${track.title} selected for this video` : `Add ${track.title} to this video`}
                        onClick={() => {
                          setFocusedTrackId(track.id)
                          onSelectTrack(track)
                        }}
                        whileHover={reduceMotion ? undefined : { y: -1, scale: 1.03 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        className={cn(
                          'relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full transition-[background-color,color,box-shadow] duration-200',
                          isSelected
                            ? 'bg-white text-[#0d1118] shadow-[0_16px_28px_-22px_rgba(255,255,255,0.82)]'
                            : 'bg-white/[0.05] text-white/66 hover:bg-white/[0.1] hover:text-white',
                        )}
                      >
                        <AnimatePresence initial={false} mode="wait">
                          <motion.span
                            key={isSelected ? `selected-${track.id}` : `add-${track.id}`}
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.84, rotate: -10 }}
                            animate={reduceMotion ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.84, rotate: 10 }}
                            transition={{ duration: reduceMotion ? 0 : 0.18, ease: chamberEase }}
                            className="inline-flex items-center justify-center"
                          >
                            {isSelected ? <Check className="size-4" /> : <Plus className="size-4" />}
                          </motion.span>
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-[220px] items-center justify-center px-4 text-center">
                <div>
                  <TextReveal
                    as="div"
                    text="No soundtracks found"
                    split="words"
                    delay={0.06}
                    className="text-base font-medium text-white/78"
                  />
                  <TextReveal
                    as="p"
                    text="Try a different song, artist, or soundtrack phrase."
                    delay={0.12}
                    className="mt-2 text-sm text-white/42"
                  />
                </div>
              </div>
            )}
          </div>

          {reasoningSummary ? (
            <TextReveal as="p" text={reasoningSummary} delay={0.2} className="mt-4 text-xs leading-6 text-white/38" />
          ) : null}
        </div>
      </div>
    </motion.section>
  )
}
