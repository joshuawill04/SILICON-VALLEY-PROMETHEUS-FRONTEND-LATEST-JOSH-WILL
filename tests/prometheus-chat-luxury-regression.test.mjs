import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const componentPath = 'components/editor/PrometheusChat.tsx'

  assert.equal(existsSync(join(root, componentPath)), true)

  const component = read(componentPath)
  const editorPage = read('app/editor/[id]/page.tsx')

  assert.match(component, /export type PrometheusChatMessage/)
  assert.match(component, /messages:\s*PrometheusChatMessage\[\]/)
  assert.match(component, /onSend:\s*\(message:\s*string\)/)
  assert.match(component, /export function PrometheusChat/)
  assert.match(component, /function SpectraNoiseFallback/)
  assert.match(component, /InlineLoadingAnimation/)
  assert.doesNotMatch(component, /function LiquidMetalFallback/)
  assert.doesNotMatch(component, /function ThinTypingLine/)
  assert.match(component, /Ask Prometheus\.\.\./)
  assert.match(component, /rounded-\[16px_16px_4px_16px\]/)
  assert.match(component, /rounded-\[4px_16px_16px_16px\]/)
  assert.match(component, /cubic-bezier\(0\.25,\s*0\.46,\s*0\.45,\s*0\.94\)/)
  assert.match(component, /rgba\(160,\s*180,\s*140,\s*0\.03\)/)
  assert.match(component, /rgba\(200,\s*170,\s*120,\s*0\.02\)/)
  assert.match(component, /thinking/i)
  assert.match(component, /demoMessages/)

  assert.doesNotMatch(component, /EDITOR RELAY/)
  assert.doesNotMatch(component, /Build something amazing/)
  assert.doesNotMatch(component, /bg-emerald|emerald-500|#267dff|prometheus-accent-cyan/)
  assert.doesNotMatch(component, /type:\s*'spring'/)
  assert.doesNotMatch(component, /loader-orb|AiResponseLoader|prometheusThinkingPulse|prometheusLiquidRipple/)

  assert.match(editorPage, /PrometheusChat/)
  assert.match(editorPage, /editorOverlayMessages/)
  assert.doesNotMatch(editorPage, /Build something amazing/)
}

run()
