import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const editorPage = read('app/editor/[id]/page.tsx')
  const route = read('app/api/prometheus-chat/route.ts')
  const retrieval = read('lib/prometheus-assistant/retrieval.ts')
  const knowledge = read('lib/prometheus-assistant/knowledge.generated.ts')
  const luxuryChatPath = 'components/editor/PrometheusChat.tsx'

  assert.equal(existsSync(join(root, luxuryChatPath)), true)
  const luxuryChat = read(luxuryChatPath)

  assert.match(luxuryChat, /export type PrometheusChatMessage/)
  assert.match(luxuryChat, /messages:\s*PrometheusChatMessage\[\]/)
  assert.match(luxuryChat, /onSend:\s*\(message:\s*string\)/)
  assert.match(luxuryChat, /export function PrometheusChat/)
  assert.match(luxuryChat, /function SpectraNoiseFallback/)
  assert.match(luxuryChat, /InlineLoadingAnimation/)
  assert.doesNotMatch(luxuryChat, /function LiquidMetalFallback/)
  assert.doesNotMatch(luxuryChat, /function ThinTypingLine/)
  assert.match(luxuryChat, /Ask Prometheus\.\.\./)
  assert.match(luxuryChat, /rounded-\[16px_16px_4px_16px\]/)
  assert.match(luxuryChat, /rounded-\[4px_16px_16px_16px\]/)
  assert.match(luxuryChat, /cubic-bezier\(0\.25,\s*0\.46,\s*0\.45,\s*0\.94\)/)
  assert.match(luxuryChat, /rgba\(160,\s*180,\s*140,\s*0\.03\)/)
  assert.match(luxuryChat, /rgba\(200,\s*170,\s*120,\s*0\.02\)/)
  assert.match(luxuryChat, /thinking/i)
  assert.match(luxuryChat, /demoMessages/)
  assert.doesNotMatch(luxuryChat, /EDITOR RELAY/)
  assert.doesNotMatch(luxuryChat, /Build something amazing/)
  assert.doesNotMatch(luxuryChat, /bg-emerald|emerald-500|#267dff|prometheus-accent-cyan/)
  assert.doesNotMatch(luxuryChat, /type:\s*'spring'/)
  assert.doesNotMatch(luxuryChat, /loader-orb|AiResponseLoader|prometheusThinkingPulse|prometheusLiquidRipple/)

  assert.equal(editorPage.includes('md:w-[420px]'), false)
  assert.equal(editorPage.includes('lg:w-[420px]'), false)
  assert.equal(editorPage.includes('max-w-[420px]'), false)
  assert.match(editorPage, /z-\[120\]/)
  assert.match(editorPage, /setChatComposerPortal[\s\S]*z-\[120\]/)
  assert.match(editorPage, /data-editorial-chat=\{isThreadOpen \? 'moon-expanded' : 'launcher'\}/)
  assert.match(editorPage, /md:h-\[calc\(100dvh-2rem\)\]/)
  assert.match(editorPage, /md:w-\[calc\(100vw-2rem\)\]/)
  assert.match(editorPage, /chatMorphVariants/)
  assert.match(editorPage, /type: 'spring'/)
  assert.match(editorPage, /mass: 1\.2/)
  assert.match(editorPage, /PrometheusChat/)
  assert.match(editorPage, /editorOverlayMessages/)
  assert.equal(editorPage.includes('Build something amazing'), false)

  assert.match(editorPage, /const endpoint = shouldEditRequest \? '\/api\/chat' : '\/api\/prometheus-chat'/)
  assert.equal(editorPage.includes("const endpoint = shouldEditRequest ? '/api/chat' : '/api/rag'"), false)

  assert.match(editorPage, /InlineLoadingAnimation/)
  assert.equal(editorPage.includes('AiResponseLoader'), false)
  assert.match(editorPage, /function ChatToolCallGroup/)
  assert.match(editorPage, /function ChatFrameReferenceStrip/)
  assert.match(editorPage, /function ChatAttachmentStrip/)
  assert.equal(editorPage.includes('function ChatSkeletonLoader'), false)
  assert.equal(editorPage.includes('<ChatSkeletonLoader'), false)
  assert.match(editorPage, /<ChatToolCallGroup/)
  assert.match(editorPage, /<ChatFrameReferenceStrip/)
  assert.match(editorPage, /<ChatAttachmentStrip/)
  assert.match(editorPage, /readImageAttachment/)
  assert.match(editorPage, /pendingChatAttachments/)

  assert.match(editorPage, /const nextToolCalls = normalizeChatToolCalls\(payload\?\.toolCalls\)/)
  assert.match(editorPage, /const nextFrames = normalizeChatFrames\(payload\?\.frames\)/)
  assert.match(editorPage, /const nextAttachments = normalizeChatAttachments\(payload\?\.attachments\)/)

  assert.match(route, /import Groq from 'groq-sdk'/)
  assert.match(route, /const PROMETHEUS_TOOLS =/)
  assert.match(route, /name: 'search_prometheus_knowledge'/)
  assert.match(route, /name: 'reference_video_frames'/)
  assert.match(route, /name: 'draft_editor_actions'/)
  assert.match(route, /tools: PROMETHEUS_TOOLS as never/)
  assert.match(route, /tool_choice: 'auto'/)
  assert.match(route, /normalizeGroqToolCalls/)
  assert.match(route, /executePrometheusTool/)
  assert.match(route, /toolCalls: executedToolCalls/)
  assert.match(route, /frames: toFramePayload\(frameReferences, executedToolCalls\)/)

  assert.match(retrieval, /PROMETHEUS_KNOWLEDGE_CHUNKS/)
  assert.match(retrieval, /export function retrievePrometheusKnowledge/)
  assert.match(retrieval, /export function formatKnowledgeContext/)
  assert.match(retrieval, /export function createExtractivePrometheusAnswer/)

  for (const source of [
    '01_prometheus_system_overview.pdf',
    '02_video_editing_best_practices.pdf',
    '03_user_scenarios_troubleshooting.pdf',
    '04_tool_calling_guide.pdf',
    '05_creative_workflows.pdf',
  ]) {
    assert.equal(knowledge.includes(`"source": "${source}"`), true, source)
  }
}

run()
