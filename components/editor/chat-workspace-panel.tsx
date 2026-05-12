'use client'

import * as React from 'react'
import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Film,
  MessageSquare,
  Music4,
  Pause,
  Play,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  Wand2,
  X,
  ArrowUp,
  ImageIcon,
  PenSquare,
  CopyPlus,
} from 'lucide-react'
import { toast } from 'sonner'

import { MusicPlayNotification } from '@/components/editor/music-play-notification'
import { MusicSpotlightOrb } from '@/components/editor/music-spotlight-orb'
import { MusicRecommendationShowcase } from '@/components/editor/music-recommendation-showcase'
import { EditorialComposerFrameAssist } from '@/components/editor/editorial-composer-frame-assist'
import { FrameComposerDraftMirror } from '@/components/editor/frame-composer-draft-mirror'
import { StagedMusicRail } from '@/components/editor/staged-music-rail'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { useFrameTargeting } from '@/hooks/use-frame-targeting'
import { buildRevealVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { readLocalStorageJSON, writeLocalStorageJSON } from '@/lib/storage'
import {
  MUSIC_CATALOG,
  createDefaultMusicPreference,
  normalizeMusicPreference,
} from '@/lib/music-catalog'
import {
  buildHeuristicSoundtrackProfile,
  buildMusicAnalysisStages,
  buildMusicRecommendationSet,
} from '@/lib/music-recommendation-core'
import { analyzeMusicIntent } from '@/lib/music-intent'
import { isMusicIntent as checkMusicIntent } from '@/lib/music-intent'
import { parseFrameReference } from '@/lib/editorial-frame/parse-frame-reference'
import { queuePreviewRevisionRequest } from '@/lib/editorial-frame/mock-preview-api'
import { STYLE_TEMPLATES, type StyleTemplate } from '@/lib/styles/style-templates'

import type {
  MusicPreference,
  MusicRecommendation,
  MusicRecommendationGroup,
  MusicRecommendationPhase,
  MusicRecommendationPipelineResult,
  MusicSoundtrackProfile,
  MusicVideoContext,
  StagedMusicTrack,
} from '@/lib/types'
import type { FrameAssistSubmission, FrameSuggestion, QueuedPreviewRevisionState } from '@/lib/editorial-frame/types'

// --- Types ---

export type ChatEntry = {
  id: string
  role: 'assistant' | 'user'
  text: string
  status?: 'loading' | 'ready'
  music?: ChatMusicBlock
}

export type ChatMusicBlock = MusicRecommendationPipelineResult & {
  status: 'loading' | 'ready'
  query: string
  preference: MusicPreference
  contextSummary?: string
  profileModel?: string
}

export type ChatApiResponse = {
  reply?: string
  error?: string
}

export type ComposerAutomationRequest = {
  id: number
  prompt: string
}

export type MusicApiResponse = MusicRecommendationPipelineResult & {
  error?: string
  contextSummary?: string
  profileModel?: string
}

// --- Constants ---

const MUSIC_PREFERENCE_STORAGE_PREFIX = 'prometheus.editor.music-preferences.v1'
const STAGED_MUSIC_STORAGE_PREFIX = 'prometheus.editor.staged-music.v1'
const MUSIC_PREVIEW_VOLUME_STORAGE_PREFIX = 'prometheus.editor.music-preview-volume.v1'
const DEFAULT_MUSIC_PREVIEW_VOLUME = 0.34
const MUSIC_INTENT_KEYWORDS = [
  'add music',
  'music',
  'song',
  'songs',
  'track',
  'tracks',
  'soundtrack',
  'score',
  'cue',
  'beat',
  'beats',
  'instrumental',
  'playlist',
  'audio',
  'sound bed',
] as const

const EDIT_INTENT_KEYWORDS = [
  'edit',
  'edit this video',
  'make this video',
  'make this cut',
  'rough cut',
  'rough cuts',
  'refine',
  'tighten',
  'trim',
  'shorten',
  'extend',
  'reframe',
  'caption',
  'captions',
  'subtitle',
  'subtitle',
  'title card',
  'motion',
  'overlay',
  'overlay text',
  'timeline',
  'pacing',
  'hook',
  'intro',
  'outro',
  'remove dead air',
  'cinematic',
  'polish',
  'clean up',
] as const

const QUICK_ACTIONS = [
  { label: 'Edit this video', icon: PenSquare },
  { label: 'Generate rough cuts', icon: Wand2 },
  { label: 'Add music', icon: Music4 },
  { label: 'Generate title cards', icon: CopyPlus },
  { label: 'Cinematic captions', icon: MessageSquare },
  { label: 'Motion graphics', icon: Sparkles },
  { label: 'Polish pacing', icon: SlidersHorizontal },
]

const QUICK_ACTION_TILTS = [
  { rotate: -1.8, y: -7 },
  { rotate: 0.9, y: -2 },
  { rotate: -1.1, y: 3 },
  { rotate: 1.4, y: -5 },
  { rotate: -0.8, y: 2 },
  { rotate: 1.05, y: -1 },
  { rotate: -0.4, y: 4 },
] as const

const MUSIC_REFINEMENT_OPTIONS = [
  {
    key: 'minimal',
    label: 'More minimal',
    mood: 'minimal',
    energy: 'low',
    variantHint: 'minimal',
    hint: 'Soft, spacious, and under-dialogue.',
  },
  {
    key: 'cinematic',
    label: 'More cinematic',
    mood: 'cinematic',
    energy: 'medium',
    variantHint: 'cinematic',
    hint: 'Polished, score-like, and a little more elevated.',
  },
  {
    key: 'energetic',
    label: 'More energetic',
    mood: 'uplifting',
    energy: 'high',
    variantHint: 'energetic',
    hint: 'Forward motion for faster cuts and sharper hooks.',
  },
  {
    key: 'less-intense',
    label: 'Less intense',
    mood: 'minimal',
    energy: 'low',
    variantHint: 'less-intense',
    hint: 'Thoughtful but lighter and easier under dialogue.',
  },
  {
    key: 'emotional',
    label: 'More emotional',
    mood: 'minimal',
    energy: 'medium',
    variantHint: 'emotional',
    hint: 'Warmer, softer, and more reflective.',
  },
  {
    key: 'fresh',
    label: 'Freshen results',
    mood: 'cinematic',
    energy: 'medium',
    variantHint: 'fresh',
    hint: 'Keep the lane but rotate the archive lane.',
  },
] as const

const BOTTOM_MODES = ['Original', 'Music', 'Timeline']
const MUSIC_RECOMMENDATION_LIMIT = 8
const EDITOR_REQUEST_TIMEOUT_MS = 25_000

const CHAT_COMPOSER_FONT_STYLE = {
  fontFamily: '"SF Pro Text","SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Arial,sans-serif',
} satisfies React.CSSProperties

const CHAT_PLACEHOLDER_LINES = [
  'Sketch the next pass with a more cinematic rhythm...',
  'Carve the opener into something sharper and calmer...',
  'Let the pacing breathe, then land the hook earlier...',
  'Shape the visual beat so the tension rises cleaner...',
  'Push the framing toward something colder and bolder...',
  'Refine the cut until the emotional turn feels earned...',
  'Tune the motion so the whole pass feels more alive...',
] as const

// --- Helpers ---

function musicPreferenceStorageKey(projectId: string) {
  return `${MUSIC_PREFERENCE_STORAGE_PREFIX}.${projectId}`
}

function stagedMusicStorageKey(projectId: string) {
  return `${STAGED_MUSIC_STORAGE_PREFIX}.${projectId}`
}

function musicPreviewVolumeStorageKey(projectId: string) {
  return `${MUSIC_PREVIEW_VOLUME_STORAGE_PREFIX}.${projectId}`
}

function clampMusicPreviewVolume(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_MUSIC_PREVIEW_VOLUME
  return Math.max(0, Math.min(1, value))
}

function isMusicIntent(value: string) {
  const normalized = value.trim().toLowerCase()
  return MUSIC_INTENT_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

function isGenericMusicRequest(value: string) {
  const normalized = value.trim().toLowerCase()
  const exactMatches = [
    'add music',
    'music',
    'song',
    'songs',
    'track',
    'tracks',
    'soundtrack',
    'score',
    'cue',
    'beat',
    'beats',
    'instrumental',
    'playlist',
    'audio',
    'sound bed',
    'recommend music',
    'music recommendations',
    'song recommendations',
  ]

  return exactMatches.includes(normalized) || /^((add|recommend|suggest)\s+)?music(\s+.*)?$/.test(normalized) || /^[a-z\s]{1,20}$/.test(normalized)
}

function isEditIntent(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  if (EDIT_INTENT_KEYWORDS.some((keyword) => normalized.includes(keyword))) return true
  return /^(?:please\s+)?(?:can you\s+)?(?:make|edit|tighten|trim|reframe|caption|subtitle|refine|polish|cut)\b/.test(normalized)
}

function removeChatEntry(entries: ChatEntry[], entryId: string) {
  return entries.filter((entry) => entry.id !== entryId)
}

function msToTime(ms: number) {
  const safe = Math.max(0, ms)
  const seconds = Math.floor(safe / 1000)
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${`${seconds % 60}`.padStart(2, '0')}`
}

function buildAssistantReply({
  projectTitle,
  originalPrompt,
  sourceCount,
  input,
}: {
  projectTitle: string
  originalPrompt: string
  sourceCount: number
  input: string
}) {
  const normalized = input.trim().toLowerCase()
  const original = originalPrompt.trim() || 'shape the clip into a clearer final edit'
  const sourceNote = sourceCount > 0 ? ` I'm also holding ${sourceCount} staged source reference${sourceCount > 1 ? 's' : ''}.` : ''

  if (normalized.includes('rough cuts')) {
    return `Starting with rough cuts makes sense. I'd open with the strongest hook from "${original}", trim hesitation, and build a first pass around the cleanest beat changes.${sourceNote}`
  }

  if (normalized.includes('music')) {
    return `For music, I'd keep it supportive rather than dominant. Based on "${original}", I'd aim for a restrained bed that lifts momentum without crowding the voice.${sourceNote}`
  }

  if (normalized.includes('title')) {
    return `Title cards can work here if they stay spare. I'd use one typographic system, let the project name carry authority, and avoid over-decorating the message from "${original}".`
  }

  if (normalized.includes('caption')) {
    return `Captions should feel editorial, not noisy. I'd highlight only the strongest phrases from "${original}" and keep the pacing readable rather than hyperactive.`
  }

  if (normalized.includes('motion')) {
    return `Motion graphics should stay in service of the edit. For ${projectTitle}, I'd keep transitions minimal and reserve motion accents for moments that reinforce the original idea: "${original}".`
  }

  if (
    normalized.includes('viral')
    || normalized.includes('short-form')
    || normalized.includes('9:16')
    || normalized.includes('hook in the first 2 seconds')
  ) {
    return `For a viral clipping pass, I'd collapse the long-form source into a hook-first 9:16 sequence, trim every hesitation beat, and build around the most quotable moments from "${original}".${sourceNote} I'd also treat captions and reframes as retention tools, not decoration.`
  }

  return `Working from your original direction "${original}", I'd treat "${input.trim()}" as the next refinement pass and keep the system focused, paced, and uncluttered.${sourceNote}`
}

function buildMusicReply({
  projectTitle,
  sourceCount,
  videoContext,
}: {
  projectTitle: string
  sourceCount: number
  videoContext: MusicVideoContext
}) {
  const summary = videoContext.summary ? ` I'm reading the cut as ${videoContext.summary}.` : ''
  const paceLine =
    videoContext.pace === 'fast'
      ? 'keep the cue fast, upbeat, and forward-driving'
      : videoContext.pace === 'slow'
        ? 'keep the cue spacious and reflective'
        : 'keep the cue balanced and editorial'
  const sourceLine = sourceCount > 0 ? ` I'm also holding ${sourceCount} staged source${sourceCount > 1 ? 's' : ''} in view.` : ''

  return `For ${projectTitle}, I'd ${paceLine}.${summary}${sourceLine} I've lined up a few options below, and if you want me to narrow it, use the intensity selector so I can lock onto atmospheric, balanced, or driving.`
}

function selectEditStyleTemplate(prompt: string, videoContext: MusicVideoContext) {
  const contextText = normalizeInlineText([prompt, videoContext.summary, ...videoContext.signals].filter(Boolean).join(' '))
  const ranked = STYLE_TEMPLATES.map((template) => ({
    template,
    score: scoreEditStyleTemplate(template, contextText, videoContext),
  })).sort((left, right) => right.score - left.score)

  return ranked[0]?.template ?? STYLE_TEMPLATES[2] ?? STYLE_TEMPLATES[0]
}

function scoreEditStyleTemplate(template: StyleTemplate, contextText: string, videoContext: MusicVideoContext) {
  const tokens = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase()
  let score = 0

  const hasAny = (text: string, needles: string[]) => needles.some((needle) => text.includes(needle))

  if (template.id === 'style_podcast_dynamic') {
    if (hasAny(contextText, ['caption', 'subtitle', 'typographic', 'voice', 'talking', 'podcast', 'long form', 'longform'])) score += 8
    if (hasAny(tokens, ['typography', 'caption'])) score += 3
  }

  if (template.id === 'style_reels_heat') {
    if (hasAny(contextText, ['fast', 'viral', 'hook', 'retention', 'short', 'reel', 'punchy', 'snappy'])) score += 8
  }

  if (template.id === 'style_docs_story') {
    if (hasAny(contextText, ['cinematic', 'documentary', 'story', 'reflective', 'calm', 'breathing', 'smooth'])) score += 8
  }

  if (template.id === 'style_iman_clean') {
    if (hasAny(contextText, ['clean', 'premium', 'minimal', 'polish', 'simple', 'precise'])) score += 7
  }

  if (template.id === 'style_iman_punchy') {
    if (hasAny(contextText, ['bold', 'impact', 'aggressive', 'strong', 'sharp'])) score += 7
  }

  if (template.id === 'style_cinematic_noir') {
    if (hasAny(contextText, ['moody', 'dark', 'shadow', 'slow', 'dramatic'])) score += 7
  }

  if (template.id === 'style_minimal_subtle') {
    if (hasAny(contextText, ['subtle', 'bare', 'minimal', 'quiet'])) score += 7
  }

  if (videoContext.pace === 'fast' && hasAny(tokens, ['snappy', 'aggressive', 'punchy', 'heavy'])) score += 2
  if (videoContext.pace === 'slow' && hasAny(tokens, ['smooth', 'cinematic', 'minimal'])) score += 2

  score += Math.min(template.previewImages.length, 2)
  return score
}

function buildEditQuickActionPrompt(projectTitle: string, videoContext: MusicVideoContext, styleTemplate: StyleTemplate) {
  const summary = videoContext.summary || 'the current cut'
  const pace =
    videoContext.pace === 'fast'
      ? 'fast and punchy'
      : videoContext.pace === 'slow'
        ? 'slower and more reflective'
        : 'balanced and editorial'

  return [
    `Edit this video for ${projectTitle}.`,
    `Keep the cut ${pace}.`,
    `Treat ${summary} as the main read.`,
    `Use ${styleTemplate.name} as the overlay lane.`,
    'Render the first pass directly on top of the imported media.',
  ].join(' ')
}

function buildEditAssistantReply({
  projectTitle,
  sourceCount,
  styleTemplate,
  prompt,
  videoContext,
}: {
  projectTitle: string
  sourceCount: number
  styleTemplate: StyleTemplate
  prompt: string
  videoContext: MusicVideoContext
}) {
  const sourceLine = sourceCount > 0 ? ` I still have ${sourceCount} staged source${sourceCount > 1 ? 's' : ''} in the chamber.` : ''
  const summary = videoContext.summary ? ` The cut reads as ${videoContext.summary}.` : ''
  const promptLine = prompt.trim().length > 0 ? ` You asked for "${prompt.trim()}".` : ''

  return `The edit pass is live for ${projectTitle}.${summary} I'm using ${styleTemplate.name} so the overlay stays faithful to the style lane.${sourceLine}${promptLine} The backend stream can keep adding text while the preview renders the same treatment on the imported video.`
}

function buildMusicQuickActionPrompt(projectTitle: string, videoContext: MusicVideoContext) {
  const summary = videoContext.summary || 'the current cut'
  const pace =
    videoContext.pace === 'fast'
      ? 'fast-paced, upbeat, and driving'
      : videoContext.pace === 'slow'
        ? 'slower, spacious, and reflective'
        : 'balanced, editorial, and cinematic'
  const signals = videoContext.signals.length > 0 ? ` Signals: ${videoContext.signals.slice(0, 5).join(', ')}.` : ''

  return [
    `Recommend up to 3 music options for ${projectTitle}.`,
    `The current cut feels ${pace}.`,
    `Context: ${summary}.${signals}`,
    'Show tracks that fit the edit itself, not generic music suggestions.',
    'If the choice is broad, invite refinement with intensity options.',
  ].join(' ')
}

function buildMusicSourceLabel(sourceUrl: string) {
  try {
    const host = new URL(sourceUrl).hostname.replace(/^www\./i, '').toLowerCase()
    if (host.includes('spotify')) return 'Open Spotify'
    if (host.includes('apple') || host.includes('itunes')) return 'Open Apple Music'
    return 'Open source'
  } catch {
    return 'Open source'
  }
}

function normalizeInlineText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function sanitizeAssistantReply(value: string) {
  return value
    .replace(/^\s*[*-]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\s+\n/g, '\n')
    .trim()
}

type GroqStreamChoice = {
  delta?: {
    content?: string | Array<{ type?: string; text?: string }>
  }
  message?: {
    content?: string | Array<{ type?: string; text?: string }>
  }
}

type GroqStreamPayload = {
  choices?: GroqStreamChoice[]
}

function extractGroqStreamText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return ''

  const choices = (payload as GroqStreamPayload).choices
  const firstChoice = choices?.[0]
  if (!firstChoice) return ''

  const content = firstChoice.delta?.content ?? firstChoice.message?.content
  if (typeof content === 'string') return content

  if (Array.isArray(content)) {
    return content.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('')
  }

  return ''
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

async function readGroqStreamText(
  response: Response,
  signal: AbortSignal,
  onText: (text: string) => void,
) {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Groq returned an empty stream.')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let accumulated = ''
  let finished = false

  const consumeDataLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return

    const data = trimmed.slice(5).trim()
    if (!data) return
    if (data === '[DONE]') {
      finished = true
      return
    }

    const parsed = safeJsonParse(data)
    const delta = sanitizeAssistantReply(extractGroqStreamText(parsed))
    if (!delta) return

    accumulated += delta
    onText(sanitizeAssistantReply(accumulated))
  }

  try {
    while (!finished) {
      if (signal.aborted) break

      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        consumeDataLine(line)
        if (finished || signal.aborted) break
      }
    }

    if (!finished && buffer.trim()) {
      consumeDataLine(buffer)
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // ignore
    }
  }

  return sanitizeAssistantReply(accumulated)
}

// --- Internal Components ---

function EyeOrb({
  target,
  reduceMotion,
}: {
  target: { x: number; y: number } | null
  reduceMotion: boolean
}) {
  const eyeRef = React.useRef<HTMLDivElement | null>(null)
  const [pupilOffset, setPupilOffset] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    const eye = eyeRef.current
    if (!eye || !target) {
      setPupilOffset({ x: 0, y: 0 })
      return
    }

    const rect = eye.getBoundingClientRect()
    const eyeCenterX = rect.left + rect.width / 2
    const eyeCenterY = rect.top + rect.height / 2
    const dx = target.x - eyeCenterX
    const dy = target.y - eyeCenterY
    const angle = Math.atan2(dy, dx)
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = rect.width / 2 - 8
    const moveDistance = Math.min(maxDistance, distance / 8)

    setPupilOffset({
      x: Math.cos(angle) * moveDistance,
      y: Math.sin(angle) * moveDistance,
    })
  }, [target])

  return (
    <div
      ref={eyeRef}
      className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.98)_0%,rgba(244,247,255,0.96)_48%,rgba(196,206,224,0.9)_100%)] shadow-[0_8px_20px_-14px_rgba(255,255,255,0.52),inset_0_1px_0_rgba(255,255,255,0.82)]"
    >
      <motion.div
        className="absolute h-2.5 w-2.5 rounded-full bg-[#0b0e14] shadow-[0_0_10px_rgba(0,0,0,0.28)]"
        animate={{ x: pupilOffset.x, y: pupilOffset.y }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                type: 'spring',
                stiffness: 380,
                damping: 26,
                mass: 0.32,
              }
        }
      />
    </div>
  )
}

function TypingEyes({
  target,
  reduceMotion,
}: {
  target: { x: number; y: number } | null
  reduceMotion: boolean
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <EyeOrb target={target} reduceMotion={reduceMotion} />
      <EyeOrb target={target} reduceMotion={reduceMotion} />
    </div>
  )
}

function FloatingChatComposer({
  projectId,
  draft,
  onDraftChange,
  onSubmit,
  onStop,
  loading,
  reduceMotion,
  isOpen,
  onOpenChange,
  queuedPreviewRevision,
  onClearQueuedPreview,
}: {
  projectId: string
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: (submission: FrameAssistSubmission) => void | Promise<void>
  onStop: () => void
  loading: boolean
  reduceMotion: boolean
  isOpen: boolean
  onOpenChange: (nextOpen: boolean) => void
  queuedPreviewRevision?: QueuedPreviewRevisionState | null
  onClearQueuedPreview?: () => void
}) {
  const composerId = React.useId()
  const hasDraft = draft.trim().length > 0
  const composerInputRef = React.useRef<HTMLInputElement | null>(null)
  const composerMeasureRef = React.useRef<HTMLSpanElement | null>(null)
  const composerPlaceholderMeasureRef = React.useRef<HTMLSpanElement | null>(null)
  const mouseMoveFrameRef = React.useRef<number | null>(null)
  const pointerResetTimeoutRef = React.useRef<number | null>(null)
  const draftRef = React.useRef(draft)
  const placeholderTextRef = React.useRef('')
  const eyeSourceRef = React.useRef<'placeholder' | 'caret' | 'pointer'>(hasDraft ? 'caret' : 'placeholder')
  const [isHandleHovered, setIsHandleHovered] = React.useState(false)
  const [eyeTarget, setEyeTarget] = React.useState<{ x: number; y: number } | null>(null)
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0)
  const [placeholderText, setPlaceholderText] = React.useState('')
  const [placeholderPhase, setPlaceholderPhase] = React.useState<'typing' | 'holding' | 'deleting'>('typing')
  const [caretIndex, setCaretIndex] = React.useState(0)
  const [pendingSelectionRange, setPendingSelectionRange] = React.useState<{ start: number; end: number } | null>(null)
  const [suppressedAssistKey, setSuppressedAssistKey] = React.useState<string | null>(null)
  const [draftScrollLeft, setDraftScrollLeft] = React.useState(0)
  const frameAssist = useFrameTargeting({ projectId, draft, caretIndex })
  const draftMirrorAnalysis = React.useMemo(() => parseFrameReference(draft, draft.length), [draft])
  const frameAssistKey = React.useMemo(() => {
    if (!frameAssist.analysis.referenceText) return null
    return `${caretIndex}:${frameAssist.analysis.referenceStartIndex ?? 'na'}:${frameAssist.analysis.referenceEndIndex ?? 'na'}:${frameAssist.analysis.referenceText}`
  }, [
    caretIndex,
    frameAssist.analysis.referenceEndIndex,
    frameAssist.analysis.referenceStartIndex,
    frameAssist.analysis.referenceText,
  ])
  const isFrameAssistSuppressed = suppressedAssistKey !== null && suppressedAssistKey === frameAssistKey
  const isFrameAssistExpanded = Boolean(frameAssist.previewRegion || queuedPreviewRevision)
  const queuedPreviewRawText = queuedPreviewRevision?.request.rawText ?? null

  const updateCaretTarget = React.useCallback((activate = true) => {
    const input = composerInputRef.current
    const measure = composerMeasureRef.current
    if (!input || !measure) return

    const selectionIndex = input.selectionStart ?? input.value.length
    setCaretIndex(selectionIndex)
    setDraftScrollLeft(input.scrollLeft)
    const beforeCaret = input.value.slice(0, selectionIndex).replaceAll(' ', '\u00a0') || '\u200b'
    measure.textContent = beforeCaret

    const rect = input.getBoundingClientRect()
    const computed = window.getComputedStyle(input)
    const paddingLeft = Number.parseFloat(computed.paddingLeft) || 0
    const measureWidth = measure.getBoundingClientRect().width
    const minX = rect.left + paddingLeft
    const maxX = rect.right - 18

    if (activate) {
      eyeSourceRef.current = 'caret'
    }
    setEyeTarget({
      x: Math.min(maxX, Math.max(minX, rect.left + paddingLeft + measureWidth - input.scrollLeft)),
      y: rect.top + rect.height / 2,
    })
  }, [])

  const updatePlaceholderTarget = React.useCallback((text: string) => {
    const input = composerInputRef.current
    const measure = composerPlaceholderMeasureRef.current
    if (!input || !measure) return

    measure.textContent = text.replaceAll(' ', '\u00a0') || '\u200b'

    const rect = input.getBoundingClientRect()
    const computed = window.getComputedStyle(input)
    const paddingLeft = Number.parseFloat(computed.paddingLeft) || 0
    const measureWidth = measure.getBoundingClientRect().width
    const minX = rect.left + paddingLeft
    const maxX = rect.right - 18

    setEyeTarget({
      x: Math.min(maxX, Math.max(minX, rect.left + paddingLeft + measureWidth)),
      y: rect.top + rect.height / 2,
    })
  }, [])

  React.useEffect(() => {
    draftRef.current = draft
  }, [draft])

  React.useEffect(() => {
    placeholderTextRef.current = placeholderText
  }, [placeholderText])

  React.useEffect(() => {
    if (!isOpen) return

    const rafId = window.requestAnimationFrame(() => {
      composerInputRef.current?.focus()
      if (draftRef.current.trim().length > 0) {
        updateCaretTarget(false)
      } else {
        updatePlaceholderTarget(placeholderTextRef.current)
      }
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [isOpen, updateCaretTarget, updatePlaceholderTarget])

  React.useEffect(() => {
    if (!isOpen || !hasDraft) return

    const rafId = window.requestAnimationFrame(() => {
      updateCaretTarget()
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [draft, hasDraft, isOpen, updateCaretTarget])

  React.useEffect(() => {
    if (hasDraft) {
      eyeSourceRef.current = 'caret'
      return
    }

    eyeSourceRef.current = 'placeholder'
  }, [hasDraft])

  React.useEffect(() => {
    if (!isOpen || hasDraft) return

    const currentLine = CHAT_PLACEHOLDER_LINES[placeholderIndex]
    let timeoutId: number | null = null

    if (placeholderPhase === 'typing') {
      if (placeholderText.length < currentLine.length) {
        timeoutId = window.setTimeout(() => {
          setPlaceholderText(currentLine.slice(0, placeholderText.length + 1))
        }, 55)
      } else {
        timeoutId = window.setTimeout(() => {
          setPlaceholderPhase('holding')
        }, 1200)
      }
    } else if (placeholderPhase === 'holding') {
      timeoutId = window.setTimeout(() => {
        setPlaceholderPhase('deleting')
      }, 450)
    } else if (placeholderText.length > 0) {
      timeoutId = window.setTimeout(() => {
        setPlaceholderText(currentLine.slice(0, placeholderText.length - 1))
      }, 28)
    } else {
      timeoutId = window.setTimeout(() => {
        setPlaceholderIndex((current) => (current + 1) % CHAT_PLACEHOLDER_LINES.length)
        setPlaceholderPhase('typing')
      }, 220)
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [hasDraft, isOpen, placeholderIndex, placeholderPhase, placeholderText])

  React.useEffect(() => {
    if (!hasDraft) {
      setDraftScrollLeft(0)
    }
  }, [hasDraft])

  React.useEffect(() => {
    if (!isOpen || hasDraft) return
    if (eyeSourceRef.current === 'pointer') return

    const rafId = window.requestAnimationFrame(() => {
      updatePlaceholderTarget(placeholderText)
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [hasDraft, isOpen, placeholderText, updatePlaceholderTarget])

  React.useEffect(() => {
    if (!isOpen) return

    const handleMouseMove = (event: MouseEvent) => {
      if (mouseMoveFrameRef.current !== null) {
        window.cancelAnimationFrame(mouseMoveFrameRef.current)
      }

      mouseMoveFrameRef.current = window.requestAnimationFrame(() => {
        eyeSourceRef.current = 'pointer'
        setEyeTarget({
          x: event.clientX,
          y: event.clientY,
        })
        mouseMoveFrameRef.current = null
      })

      if (pointerResetTimeoutRef.current !== null) {
        window.clearTimeout(pointerResetTimeoutRef.current)
      }

      pointerResetTimeoutRef.current = window.setTimeout(() => {
        pointerResetTimeoutRef.current = null
        if (draftRef.current.trim().length > 0) {
          updateCaretTarget(false)
          eyeSourceRef.current = 'caret'
        } else {
          updatePlaceholderTarget(placeholderTextRef.current)
          eyeSourceRef.current = 'placeholder'
        }
      }, 900)
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (mouseMoveFrameRef.current !== null) {
        window.cancelAnimationFrame(mouseMoveFrameRef.current)
        mouseMoveFrameRef.current = null
      }
      if (pointerResetTimeoutRef.current !== null) {
        window.clearTimeout(pointerResetTimeoutRef.current)
        pointerResetTimeoutRef.current = null
      }
    }
  }, [isOpen, updateCaretTarget, updatePlaceholderTarget])

  React.useEffect(() => {
    if (suppressedAssistKey && suppressedAssistKey !== frameAssistKey) {
      setSuppressedAssistKey(null)
    }
  }, [frameAssistKey, suppressedAssistKey])

  React.useEffect(() => {
    const nextSelection = pendingSelectionRange
    if (!nextSelection) return

    const input = composerInputRef.current
    if (!input) return

    const rafId = window.requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(nextSelection.start, nextSelection.end)
      setPendingSelectionRange(null)
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [pendingSelectionRange])

  const handleFrameAssistRetarget = React.useCallback(() => {
    setSuppressedAssistKey(null)
    const input = composerInputRef.current
    if (input && frameAssist.analysis.referenceStartIndex !== null && frameAssist.analysis.referenceEndIndex !== null) {
      input.focus()
      input.setSelectionRange(frameAssist.analysis.referenceStartIndex, frameAssist.analysis.referenceEndIndex)
      setCaretIndex(frameAssist.analysis.referenceStartIndex)
      return
    }

    if (queuedPreviewRawText) {
      const restoredDraft = queuedPreviewRawText
      const restoredAnalysis = parseFrameReference(restoredDraft, restoredDraft.length)
      onDraftChange(restoredDraft)
      const nextCaretIndex = restoredAnalysis.referenceEndIndex ?? restoredDraft.length
      setCaretIndex(nextCaretIndex)
      setPendingSelectionRange({
        start: restoredAnalysis.referenceStartIndex ?? nextCaretIndex,
        end: nextCaretIndex,
      })
      return
    }

    composerInputRef.current?.focus()
    updateCaretTarget()
  }, [
    frameAssist.analysis.referenceEndIndex,
    frameAssist.analysis.referenceStartIndex,
    onDraftChange,
    queuedPreviewRawText,
    updateCaretTarget,
  ])

  const handleFrameAssistClear = React.useCallback(() => {
    const nextDraft = frameAssist.clearFrameTarget()
    onDraftChange(nextDraft)
    setCaretIndex(nextDraft.length)
    setPendingSelectionRange({ start: nextDraft.length, end: nextDraft.length })
    setSuppressedAssistKey(null)
    onClearQueuedPreview?.()
  }, [frameAssist, onClearQueuedPreview, onDraftChange])

  const handleFrameAssistSelect = React.useCallback(
    (suggestion: FrameSuggestion) => {
      const next = frameAssist.confirmSuggestion(suggestion)
      const nextAnalysis = parseFrameReference(next.nextDraft, next.nextCaretIndex)
      onDraftChange(next.nextDraft)
      setCaretIndex(next.nextCaretIndex)
      setPendingSelectionRange({ start: next.nextCaretIndex, end: next.nextCaretIndex })
      setSuppressedAssistKey(
        nextAnalysis.referenceText
          ? `${next.nextCaretIndex}:${nextAnalysis.referenceStartIndex ?? 'na'}:${nextAnalysis.referenceEndIndex ?? 'na'}:${nextAnalysis.referenceText}`
          : null,
      )
    },
    [frameAssist, onDraftChange],
  )

  const activeFrameSuggestion =
    frameAssist.suggestions.length > 0
      ? frameAssist.suggestions[
          frameAssist.clampSuggestionIndex(frameAssist.activeSuggestionIndex >= 0 ? frameAssist.activeSuggestionIndex : 0)
        ] ?? frameAssist.suggestions[0]
      : null

  const handleComposerSubmit = React.useCallback(async () => {
    const nextValue = draft.trim()
    if (!nextValue) return

    const revisionRequest = frameAssist.buildRevisionRequest()
    if (revisionRequest.frameTarget) {
      frameAssist.recordRecentTarget(revisionRequest)
    }

    await onSubmit({
      rawText: nextValue,
      analysis: frameAssist.analysis,
      revisionRequest,
    })
  }, [draft, frameAssist, onSubmit])

  const handleComposerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const hasVisibleSuggestions = frameAssist.isPopoverOpen && !isFrameAssistSuppressed && frameAssist.suggestions.length > 0

      if (event.key === 'Escape' && hasVisibleSuggestions) {
        event.preventDefault()
        if (frameAssistKey) {
          setSuppressedAssistKey(frameAssistKey)
        }
        return
      }

      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && hasVisibleSuggestions) {
        event.preventDefault()
        const delta = event.key === 'ArrowDown' ? 1 : -1
        frameAssist.setActiveSuggestionIndex((current) =>
          frameAssist.clampSuggestionIndex((current < 0 ? 0 : current) + delta),
        )
        return
      }

      if (event.key === 'Enter') {
        if (hasVisibleSuggestions && activeFrameSuggestion) {
          event.preventDefault()
          handleFrameAssistSelect(activeFrameSuggestion)
          return
        }

        if (!hasDraft) return
        event.preventDefault()
        void handleComposerSubmit()
      }
    },
    [
      activeFrameSuggestion,
      frameAssist,
      frameAssistKey,
      handleComposerSubmit,
      handleFrameAssistSelect,
      hasDraft,
      isFrameAssistSuppressed,
    ],
  )

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center overflow-visible">
      <motion.div
        className={cn(
          'pointer-events-auto relative origin-bottom overflow-visible bg-[linear-gradient(135deg,rgba(146,163,255,0.34)_0%,rgba(127,242,212,0.26)_38%,rgba(255,255,255,0.16)_68%,rgba(140,113,255,0.3)_100%)] p-[1px] transition-[height,width,border-radius,box-shadow] duration-300',
          isOpen
            ? isFrameAssistExpanded
              ? 'h-[188px] w-[min(38rem,calc(100vw-3rem))] rounded-[30px]'
              : 'h-[128px] w-[min(38rem,calc(100vw-3rem))] rounded-[30px]'
            : isHandleHovered
              ? 'h-[74px] w-[min(20rem,calc(100vw-4rem))] rounded-[28px]'
              : 'h-14 w-14 rounded-full',
        )}
        style={CHAT_COMPOSER_FONT_STYLE}
        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.96 }}
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: 1,
                y: isOpen ? 0 : isHandleHovered ? -8 : 0,
                boxShadow: isOpen
                  ? '0 30px 56px -28px rgba(0,0,0,0.92), 0 0 0 1px rgba(255,255,255,0.04)'
                  : isHandleHovered
                    ? '0 24px 42px -28px rgba(0,0,0,0.86), 0 0 42px -24px rgba(127,242,212,0.48)'
                    : '0 14px 28px -24px rgba(0,0,0,0.86)',
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                type: 'spring',
                stiffness: 260,
                damping: 28,
                mass: 0.86,
              }
        }
        onMouseEnter={() => {
          if (!isOpen) setIsHandleHovered(true)
        }}
        onMouseLeave={() => {
          if (!isOpen) setIsHandleHovered(false)
        }}
      >
        {!isOpen ? (
          <button
            type="button"
            aria-label="Open chat composer"
            onClick={() => onOpenChange(true)}
            className="absolute inset-0 z-20 cursor-pointer"
          />
        ) : null}

        <div className="relative h-full w-full overflow-visible rounded-[inherit] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_34%),radial-gradient(circle_at_24%_120%,rgba(127,242,212,0.18)_0%,rgba(127,242,212,0)_42%),linear-gradient(180deg,rgba(18,18,24,0.98)_0%,rgba(8,8,12,0.98)_100%)] backdrop-blur-[30px]">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 bottom-2 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(127,242,212,0.72)_48%,rgba(255,255,255,0)_100%)]"
            animate={
              reduceMotion
                ? undefined
                : {
                    opacity: isOpen || isHandleHovered ? [0.26, 0.78, 0.34] : 0.22,
                    x: isOpen || isHandleHovered ? ['-10%', '10%', '-4%'] : '0%',
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: 3.4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }
            }
          />
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/10" />

          <AnimatePresence initial={false} mode="wait">
            {isOpen ? (
              <motion.div
                key="open-composer"
                className="relative flex h-full flex-col px-4 py-3"
                initial={reduceMotion ? false : { opacity: 0, y: 12, filter: 'blur(10px)' }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 8, filter: 'blur(6px)' }}
                transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  ref={composerMeasureRef}
                  aria-hidden
                  className="pointer-events-none absolute left-4 top-11 invisible whitespace-pre text-[20px] italic tracking-[0.01em]"
                  style={{
                    fontFamily: 'var(--font-newsreader), "Iowan Old Style", "Palatino Linotype", serif',
                  }}
                />
                <span
                  ref={composerPlaceholderMeasureRef}
                  aria-hidden
                  className="pointer-events-none absolute left-4 top-11 invisible whitespace-pre text-[20px] italic tracking-[0.01em]"
                  style={{
                    fontFamily: 'var(--font-newsreader), "Iowan Old Style", "Palatino Linotype", serif',
                  }}
                />

                <div className="relative flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/38">
                    <motion.span
                      aria-hidden
                      className="size-1.5 rounded-full bg-[#7ff2d4]"
                      animate={reduceMotion ? undefined : { opacity: [0.44, 1, 0.44], scale: [0.92, 1.12, 0.92] }}
                      transition={{ duration: 2.1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                    />
                    Editor Relay
                  </div>

                  <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
                    <TypingEyes target={eyeTarget} reduceMotion={reduceMotion} />
                  </div>

                  <motion.button
                    type="button"
                    aria-label={hasDraft ? 'Collapse chat composer' : 'Close chat composer'}
                    onClick={() => onOpenChange(false)}
                    className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/54 transition-colors hover:text-white/82"
                    whileHover={reduceMotion ? undefined : { y: -1, scale: 1.05 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                  >
                    <X className="size-3" />
                  </motion.button>
                </div>

                <EditorialComposerFrameAssist
                  suggestions={frameAssist.suggestions}
                  activeSuggestionIndex={frameAssist.activeSuggestionIndex}
                  isPopoverOpen={frameAssist.isPopoverOpen && !isFrameAssistSuppressed}
                  previewRegion={frameAssist.previewRegion}
                  queuedPreviewRevision={queuedPreviewRevision}
                  validationNote={frameAssist.analysis.validationNote}
                  onMoveActiveSuggestion={(delta) => {
                    frameAssist.setActiveSuggestionIndex((current) =>
                      frameAssist.clampSuggestionIndex((current < 0 ? 0 : current) + delta),
                    )
                  }}
                  onSelectSuggestion={handleFrameAssistSelect}
                  onDismissSuggestions={() => {
                    if (frameAssistKey) {
                      setSuppressedAssistKey(frameAssistKey)
                    }
                  }}
                  onClearFrameTarget={handleFrameAssistClear}
                  onRetargetFrameTarget={handleFrameAssistRetarget}
                  className="relative z-30 mt-2"
                />

                <div className="relative mt-2 flex-1 overflow-visible">
                  {!hasDraft ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
                      <div
                        className="flex items-center whitespace-nowrap text-[20px] italic leading-[1.35] tracking-[0.01em] text-white/40"
                        style={{
                          fontFamily: 'var(--font-newsreader), "Iowan Old Style", "Palatino Linotype", serif',
                        }}
                      >
                        <span>{placeholderText}</span>
                        <motion.span
                          aria-hidden
                          className="ml-1 inline-block h-6 w-px bg-white/42"
                          animate={reduceMotion ? undefined : { opacity: [0.15, 0.9, 0.15] }}
                          transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                  ) : null}
                  {hasDraft ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
                      <FrameComposerDraftMirror
                        draft={draft}
                        analysis={draftMirrorAnalysis}
                        scrollLeft={draftScrollLeft}
                      />
                    </div>
                  ) : null}
                  <input
                    type="text"
                    id={composerId}
                    ref={composerInputRef}
                    value={draft}
                    onChange={(event) => {
                      onDraftChange(event.target.value)
                      setCaretIndex(event.target.selectionStart ?? event.target.value.length)
                      setDraftScrollLeft(event.currentTarget.scrollLeft)
                    }}
                    onClick={() => updateCaretTarget()}
                    onFocus={() => {
                      if (draftRef.current.trim().length > 0) {
                        updateCaretTarget()
                      }
                    }}
                    onScroll={(event) => {
                      setDraftScrollLeft(event.currentTarget.scrollLeft)
                    }}
                    onKeyUp={() => updateCaretTarget()}
                    onSelect={() => updateCaretTarget()}
                    onKeyDown={handleComposerKeyDown}
                    placeholder=""
                    className={cn(
                      'relative z-10 h-full w-full overflow-hidden bg-transparent px-0 py-0 text-[20px] italic leading-[1.35] tracking-[0.01em] text-transparent outline-none',
                    )}
                    style={{
                      fontFamily: 'var(--font-newsreader), "Iowan Old Style", "Palatino Linotype", serif',
                      caretColor: 'rgba(255,255,255,0.78)',
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-white/36">
                    <motion.button
                      type="button"
                      className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-white/[0.04] transition-colors hover:text-white/76"
                      whileHover={reduceMotion ? undefined : { y: -1, scale: 1.05 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                    >
                      <ImageIcon className="size-2.5" />
                    </motion.button>
                    <motion.button
                      type="button"
                      className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-white/[0.04] transition-colors hover:text-white/76"
                      whileHover={reduceMotion ? undefined : { y: -1, scale: 1.05 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                    >
                      <Film className="size-2.5" />
                    </motion.button>
                  </div>

                  <motion.button
                    type="button"
                    onClick={loading ? onStop : () => void handleComposerSubmit()}
                    disabled={!loading && !hasDraft}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-[#bebec7] p-0 text-[#101014] shadow-[0_18px_32px_-24px_rgba(255,255,255,0.92)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-45"
                    whileHover={reduceMotion ? undefined : { y: -1, scale: 1.04 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  >
                    {loading ? <div className="h-3 w-3 rounded-[2px] bg-current" /> : <ArrowUp className="size-4" />}
                  </motion.button>
                </div>
              </motion.div>
            ) : isHandleHovered ? (
              <motion.div
                key="closed-composer-expanded"
                className="relative flex h-full w-full items-start justify-center px-4 pt-3"
                initial={reduceMotion ? false : { opacity: 0.92 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0.92 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              >
                <div className="relative flex w-full items-center gap-3">
                  <div className="mt-0.5 h-1 w-6 shrink-0 rounded-full bg-white/58" />
                  <motion.div
                    className="flex min-w-0 items-center gap-2"
                    animate={reduceMotion ? undefined : { opacity: isHandleHovered ? 1 : 0.92, x: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
                  >
                    <MessageSquare className="size-4 shrink-0 text-white/72" />
                    <span className="truncate text-sm text-white/72">Open chat</span>
                  </motion.div>
                </div>

                <AnimatePresence>
                  {isHandleHovered ? (
                    <>
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-[inherit] border border-[#7ff2d4]/28"
                        initial={{ opacity: 0.42, scale: 0.92 }}
                        animate={{ opacity: 0, scale: 1.16 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.1, ease: 'easeOut', repeat: Number.POSITIVE_INFINITY }}
                      />
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute -inset-x-5 -inset-y-4 rounded-[999px] bg-[radial-gradient(circle_at_center,rgba(127,242,212,0.22)_0%,rgba(127,242,212,0)_58%)] blur-2xl"
                        initial={{ opacity: 0.34 }}
                        animate={{ opacity: [0.24, 0.54, 0.26] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.9, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
                      />
                    </>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="closed-composer-icon"
                className="relative grid h-full w-full place-items-center"
                initial={reduceMotion ? false : { opacity: 0.92, scale: 0.96 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0.92, scale: 0.96 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              >
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.08)_24%,rgba(255,255,255,0)_70%)] blur-md"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          opacity: [0.58, 0.9, 0.62],
                          scale: [0.98, 1.03, 0.98],
                        }
                  }
                  transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                />
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-[2px] rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(15,15,20,0.98)_0%,rgba(8,8,12,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                />
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-[6px] rounded-full border border-[#7ff2d4]/18"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          opacity: [0.52, 0.88, 0.58],
                        }
                  }
                  transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                />
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-[10px] rounded-full bg-[radial-gradient(circle_at_32%_24%,rgba(127,242,212,0.18)_0%,rgba(127,242,212,0)_68%)]"
                />
                <MessageSquare className="relative size-4 text-white/78 drop-shadow-[0_0_16px_rgba(255,255,255,0.16)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

// --- Main Component ---

export const ChatWorkspacePanel = React.memo(function ChatWorkspacePanel({
  projectId,
  projectTitle,
  initialPrompt,
  initialSources,
  videoContext,
  composerPortalTarget,
  automationRequest,
  musicSpotlightPortalTarget,
  onEditRequest,
}: {
  projectId: string
  projectTitle: string
  initialPrompt: string
  initialSources: string[]
  videoContext: MusicVideoContext
  composerPortalTarget: HTMLDivElement | null
  automationRequest?: ComposerAutomationRequest | null
  musicSpotlightPortalTarget?: HTMLDivElement | null
  onEditRequest?: (request: { prompt: string; styleTemplate: StyleTemplate }) => void | Promise<void>
}) {
  const reduceMotion = useStableReducedMotion()
  const [entries, setEntries] = React.useState<ChatEntry[]>(() => [])
  const [draft, setDraft] = React.useState('')
  const [pendingReplies, setPendingReplies] = React.useState(0)
  const [isComposerOpen, setIsComposerOpen] = React.useState(false)
  const [queuedPreviewRevision, setQueuedPreviewRevision] = React.useState<QueuedPreviewRevisionState | null>(null)
  const [musicPreference, setMusicPreference] = React.useState<MusicPreference>(() =>
    createDefaultMusicPreference(),
  )
  const [stagedTracks, setStagedTracks] = React.useState<StagedMusicTrack[]>([])
  const [musicStorageReady, setMusicStorageReady] = React.useState(false)
  const [musicPreviewVolume, setMusicPreviewVolume] = React.useState(DEFAULT_MUSIC_PREVIEW_VOLUME)
  const musicPreviewVolumeRef = React.useRef(DEFAULT_MUSIC_PREVIEW_VOLUME)
  const [activePreviewTrack, setActivePreviewTrack] = React.useState<MusicRecommendation | null>(null)
  const [previewPlaying, setPreviewPlaying] = React.useState(false)
  const [dismissedSpotlightTrackId, setDismissedSpotlightTrackId] = React.useState<string | null>(null)
  const entriesRef = React.useRef(entries)
  const requestControllersRef = React.useRef<AbortController[]>([])
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)
  const musicPreviewToggleCooldownRef = React.useRef<number | null>(null)
  const threadViewportRef = React.useRef<HTMLDivElement | null>(null)
  const threadContentRef = React.useRef<HTMLDivElement | null>(null)
  const threadEndRef = React.useRef<HTMLDivElement | null>(null)
  const chatEntryRefs = React.useRef(new Map<string, HTMLDivElement>())
  const musicCardRefs = React.useRef(new Map<string, HTMLDivElement>())
  const pendingReplyScrollEntryIdRef = React.useRef<string | null>(null)
  const followLatestRef = React.useRef(false)
  const replyHighlightTimerRef = React.useRef<number | null>(null)
  const announcedMusicToastKeysRef = React.useRef(new Set<string>())
  const handledAutomationRequestIdRef = React.useRef<number | null>(null)
  const [highlightedEntryId, setHighlightedEntryId] = React.useState<string | null>(null)
  const queuedPreviewRequestTokenRef = React.useRef<string | null>(null)
  const stagedTrackIdSet = React.useMemo(
    () => new Set(stagedTracks.map((track) => track.recommendation.id)),
    [stagedTracks],
  )

  React.useEffect(() => {
    const viewport = threadViewportRef.current
    if (!viewport) return

    const updateFollowLatest = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
      followLatestRef.current = distanceFromBottom < 120
    }

    updateFollowLatest()
    viewport.addEventListener('scroll', updateFollowLatest, { passive: true })

    return () => viewport.removeEventListener('scroll', updateFollowLatest)
  }, [])

  React.useEffect(() => {
    const viewport = threadViewportRef.current
    const content = threadContentRef.current
    if (!viewport || !content) return

    const scrollToBottom = (behavior: ScrollBehavior) => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      })
    }

    if (followLatestRef.current) {
      scrollToBottom(reduceMotion ? 'auto' : 'smooth')
    }

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      if (!followLatestRef.current) return
      scrollToBottom('auto')
    })

    observer.observe(content)

    return () => observer.disconnect()
  }, [pendingReplies, reduceMotion, entries])

  React.useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  React.useEffect(() => {
    const readyEntries = entries.filter((entry) => entry.music?.status === 'ready' && entry.music.recommendations.length > 0)

    readyEntries.forEach((entry) => {
      const topRecommendation = entry.music?.recommendations[0]
      if (!topRecommendation) return

      const toastKey = `${entry.id}:${topRecommendation.id}`
      if (announcedMusicToastKeysRef.current.has(toastKey)) return
      announcedMusicToastKeysRef.current.add(toastKey)

      const sourceUrl = topRecommendation.sourceUrl ?? null
      const sourceLabel = sourceUrl ? buildMusicSourceLabel(sourceUrl) : 'Open source'

      toast.custom(
        (toastId) => (
          <MusicPlayNotification
            recommendation={topRecommendation}
            sourceLabel={sourceLabel}
            onPlayPreview={() => {
              if (typeof window !== 'undefined') {
                window.open(topRecommendation.previewUrl, '_blank', 'noopener,noreferrer')
              }
              toast.dismiss(toastId)
            }}
            onOpenSource={
              sourceUrl
                ? () => {
                    if (typeof window !== 'undefined') {
                      window.open(sourceUrl, '_blank', 'noopener,noreferrer')
                    }
                    toast.dismiss(toastId)
                  }
                : undefined
            }
          />
        ),
        {
          duration: 12000,
        },
      )
    })
  }, [entries])

  React.useEffect(() => {
    return () => {
      requestControllersRef.current.forEach((controller) => controller.abort())
      requestControllersRef.current = []
    }
  }, [])

  React.useEffect(() => {
    if (!projectId) return

    const savedPreference = readLocalStorageJSON<MusicPreference>(musicPreferenceStorageKey(projectId))
    const savedQueue = readLocalStorageJSON<StagedMusicTrack[]>(stagedMusicStorageKey(projectId))
    const savedPreviewVolume = readLocalStorageJSON<number>(musicPreviewVolumeStorageKey(projectId))
    const nextPreference = normalizeMusicPreference(savedPreference, initialPrompt)

    setMusicPreference(nextPreference)
    setStagedTracks(Array.isArray(savedQueue) ? savedQueue : [])
    const nextPreviewVolume = clampMusicPreviewVolume(
      typeof savedPreviewVolume === 'number' ? savedPreviewVolume : DEFAULT_MUSIC_PREVIEW_VOLUME,
    )
    musicPreviewVolumeRef.current = nextPreviewVolume
    setMusicPreviewVolume(nextPreviewVolume)
    setMusicStorageReady(true)
  }, [initialPrompt, projectId])

  React.useEffect(() => {
    if (!musicStorageReady) return
    writeLocalStorageJSON(musicPreferenceStorageKey(projectId), musicPreference)
  }, [musicPreference, musicStorageReady, projectId])

  React.useEffect(() => {
    if (!musicStorageReady) return
    writeLocalStorageJSON(stagedMusicStorageKey(projectId), stagedTracks)
  }, [musicStorageReady, projectId, stagedTracks])

  React.useEffect(() => {
    if (!musicStorageReady) return
    writeLocalStorageJSON(musicPreviewVolumeStorageKey(projectId), musicPreviewVolume)
  }, [musicPreviewVolume, musicStorageReady, projectId])

  React.useEffect(() => {
    if (!queuedPreviewRevision) return

    const timeoutId = window.setTimeout(() => {
      queuedPreviewRequestTokenRef.current = null
      setQueuedPreviewRevision(null)
    }, 8500)

    return () => window.clearTimeout(timeoutId)
  }, [queuedPreviewRevision])

  React.useEffect(() => {
    return () => {
      previewAudioRef.current?.pause()
      previewAudioRef.current = null
    }
  }, [])

  React.useEffect(() => {
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio()
    }

    const audio = previewAudioRef.current
    if (!activePreviewTrack) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      return
    }

    audio.loop = true
    audio.preload = 'auto'
    audio.volume = musicPreviewVolumeRef.current
    audio.src = activePreviewTrack.previewUrl
    audio.load()

    if (previewPlaying) {
      void audio.play().catch(() => {
        setPreviewPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [activePreviewTrack, previewPlaying])

  React.useEffect(() => {
    return () => {
      if (musicPreviewToggleCooldownRef.current !== null) {
        window.clearTimeout(musicPreviewToggleCooldownRef.current)
        musicPreviewToggleCooldownRef.current = null
      }
    }
  }, [])

  const armMusicPreviewToggleCooldown = React.useCallback(() => {
    if (musicPreviewToggleCooldownRef.current !== null) {
      window.clearTimeout(musicPreviewToggleCooldownRef.current)
    }

    musicPreviewToggleCooldownRef.current = window.setTimeout(() => {
      musicPreviewToggleCooldownRef.current = null
    }, 220)
  }, [])

  React.useEffect(() => {
    musicPreviewVolumeRef.current = musicPreviewVolume
    if (!previewAudioRef.current) return
    previewAudioRef.current.volume = musicPreviewVolume
  }, [musicPreviewVolume])

  const handleMusicPreviewVolumeChange = React.useCallback((nextValue: number) => {
    setMusicPreviewVolume(clampMusicPreviewVolume(nextValue / 100))
  }, [])

  const flashReplyHighlight = React.useCallback((entryId: string) => {
    if (replyHighlightTimerRef.current) {
      window.clearTimeout(replyHighlightTimerRef.current)
      replyHighlightTimerRef.current = null
    }

    setHighlightedEntryId(entryId)
    replyHighlightTimerRef.current = window.setTimeout(() => {
      setHighlightedEntryId((current) => (current === entryId ? null : current))
      replyHighlightTimerRef.current = null
    }, 1600)
  }, [])

  React.useEffect(() => {
    return () => {
      if (replyHighlightTimerRef.current) {
        window.clearTimeout(replyHighlightTimerRef.current)
        replyHighlightTimerRef.current = null
      }
    }
  }, [])

  React.useEffect(() => {
    if (!activePreviewTrack) return

    const cardNode = musicCardRefs.current.get(activePreviewTrack.id)
    if (!cardNode) return

    cardNode.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest',
    })
  }, [activePreviewTrack, reduceMotion])

  React.useEffect(() => {
    const pendingEntryId = pendingReplyScrollEntryIdRef.current
    if (!pendingEntryId) return

    const entryNode = chatEntryRefs.current.get(pendingEntryId)
    if (!entryNode) return

    entryNode.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    })
    flashReplyHighlight(pendingEntryId)
    pendingReplyScrollEntryIdRef.current = null
  }, [entries, flashReplyHighlight, reduceMotion])

  const stopPendingReplies = React.useCallback(() => {
    requestControllersRef.current.forEach((controller) => controller.abort())
    requestControllersRef.current = []
    setPendingReplies(0)
  }, [])

  const mergeEntryInState = React.useCallback((entryId: string, updater: (entry: ChatEntry) => ChatEntry) => {
    setEntries((current) => {
      const next = current.map((entry) => (entry.id === entryId ? updater(entry) : entry))
      entriesRef.current = next
      return next
    })
  }, [])

  const removeEntryInState = React.useCallback((entryId: string) => {
    setEntries((current) => {
      const next = removeChatEntry(current, entryId)
      entriesRef.current = next
      return next
    })
  }, [])

  const collectRecentMusicTrackIds = React.useCallback(() => {
    const trackIds = new Set<string>()

    stagedTracks.forEach((track) => {
      if (track.recommendation.id) {
        trackIds.add(track.recommendation.id)
      }
    })

    entriesRef.current.forEach((entry) => {
      entry.music?.recommendations.slice(0, 3).forEach((recommendation) => {
        if (recommendation.id) {
          trackIds.add(recommendation.id)
        }
      })
    })

    return [...trackIds]
  }, [stagedTracks])

  const fetchMusicRecommendations = React.useCallback(
    async (
      query: string,
      signal: AbortSignal,
      musicPreferenceOverride?: Partial<MusicPreference> | null,
      variantHint?: string,
      recentlyUsedTrackIds?: string[],
    ) => {
      const response = await fetch('/api/music/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal,
        body: JSON.stringify({
          query,
          projectTitle,
          initialPrompt,
          musicPreference: musicPreferenceOverride ?? musicPreference,
          videoContext,
          variantHint,
          recentlyUsedTrackIds,
        }),
      })

      const payload = (await response.json().catch(() => null)) as MusicApiResponse | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to build music recommendations right now.')
      }

      return payload
    },
    [initialPrompt, musicPreference, projectTitle, videoContext],
  )

  const resolveMusicRecommendations = React.useCallback(
    async (
      query: string,
      signal: AbortSignal,
      musicPreferenceOverride?: Partial<MusicPreference> | null,
      variantHint?: string,
    ): Promise<{
      recommendations: MusicRecommendation[]
      preference: MusicPreference
      fallback: boolean
      confidence: number
      needsRefinement: boolean
      source: 'groq' | 'heuristic'
      contextSummary: string
      recommendationGroups: MusicRecommendationGroup[]
      profile: MusicSoundtrackProfile
      phases: MusicRecommendationPhase[]
      archiveCount: number
      profileModel?: string
      variantHint?: string
      reasoningSummary: string
    }> => {
      const contextConfidence = videoContext.confidence ?? 0.5
      const recentlyUsedTrackIds = collectRecentMusicTrackIds()
      const resolvedPreference = normalizeMusicPreference(
        musicPreferenceOverride ?? musicPreference,
        [query, projectTitle, initialPrompt].filter(Boolean).join(' '),
        videoContext,
      )
      const fallbackProfile = buildHeuristicSoundtrackProfile({
        query,
        projectTitle,
        initialPrompt,
        preference: musicPreferenceOverride ?? musicPreference,
        videoContext,
        variantHint,
      })
      try {
        const remoteResult = await fetchMusicRecommendations(query, signal, musicPreferenceOverride, variantHint, recentlyUsedTrackIds)
        return {
          recommendations: remoteResult?.recommendations ?? [],
          preference: resolvedPreference,
          fallback: remoteResult?.fallback ?? false,
          confidence: remoteResult?.confidence ?? contextConfidence,
          needsRefinement: remoteResult?.needsRefinement ?? contextConfidence < 0.55,
          source: remoteResult?.source ?? 'heuristic',
          contextSummary: remoteResult?.contextSummary ?? remoteResult?.reasoningSummary ?? fallbackProfile.reasoningSummary,
          recommendationGroups: remoteResult?.recommendationGroups ?? [],
          profile: remoteResult?.profile ?? fallbackProfile,
          phases: remoteResult?.phases ?? buildMusicAnalysisStages({
            profile: remoteResult?.profile ?? fallbackProfile,
            archiveCount: remoteResult?.archiveCount ?? MUSIC_CATALOG.length,
            videoContext,
            variantHint,
          }),
          archiveCount: remoteResult?.archiveCount ?? MUSIC_CATALOG.length,
          profileModel: remoteResult?.profileModel,
          variantHint: remoteResult?.variantHint ?? variantHint,
          reasoningSummary: remoteResult?.reasoningSummary ?? fallbackProfile.reasoningSummary,
        }
      } catch {
        const fallbackBundle = buildMusicRecommendationSet({
          query,
          projectTitle,
          initialPrompt,
          preference: musicPreferenceOverride ?? musicPreference,
          videoContext,
          variantHint,
          recentlyUsedTrackIds,
          catalog: MUSIC_CATALOG,
          limit: MUSIC_RECOMMENDATION_LIMIT,
        })

        return {
          recommendations: fallbackBundle.recommendations,
          preference: resolvedPreference,
          fallback: true,
          confidence: fallbackBundle.confidence ?? contextConfidence,
          needsRefinement: fallbackBundle.needsRefinement ?? contextConfidence < 0.55,
          source: fallbackBundle.source,
          contextSummary: fallbackBundle.reasoningSummary,
          recommendationGroups: fallbackBundle.recommendationGroups,
          profile: fallbackBundle.profile,
          phases: fallbackBundle.phases,
          archiveCount: fallbackBundle.archiveCount,
          variantHint: fallbackBundle.variantHint,
          reasoningSummary: fallbackBundle.reasoningSummary,
        }
      }
    },
    [collectRecentMusicTrackIds, fetchMusicRecommendations, initialPrompt, musicPreference, projectTitle, videoContext],
  )

  const togglePreviewTrack = React.useCallback((recommendation: MusicRecommendation) => {
    if (musicPreviewToggleCooldownRef.current !== null) return
    armMusicPreviewToggleCooldown()

    if (activePreviewTrack?.id === recommendation.id) {
      setPreviewPlaying((current) => !current)
      return
    }

    setActivePreviewTrack(recommendation)
    setPreviewPlaying(true)
  }, [activePreviewTrack, armMusicPreviewToggleCooldown])

  const stageTrack = React.useCallback((recommendation: MusicRecommendation) => {
    const isAlreadyStaged = stagedTracks.some((track) => track.recommendation.id === recommendation.id)
    if (isAlreadyStaged) {
      setStagedTracks((current) => current.filter((track) => track.recommendation.id !== recommendation.id))
      return
    }

    const nextStage: StagedMusicTrack = {
      id: `stage-${projectId}-${recommendation.id}`,
      projectId,
      recommendation,
      addedAt: new Date().toISOString(),
    }

    setStagedTracks((current) => {
      const next = [nextStage, ...current.filter((track) => track.recommendation.id !== recommendation.id)]
      return next
    })

    setMusicPreference({
      mood: recommendation.mood,
      energy: recommendation.energy,
      sourcePlatform: recommendation.sourcePlatform,
      updatedAt: new Date().toISOString(),
    })
  }, [projectId, stagedTracks])

  const removeStagedTrack = React.useCallback((trackId: string) => {
    setStagedTracks((current) => current.filter((track) => track.id !== trackId))
  }, [])

  const clearStagedTracks = React.useCallback(() => {
    setStagedTracks([])
  }, [])

  const handleDismissSpotlightTrack = React.useCallback((trackId: string) => {
    setDismissedSpotlightTrackId(trackId)

    if (activePreviewTrack?.id === trackId) {
      setPreviewPlaying(false)
      setActivePreviewTrack(null)
    }
  }, [activePreviewTrack])

  const refineMusicTrack = React.useCallback(
    async (entryId: string, toneKey: string) => {
      const preset = MUSIC_REFINEMENT_OPTIONS.find((option) => option.key === toneKey)
      if (!preset) return

      const entry = entriesRef.current.find((item) => item.id === entryId && item.music)
      if (!entry?.music) return

      const previousMusic = entry.music
      const controller = new AbortController()
      let requestTimedOut = false
      const requestTimeoutId = window.setTimeout(() => {
        requestTimedOut = true
        controller.abort()
      }, EDITOR_REQUEST_TIMEOUT_MS)
      requestControllersRef.current = [...requestControllersRef.current, controller]
      setPendingReplies((current) => current + 1)

      const nextPreference: Partial<MusicPreference> = {
        ...entry.music.preference,
        mood: toneKey === 'fresh' ? entry.music.preference.mood : preset.mood,
        energy: toneKey === 'fresh' ? entry.music.preference.energy : preset.energy,
        updatedAt: new Date().toISOString(),
      }

      mergeEntryInState(entryId, (currentEntry) => ({
        ...currentEntry,
        music: currentEntry.music
          ? {
              ...currentEntry.music,
              status: 'loading',
              preference: {
                ...currentEntry.music.preference,
                mood: toneKey === 'fresh' ? currentEntry.music.preference.mood : preset.mood,
                energy: toneKey === 'fresh' ? currentEntry.music.preference.energy : preset.energy,
                updatedAt: new Date().toISOString(),
              },
            }
          : currentEntry.music,
      }))

      pendingReplyScrollEntryIdRef.current = entryId

      try {
        const result = await resolveMusicRecommendations(entry.music.query, controller.signal, nextPreference, preset.variantHint ?? toneKey)
        if (controller.signal.aborted) {
          if (requestTimedOut) {
            toast.error('Music refinement timed out. Restored the previous recommendation.')
          }

          mergeEntryInState(entryId, (currentEntry) => ({
            ...currentEntry,
            music: previousMusic,
          }))
          return
        }

        setMusicPreference(result.preference)
        mergeEntryInState(entryId, (currentEntry) => ({
          ...currentEntry,
          status: 'ready',
          music: currentEntry.music
            ? {
                ...currentEntry.music,
                status: 'ready',
                preference: result.preference,
                recommendations: result.recommendations,
                fallback: result.fallback,
                confidence: result.confidence,
                needsRefinement: result.needsRefinement,
                source: result.source,
                contextSummary: result.contextSummary,
                reasoningSummary: result.reasoningSummary,
                recommendationGroups: result.recommendationGroups,
                profile: result.profile,
                phases: result.phases,
                archiveCount: result.archiveCount,
                profileModel: result.profileModel,
                variantHint: result.variantHint,
              }
            : currentEntry.music,
        }))
      } finally {
        window.clearTimeout(requestTimeoutId)
        requestControllersRef.current = requestControllersRef.current.filter(
          (activeController) => activeController !== controller,
        )
        setPendingReplies((current) => Math.max(0, current - 1))
      }
    },
    [mergeEntryInState, resolveMusicRecommendations, setMusicPreference],
  )

  const submitMessage = React.useCallback(
    async (
      rawValue: string,
      options?: {
        forceMusic?: boolean
        musicQuickAction?: boolean
        scrollToReply?: boolean
        showUserMessage?: boolean
        revisionRequest?: FrameAssistSubmission['revisionRequest'] | null
      },
    ) => {
      const nextValue = rawValue.trim()
      if (!nextValue) return

      const shouldScrollToReply = options?.scrollToReply ?? true
      const shouldRecommendMusicCandidate = options?.forceMusic ?? checkMusicIntent(nextValue)
      const shouldEditRequest = !options?.forceMusic && (isEditIntent(nextValue) || Boolean(options?.revisionRequest?.frameTarget))
      const shouldRecommendMusic = shouldEditRequest ? false : shouldRecommendMusicCandidate
      const shouldShowUserMessage = options?.showUserMessage ?? true
      const musicContextConfidence = videoContext.confidence ?? 0.5
      const editPromptBasis = options?.revisionRequest?.instructionText?.trim() || nextValue
      const editStyleTemplate = shouldEditRequest ? selectEditStyleTemplate(editPromptBasis, videoContext) : null
      const isBroadMusicRequest =
        shouldRecommendMusic &&
        (options?.musicQuickAction === true || isGenericMusicRequest(nextValue) || nextValue.length < 20)
      const assistantId = shouldRecommendMusic
        ? `assistant-music-${Date.now()}`
        : shouldEditRequest
          ? `assistant-edit-${Date.now()}`
          : `assistant-${Date.now()}`
      const loadingText = shouldRecommendMusic
        ? 'Pulling a few cues that match the current cut...'
        : shouldEditRequest
          ? `Starting ${editStyleTemplate?.name ?? 'the edit pass'} on the imported video...`
          : 'Shaping the next pass from the original direction...'
      const musicReply = shouldRecommendMusic
        ? buildMusicReply({
            projectTitle,
            sourceCount: initialSources.length,
            videoContext,
          })
        : ''
      const editReplyFallback =
        shouldEditRequest && editStyleTemplate
          ? buildEditAssistantReply({
              projectTitle,
              sourceCount: initialSources.length,
              styleTemplate: editStyleTemplate,
              prompt: editPromptBasis,
              videoContext,
            })
          : ''
      const loadingMusicProfile = shouldRecommendMusic
        ? buildHeuristicSoundtrackProfile({
            query: nextValue,
            projectTitle,
            initialPrompt,
            preference: musicPreference,
            videoContext,
            variantHint: isBroadMusicRequest ? 'fresh' : undefined,
          })
        : null
      const loadingMusicPhases = shouldRecommendMusic && loadingMusicProfile
        ? buildMusicAnalysisStages({
            profile: loadingMusicProfile,
            archiveCount: MUSIC_CATALOG.length,
            videoContext,
            variantHint: isBroadMusicRequest ? 'fresh' : undefined,
          })
        : []

      const baseEntries = entriesRef.current.filter((entry) => entry.status !== 'loading')
      const userEntry: ChatEntry | null = shouldShowUserMessage
        ? {
            id: `user-${Date.now()}`,
            role: 'user',
            text: nextValue,
          }
        : null
      const displayEntries = userEntry ? [...baseEntries, userEntry] : baseEntries
      const messageHistory = [
        ...baseEntries.map((entry) => ({
          role: entry.role,
          text: entry.text,
        })),
        { role: 'user' as const, text: nextValue },
      ]
      const loadingAssistant: ChatEntry = {
        id: assistantId,
        role: 'assistant',
        text: shouldRecommendMusic ? musicReply : loadingText,
        status: 'loading',
        music: shouldRecommendMusic
          ? {
              status: 'loading',
              query: nextValue,
              preference: musicPreference,
              recommendations: [],
              recommendationGroups: [],
              phases: loadingMusicPhases,
              profile: loadingMusicProfile ?? buildHeuristicSoundtrackProfile({
                query: nextValue,
                projectTitle,
                initialPrompt,
                preference: musicPreference,
                videoContext,
                variantHint: isBroadMusicRequest ? 'fresh' : undefined,
              }),
              archiveCount: MUSIC_CATALOG.length,
              source: 'heuristic',
              fallback: true,
              variantHint: isBroadMusicRequest ? 'fresh' : undefined,
              confidence: musicContextConfidence,
              needsRefinement: isBroadMusicRequest || musicContextConfidence < 0.55,
              contextSummary: loadingMusicProfile?.reasoningSummary ?? videoContext.summary,
              reasoningSummary: loadingMusicProfile?.reasoningSummary ?? videoContext.summary,
            }
          : undefined,
      }

      const nextEntries = [...displayEntries, loadingAssistant]
      entriesRef.current = nextEntries
      setEntries(nextEntries)
      if (shouldRecommendMusic || shouldScrollToReply) {
        pendingReplyScrollEntryIdRef.current = assistantId
      }

      setPendingReplies((current) => current + 1)

      if (shouldEditRequest && editStyleTemplate) {
        try {
          void onEditRequest?.({
            prompt: editPromptBasis,
            styleTemplate: editStyleTemplate,
          })
        } catch {
          // The edit reply can still stream even if the job staging signal fails.
        }
      }

      const controller = new AbortController()
      let requestTimedOut = false
      let chatTaskCompleted = shouldRecommendMusic
      let musicTaskCompleted = !shouldRecommendMusic
      const requestTimeoutId = window.setTimeout(() => {
        requestTimedOut = true
        controller.abort()
      }, EDITOR_REQUEST_TIMEOUT_MS)
      requestControllersRef.current = [...requestControllersRef.current, controller]
      let replyResolved = shouldRecommendMusic
      let latestReplyText = shouldRecommendMusic ? musicReply : loadingText

      try {
        const chatTask = shouldRecommendMusic
          ? Promise.resolve()
          : (async () => {
            try {
              const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                cache: 'no-store',
                signal: controller.signal,
                body: JSON.stringify({
                  projectTitle,
                  originalPrompt: initialPrompt,
                  initialSources,
                  videoContext,
                  stream: shouldEditRequest,
                  workflow: shouldEditRequest ? 'edit' : 'chat',
                  messages: messageHistory,
                  revisionRequest: options?.revisionRequest ?? null,
                }),
              })

              if (shouldEditRequest) {
                if (!response.ok) {
                  const payload = (await response.json().catch(() => null)) as ChatApiResponse | null
                  throw new Error(
                    payload?.error?.trim() ||
                      `Groq request failed with ${response.status} ${response.statusText}.`,
                  )
                }

                if (!response.body) {
                  throw new Error('Groq returned an empty stream.')
                }

                const streamedReply = await readGroqStreamText(response, controller.signal, (partialText) => {
                  latestReplyText = partialText || loadingText
                  mergeEntryInState(assistantId, (entry) => ({
                    ...entry,
                    text: latestReplyText,
                    status: 'loading',
                  }))
                })

                if (controller.signal.aborted) return

                const finalReply = sanitizeAssistantReply(streamedReply) || editReplyFallback || loadingText
                latestReplyText = finalReply
                replyResolved = Boolean(finalReply)
                chatTaskCompleted = true
                mergeEntryInState(assistantId, (entry) => ({
                  ...entry,
                  text: finalReply,
                  status: 'ready',
                }))
                return
              }

              const payload = (await response.json().catch(() => null)) as ChatApiResponse | null
              const nextReply = typeof payload?.reply === 'string' ? payload.reply.trim() : ''
              const nextError = typeof payload?.error === 'string' ? payload.error.trim() : ''

              if (controller.signal.aborted) return

              if (response.ok && nextReply) {
                latestReplyText = nextReply
                replyResolved = true
                chatTaskCompleted = true
                mergeEntryInState(assistantId, (entry) => ({
                  ...entry,
                  text: nextReply,
                  status: 'ready',
                }))
                return
              }

              const chatErrorText = nextError || 'Groq could not answer right now.'
              latestReplyText = chatErrorText
              replyResolved = true
              chatTaskCompleted = true
              mergeEntryInState(assistantId, (entry) => ({
                ...entry,
                text: chatErrorText,
                status: 'ready',
              }))
            } catch (error) {
              if (controller.signal.aborted) return

              const chatErrorText =
                error instanceof Error
                  ? error.message
                  : 'The live Groq reply could not be completed right now.'

              if (shouldEditRequest) {
                const fallbackReply = sanitizeAssistantReply(editReplyFallback || chatErrorText || loadingText)
                latestReplyText = fallbackReply
                replyResolved = true
                chatTaskCompleted = true
                mergeEntryInState(assistantId, (entry) => ({
                  ...entry,
                  text: fallbackReply,
                  status: 'ready',
                }))
                return
              }

              latestReplyText = chatErrorText
              replyResolved = true
              chatTaskCompleted = true
              mergeEntryInState(assistantId, (entry) => ({
                ...entry,
                text: chatErrorText,
                status: 'ready',
              }))
            }
          })()

        const musicTask = shouldRecommendMusic
            ? (async () => {
              const result = await resolveMusicRecommendations(
                nextValue,
                controller.signal,
                undefined,
                isBroadMusicRequest ? 'fresh' : undefined,
              )
              if (controller.signal.aborted) return

              setMusicPreference(result.preference)
              musicTaskCompleted = true
              mergeEntryInState(assistantId, (entry) => ({
                ...entry,
                status: 'ready',
                music: {
                  status: 'ready',
                  query: nextValue,
                  preference: result.preference,
                  recommendations: result.recommendations,
                  recommendationGroups: result.recommendationGroups ?? [],
                  phases: result.phases ?? [],
                  profile: result.profile,
                  archiveCount: result.archiveCount ?? MUSIC_CATALOG.length,
                  source: result.source,
                  fallback: result.fallback,
                  confidence: result.confidence,
                  needsRefinement: isBroadMusicRequest || result.needsRefinement,
                  contextSummary: result.contextSummary,
                  reasoningSummary: result.reasoningSummary,
                  profileModel: result.profileModel,
                  variantHint: result.variantHint,
                },
              }))
            })()
          : Promise.resolve()

        await Promise.allSettled([chatTask, musicTask])

        if (controller.signal.aborted) {
          if (!(chatTaskCompleted && musicTaskCompleted)) {
            if (requestTimedOut) {
              toast.error(
                shouldRecommendMusic
                  ? 'Music lookup timed out. Please try again.'
                  : 'That send request timed out. Please try again.',
              )
            }
            removeEntryInState(assistantId)
          }
          return
        }

        if (shouldEditRequest && !replyResolved) {
          const fallbackReply = sanitizeAssistantReply(editReplyFallback || latestReplyText || loadingText)
          latestReplyText = fallbackReply
          replyResolved = true
          chatTaskCompleted = true
          mergeEntryInState(assistantId, (entry) => ({
            ...entry,
            text: fallbackReply,
            status: 'ready',
          }))
          return
        }

        if (shouldRecommendMusic && !replyResolved) {
          latestReplyText = buildAssistantReply({
            projectTitle,
            originalPrompt: initialPrompt,
            sourceCount: initialSources.length,
            input: nextValue,
          })
          mergeEntryInState(assistantId, (entry) => ({
            ...entry,
            text: latestReplyText,
            status: 'ready',
          }))
        }
      } catch (error) {
        if (controller.signal.aborted) {
          removeEntryInState(assistantId)
          return
        }

        const assistantEntry: ChatEntry = {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text:
            error instanceof Error
              ? error.message
              : 'The live Groq reply could not be completed right now.',
        }
        const withAssistantError = [...entriesRef.current, assistantEntry]
        entriesRef.current = withAssistantError
        setEntries(withAssistantError)
      } finally {
        window.clearTimeout(requestTimeoutId)
        requestControllersRef.current = requestControllersRef.current.filter(
          (activeController) => activeController !== controller,
        )
        setPendingReplies((current) => Math.max(0, current - 1))
      }
    },
    [
      initialPrompt,
      initialSources,
      onEditRequest,
      musicPreference,
      projectTitle,
      mergeEntryInState,
      removeEntryInState,
      resolveMusicRecommendations,
      videoContext,
    ],
  )

  const handleSubmit = React.useCallback(
    async (submission: FrameAssistSubmission) => {
      const nextValue = submission.rawText.trim()
      if (!nextValue) return

      if (submission.revisionRequest.frameTarget) {
        const previewRequestToken = `preview-queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        queuedPreviewRequestTokenRef.current = previewRequestToken
        setQueuedPreviewRevision({
          requestId: previewRequestToken,
          request: submission.revisionRequest,
          queuedAt: new Date().toISOString(),
          etaMs: 2200,
          status: 'queueing',
        })

        void queuePreviewRevisionRequest(submission.revisionRequest)
          .then((queuedState) => {
            if (queuedPreviewRequestTokenRef.current !== previewRequestToken) return
            setQueuedPreviewRevision(queuedState)
          })
          .catch(() => {
            if (queuedPreviewRequestTokenRef.current !== previewRequestToken) return
            setQueuedPreviewRevision({
              requestId: `${previewRequestToken}-fallback`,
              request: submission.revisionRequest,
              queuedAt: new Date().toISOString(),
              etaMs: 2200,
              status: 'queued',
            })
          })
      }

      void submitMessage(nextValue, {
        revisionRequest: submission.revisionRequest,
      })
      setDraft('')
    },
    [submitMessage],
  )

  const clearQueuedPreviewRevision = React.useCallback(() => {
    queuedPreviewRequestTokenRef.current = null
    setQueuedPreviewRevision(null)
  }, [])

  const handlePresetAction = React.useCallback((label: string) => {
    if (label === 'Add music') {
      submitMessage(buildMusicQuickActionPrompt(projectTitle, videoContext), {
        forceMusic: true,
        musicQuickAction: true,
        scrollToReply: true,
        showUserMessage: false,
      })
      return
    }

    const editStyleTemplate = selectEditStyleTemplate(label, videoContext)
    const editPrompt = buildEditQuickActionPrompt(projectTitle, videoContext, editStyleTemplate)
    const nextPrompt = label === 'Edit this video' ? editPrompt : `${label}. ${editPrompt}`
    void submitMessage(nextPrompt, {
      forceMusic: false,
      scrollToReply: true,
      showUserMessage: false,
    })
  }, [projectTitle, submitMessage, videoContext])

  React.useEffect(() => {
    if (!automationRequest) return
    if (handledAutomationRequestIdRef.current === automationRequest.id) return

    handledAutomationRequestIdRef.current = automationRequest.id
    setIsComposerOpen(true)
    setDraft('')
    void submitMessage(automationRequest.prompt, {
      forceMusic: false,
      scrollToReply: true,
      showUserMessage: false,
    })
  }, [automationRequest, submitMessage])

  const spotlightCandidateTrack = stagedTracks[0] ?? null
  const spotlightCandidateTrackId = spotlightCandidateTrack?.recommendation.id ?? null

  React.useEffect(() => {
    if (dismissedSpotlightTrackId && dismissedSpotlightTrackId !== spotlightCandidateTrackId) {
      setDismissedSpotlightTrackId(null)
    }
  }, [dismissedSpotlightTrackId, spotlightCandidateTrackId])

  const latestMusicEntry = [...entries].reverse().find((entry) => Boolean(entry.music)) ?? null
  const latestMusicBlock = latestMusicEntry?.music ?? null
  const spotlightTrack =
    spotlightCandidateTrack && dismissedSpotlightTrackId !== spotlightCandidateTrackId
      ? spotlightCandidateTrack
      : null

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-3 z-20 h-px bg-[linear-gradient(90deg,rgba(127,242,212,0)_0%,rgba(127,242,212,0.56)_24%,rgba(255,255,255,0.16)_50%,rgba(127,242,212,0.32)_76%,rgba(127,242,212,0)_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-[linear-gradient(180deg,rgba(19,19,23,0.98)_0%,rgba(19,19,23,0.92)_38%,rgba(19,19,23,0)_100%)] blur-sm"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-[linear-gradient(180deg,rgba(19,19,23,0)_0%,rgba(19,19,23,0.9)_62%,rgba(19,19,23,1)_100%)] blur-sm"
        />
        <div ref={threadViewportRef} className="h-full overflow-y-auto overscroll-contain px-4 py-4 pb-32 scrollbar-hidden">
          <div ref={threadContentRef} className="space-y-4 pr-2">
            <motion.div
              variants={buildRevealVariants({ delay: 0.04, distance: 14, blur: 8, duration: 0.28 })}
              initial="hidden"
              whileInView="visible"
              viewport={{ root: threadViewportRef, once: false, amount: 0.4 }}
              className="space-y-2"
            >
              <div className="text-[10px] uppercase tracking-[0.34em] text-white/32">Project</div>
              <h1 className="text-[1.85rem] leading-tight text-white font-sans">{projectTitle}</h1>
              <div className="flex items-center gap-2 text-xs text-white/42">
                <CheckCircle2 className="size-3.5 text-white/48" />
                All changes saved
              </div>
            </motion.div>

            <motion.div
              variants={buildRevealVariants({ delay: 0.1, distance: 16, blur: 10, duration: 0.3 })}
              initial="hidden"
              whileInView="visible"
              viewport={{ root: threadViewportRef, once: false, amount: 0.4 }}
              className="rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
            >
              <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">Prompt</div>
              <p className="mt-3 text-sm leading-6 text-white/78 font-sans">{initialPrompt}</p>
              {initialSources.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {initialSources.slice(0, 4).map((source) => (
                    <span
                      key={source}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/58"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              ) : null}
            </motion.div>

            <motion.div
              variants={buildRevealVariants({ delay: 0.16, distance: 12, blur: 8, duration: 0.28 })}
              initial="hidden"
              whileInView="visible"
              viewport={{ root: threadViewportRef, once: false, amount: 0.4 }}
              className="grid gap-2 sm:grid-cols-2"
            >
              {QUICK_ACTIONS.map(({ label, icon: Icon }, index) => {
                const actionTilt = QUICK_ACTION_TILTS[index] ?? QUICK_ACTION_TILTS[QUICK_ACTION_TILTS.length - 1] ?? {
                  rotate: 0,
                  y: 0,
                }

                return (
                  <motion.button
                    key={label}
                    type="button"
                    onClick={() => handlePresetAction(label)}
                    initial={
                      reduceMotion
                        ? false
                        : {
                            opacity: 0,
                            y: actionTilt.y + 12,
                            scale: 0.94,
                            rotate: actionTilt.rotate - 1.2,
                          }
                    }
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            opacity: 1,
                            y: actionTilt.y,
                            scale: 1,
                            rotate: actionTilt.rotate,
                          }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : {
                            duration: 0.34,
                            delay: 0.1 + index * 0.07,
                            ease: [0.22, 1, 0.36, 1],
                          }
                    }
                    whileHover={
                      reduceMotion
                        ? undefined
                        : {
                            y: actionTilt.y - 2,
                            rotate: actionTilt.rotate * 0.55,
                            scale: 1.02,
                          }
                    }
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className="flex min-h-[40px] w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border border-white/8 bg-[#101015]/94 px-3 py-2 text-center text-[10px] leading-none text-white/70 shadow-[0_18px_28px_-24px_rgba(0,0,0,0.82)] transition-colors hover:border-white/14 hover:text-white sm:text-[11px]"
                  >
                    <motion.span
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.72, rotate: -10 }}
                      animate={reduceMotion ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
                      transition={
                        reduceMotion
                          ? undefined
                          : {
                              duration: 0.28,
                              delay: 0.16 + index * 0.07,
                              ease: [0.22, 1, 0.36, 1],
                            }
                      }
                    >
                      <Icon className="size-3.5" />
                    </motion.span>
                    <motion.span
                      initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                      transition={
                        reduceMotion
                          ? undefined
                          : {
                              duration: 0.28,
                              delay: 0.2 + index * 0.07,
                              ease: [0.22, 1, 0.36, 1],
                            }
                      }
                      className="font-sans"
                    >
                      {label}
                    </motion.span>
                  </motion.button>
                )
              })}
            </motion.div>

            <motion.div layout className="space-y-3">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  ref={(node) => {
                    if (node) {
                      chatEntryRefs.current.set(entry.id, node)
                    } else {
                      chatEntryRefs.current.delete(entry.id)
                    }
                  }}
                  layout
                  initial={reduceMotion ? false : 'hidden'}
                  whileInView={reduceMotion ? undefined : 'visible'}
                  exit={reduceMotion ? undefined : 'exit'}
                  viewport={reduceMotion ? undefined : { root: threadViewportRef, once: false, amount: 0.35 }}
                  variants={
                    reduceMotion
                      ? undefined
                      : buildRevealVariants({
                          delay: 0.04 + index * 0.03,
                          distance: 22,
                          blur: 10,
                          scale: 0.98,
                          duration: 0.34,
                        })
                  }
                  className={cn(
                    'relative scroll-mt-20 max-w-[94%] rounded-[18px] border px-4 py-3 text-sm leading-6 shadow-[0_24px_36px_-32px_rgba(0,0,0,0.72)] font-sans',
                    entry.role === 'assistant'
                      ? 'border-white/8 bg-white/[0.03] text-white/74'
                      : 'ml-auto border-white/12 bg-white/[0.06] text-white',
                  )}
                >
                  <AnimatePresence initial={false}>
                    {highlightedEntryId === entry.id ? (
                      <motion.div
                        aria-hidden
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                        animate={
                          reduceMotion
                            ? undefined
                            : {
                                opacity: [0, 1, 0],
                                scale: [0.985, 1, 1.005],
                              }
                        }
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 1.55, ease: 'easeOut' }}
                        className="pointer-events-none absolute -inset-2 rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(127,242,212,0.24)_0%,rgba(127,242,212,0.12)_28%,rgba(127,242,212,0)_72%)] blur-2xl"
                      />
                    ) : null}
                  </AnimatePresence>
                  {entry.role === 'assistant' ? (
                    <div className="space-y-3">
                      {entry.status === 'loading' && !entry.music ? (
                        <div className="flex items-start gap-2 text-sm leading-6 text-white/72">
                          <span className="mt-2.5 flex shrink-0 items-center gap-1">
                            <span className="size-1.5 animate-pulse rounded-full bg-white/48 [animation-delay:-0.2s]" />
                            <span className="size-1.5 animate-pulse rounded-full bg-white/48" />
                            <span className="size-1.5 animate-pulse rounded-full bg-white/48 [animation-delay:0.2s]" />
                          </span>
                          <span>{entry.text}</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-6 tracking-[0.01em] text-white/74">
                          {entry.text}
                        </p>
                      )}

                      {entry.music ? (
                        <div className="space-y-3 pt-1">
                          <MusicRecommendationShowcase
                            music={entry.music}
                            isPreviewing={(trackId) => activePreviewTrack?.id === trackId}
                            previewPlaying={previewPlaying}
                            stagedTrackIds={stagedTrackIdSet}
                            onPreviewToggle={togglePreviewTrack}
                            onAdd={stageTrack}
                            onRefine={(toneKey) => void refineMusicTrack(entry.id, toneKey)}
                            viewportRoot={threadViewportRef}
                            registerCardRef={(trackId, node) => {
                              if (node) {
                                musicCardRefs.current.set(trackId, node)
                              } else {
                                musicCardRefs.current.delete(trackId)
                              }
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    entry.text
                  )}
                </motion.div>
              ))}
              <div ref={threadEndRef} className="h-1" />
            </motion.div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-[linear-gradient(180deg,rgba(19,19,23,0)_0%,rgba(19,19,23,0.9)_62%,rgba(19,19,23,1)_100%)] blur-sm"
          />
        </div>
        <motion.div
          variants={buildRevealVariants({ delay: 0.22, distance: 12, blur: 8, duration: 0.28 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ root: threadViewportRef, once: false, amount: 0.25 }}
          className="shrink-0 border-t border-white/8 bg-[#101116]/92 px-4 py-3 backdrop-blur-md"
        >
          <StagedMusicRail
            projectTitle={projectTitle}
            preference={musicPreference}
            profile={latestMusicBlock?.profile}
            stagedTracks={stagedTracks}
            musicVolumePercent={Math.round(musicPreviewVolume * 100)}
            onMusicVolumeChange={handleMusicPreviewVolumeChange}
            onRemoveTrack={removeStagedTrack}
            onClearAll={clearStagedTracks}
          />
        </motion.div>
      </div>

      {musicSpotlightPortalTarget && spotlightTrack
        ? createPortal(
            <AnimatePresence mode="wait" initial={false}>
              <MusicSpotlightOrb
                key={spotlightTrack.recommendation.id}
                recommendation={spotlightTrack.recommendation}
                status={
                  activePreviewTrack?.id === spotlightTrack.recommendation.id && previewPlaying
                    ? 'previewing'
                    : 'staged'
                }
                onDismiss={() => handleDismissSpotlightTrack(spotlightTrack.recommendation.id)}
              />
            </AnimatePresence>,
            musicSpotlightPortalTarget,
          )
        : null}

      {composerPortalTarget
        ? createPortal(
            <FloatingChatComposer
              projectId={projectId}
              draft={draft}
              onDraftChange={setDraft}
              onSubmit={handleSubmit}
              onStop={stopPendingReplies}
              loading={pendingReplies > 0}
              reduceMotion={reduceMotion}
              isOpen={isComposerOpen}
              onOpenChange={setIsComposerOpen}
              queuedPreviewRevision={queuedPreviewRevision}
              onClearQueuedPreview={clearQueuedPreviewRevision}
            />,
            composerPortalTarget,
          )
        : null}
    </div>
  )
})
