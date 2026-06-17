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
const docsBox = $('docs-box')
const levelNav = $('level-nav')
const canvas = $('canvas') as HTMLCanvasElement
const status = $('status')
const hintBox = $('hint-box')
const recapBox = $('recap-box')
const runBtn = $('run-btn') as HTMLButtonElement
const hintBtn = $('hint-btn') as HTMLButtonElement
const nextBtn = $('next-btn') as HTMLButtonElement

const editor = createEditor(editorPane, levels[0].codeTemplate)

// 레벨 네비게이션 버튼 (아무 레벨이나 자유롭게 이동)
const navButtons: HTMLButtonElement[] = levels.map((lv, i) => {
  const btn = document.createElement('button')
  btn.className = 'level-btn'
  btn.textContent = `Lv ${lv.id}`
  btn.addEventListener('click', () => loadLevel(i))
  levelNav.appendChild(btn)
  return btn
})

function renderDocs(lv: Level) {
  const rows = lv.docs
    .map(
      (d) =>
        `<div><code>${d.key}</code> <span class="docs-desc">— ${d.desc}</span></div>`,
    )
    .join('')
  docsBox.innerHTML =
    `<div class="docs-title">📖 reward(obs) 에서 쓸 수 있는 값</div>${rows}`
}

function loadLevel(index: number) {
  current = index
  const lv = levels[index]
  hintIndex = 0
  hintBtn.disabled = false
  cancelRender?.()
  $('level-title').textContent = `Lv ${lv.id} — ${lv.title}`
  $('show-panel').textContent = lv.showDemo
  editor.setValue(lv.codeTemplate)
  renderDocs(lv)
  navButtons.forEach((b, i) => b.classList.toggle('active', i === index))
  status.textContent = ''
  status.className = ''
  hintBox.textContent = ''
  recapBox.className = ''
  recapBox.textContent = ''
  nextBtn.disabled = true
  nextBtn.textContent = '다음 레벨 →'
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
      if (current < levels.length - 1) {
        nextBtn.disabled = false
      } else {
        // 마지막 레벨 클리어 — 다음 챕터는 아직 없음
        nextBtn.disabled = true
        nextBtn.textContent = '🎉 챕터 1 완주!'
        status.textContent += ' — 🎉 챕터 1 완주! 다음 챕터는 준비 중이에요 🐝'
      }
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
  if (current < levels.length - 1) loadLevel(current + 1)
}

runBtn.addEventListener('click', onRun)
hintBtn.addEventListener('click', onHint)
nextBtn.addEventListener('click', onNext)

loadLevel(0)
preloadRuntime() // 백그라운드로 Pyodide 미리 로드
