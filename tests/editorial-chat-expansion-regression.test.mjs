import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const editorPage = read('app/editor/[id]/page.tsx')
  const chatRoute = read('app/api/prometheus-chat/route.ts')
  const retrieval = read('lib/prometheus-assistant/retrieval.ts')

  assert.equal(existsSync(join(root, 'components/ui/micro-expander.tsx')), true)
  assert.equal(existsSync(join(root, 'components/ui/vapour-text-effect.tsx')), false)

  const microExpander = read('components/ui/micro-expander.tsx')
  assert.match(microExpander, /export const MicroExpander/)
  assert.match(microExpander, /AnimatePresence/)
  assert.match(microExpander, /InlineLoadingAnimation/)
  assert.match(microExpander, /aria-label=\{text\}/)
  assert.match(microExpander, /data-slot="micro-expander"/)

  assert.equal(existsSync(join(root, 'components/ui/ai-response-loader.tsx')), false)

  assert.match(editorPage, /MicroExpander/)
  assert.match(editorPage, /InlineLoadingAnimation[^>]*label="Prometheus is responding"/)
  assert.match(editorPage, /data-editorial-chat=\{isThreadOpen \? 'moon-expanded' : 'launcher'\}/)
  assert.match(editorPage, /style-previews\/dark-cinematic-1\.jpg/)
  assert.doesNotMatch(editorPage, /Build something amazing/)
  assert.match(editorPage, /Generate Code/)
  assert.match(editorPage, /Launch App/)
  assert.match(editorPage, /Image Assets/)
  assert.match(editorPage, /onAttachImages\?\.\(event\.currentTarget\.files\)/)
  assert.match(editorPage, /ChatStyleSelector/)
  assert.doesNotMatch(editorPage, /transition-\[transform,opacity,height,width,max-height,border-radius,bottom,right\]/)
  assert.doesNotMatch(editorPage, /borderRadius: 999/)
  assert.doesNotMatch(editorPage, /h-14 w-14 rounded-full/)

  assert.match(editorPage, /function toStoredChatEntries\(entries: ChatEntry\[\]\): ChatEntry\[\]/)
  assert.doesNotMatch(editorPage, /metadata: _metadata/)
  assert.doesNotMatch(editorPage, /const \{ metadata: _metadata, \.\.\.storedEntry \} = entry/)

  assert.match(chatRoute, /Never reveal internal knowledge file names/)
  assert.match(chatRoute, /toKnowledgeToolPayload/)
  assert.doesNotMatch(chatRoute, /name: match\.source/)
  assert.doesNotMatch(chatRoute, /summary: 'Used local bundled PDF knowledge/)
  assert.doesNotMatch(chatRoute, /id: 'local-rag'/)

  assert.doesNotMatch(retrieval, /`File: \$\{match\.source\}`/)
  assert.doesNotMatch(retrieval, /`Chunk: \$\{match\.chunkIndex\}`/)
  assert.doesNotMatch(retrieval, /const sourceLine = `Sources:/)
}

run()
