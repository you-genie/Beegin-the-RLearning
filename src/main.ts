import './style.css'
import { chapter1 } from './levels/chapter1'
import { createEditor } from './monaco'
import { runTraining, preloadRuntime } from './runtime'
import { renderBandit } from './renderer'
import { isCleared } from './scoring'
import type { Level } from './types'

const levels: Level[] = chapter1
let current = 0
let hintIndex = 0
let cancelRender: (() => void) | null = null

const $ = (id: string) => document.getElementById(id)!
const editorPane = $('editor-pane')
const canvas = $('canvas') as HTMLCanvasElement
const status = $('status')
const hintBox = $('hint-box')
const recapBox = $('recap-box')
const runBtn = $('run-btn') as HTMLButtonElement
const hintBtn = $('hint-btn') as HTMLButtonElement
const nextBtn = $('next-btn') as HTMLButtonElement

const editor = createEditor(editorPane, levels[0].codeTemplate)

function loadLevel(index: number) {
  const lv = levels[index]
  hintIndex = 0
  cancelRender?.()
  $('level-title').textContent = `Lv ${lv.id} — ${lv.title}`
  $('show-panel').textContent = lv.showDemo
  editor.setValue(lv.codeTemplate)
  status.textContent = ''
  status.className = ''
  hintBox.textContent = ''
  recapBox.className = ''
  recapBox.textContent = ''
  nextBtn.disabled = true
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

async function onRun() {
  const lv = levels[current]
  runBtn.disabled = true
  status.className = ''
  status.textContent = '⏳ 학습 중... (첫 실행은 Python 로딩에 몇 초 걸려요)'
  try {
    const result = await runTraining(editor.getValue(), lv.engineConfig)
    if (!result.ok) {
      status.className = 'fail'
      status.textContent = '⚠️ ' + result.error
      return
    }
    cancelRender?.()
    cancelRender = renderBandit(canvas, lv, result)
    const pct = Math.round(result.successRate * 100)
    if (isCleared(result, lv.successThreshold)) {
      status.className = 'pass'
      status.textContent = `✅ 클리어! 최고 꽃밭 선택률 ${pct}% (기준 ${Math.round(
        lv.successThreshold * 100,
      )}%)`
      recapBox.textContent = lv.recap
      recapBox.className = 'show'
      nextBtn.disabled = current >= levels.length - 1
    } else {
      status.className = 'fail'
      status.textContent = `❌ 아직이에요. 선택률 ${pct}% (기준 ${Math.round(
        lv.successThreshold * 100,
      )}%) — 보상을 다시 손봐요.`
    }
  } finally {
    runBtn.disabled = false
  }
}

function onHint() {
  const lv = levels[current]
  if (hintIndex < lv.hints.length) {
    hintBox.textContent += (hintBox.textContent ? '\n' : '') + '💡 ' + lv.hints[hintIndex]
    hintIndex++
  }
  if (hintIndex >= lv.hints.length) hintBtn.disabled = true
}

function onNext() {
  if (current < levels.length - 1) {
    current++
    hintBtn.disabled = false
    loadLevel(current)
  }
}

runBtn.addEventListener('click', onRun)
hintBtn.addEventListener('click', onHint)
nextBtn.addEventListener('click', onNext)

loadLevel(0)
preloadRuntime() // 백그라운드로 Pyodide 미리 로드
