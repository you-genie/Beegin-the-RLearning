import './style.css'
import { chapter1 } from './levels/chapter1'
import { chapter2 } from './levels/chapter2'
import { chapter3 } from './levels/chapter3'
import { createEditor } from './monaco'
import { runTraining, preloadRuntime } from './runtime'
import { renderBandit, renderBanditInitial } from './renderer'
import { renderGrid, renderGridInitial } from './grid_renderer'
import { isCleared } from './scoring'
import { preloadIcons } from './icons'
import type { Level } from './types'

preloadIcons(['🐝', '🍯', '🌻', '🌼', '🌷', '🕸️'])

const levels: Level[] = [...chapter1, ...chapter2, ...chapter3]
let current = 0
let hintIndex = 0
let cancelRender: (() => void) | null = null
let speed = 1
let iterMult = 1
const getSpeed = () => speed

// 모든 DOM 이모지를 Twemoji 아이콘으로 교체 (에디터는 건드리지 않음)
const EMOJI_TARGETS = [
  'topbar', 'level-nav', 'show-panel', 'docs-box', 'status',
  'recap-box', 'hint-box', 'legend', 'editor-controls', 'iter-row', 'speed-row',
]
function refreshEmoji() {
  const tw = (window as any).twemoji
  if (!tw) return
  for (const id of EMOJI_TARGETS) {
    const el = document.getElementById(id)
    if (el) {
      tw.parse(el, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/',
      })
    }
  }
}

const LEGEND: Record<string, string> = {
  grid:
    '칸 색 = <b>Q값</b>(밝을수록 목표에 가까워 가치가 큼) · 화살표 = <b>정책</b>(그 칸에서 갈 방향)',
  bandit:
    '막대 높이 = 각 꽃밭의 <b>추정 가치</b>(클수록 좋다고 학습) · 노란 막대 = 진짜 최고 꽃밭',
}

const $ = (id: string) => document.getElementById(id)!
const editorPane = $('editor-pane')
const docsBox = $('docs-box')
const levelNav = $('level-nav')
const legend = $('legend')
const concept = $('concept')
const canvas = $('canvas') as HTMLCanvasElement
const status = $('status')
const hintBox = $('hint-box')
const recapBox = $('recap-box')
const runBtn = $('run-btn') as HTMLButtonElement
const hintBtn = $('hint-btn') as HTMLButtonElement
const nextBtn = $('next-btn') as HTMLButtonElement
const speedInput = $('speed') as HTMLInputElement
const speedVal = $('speed-val')
const iterInput = $('iter') as HTMLInputElement
const iterVal = $('iter-val')

speedInput.addEventListener('input', () => {
  speed = parseFloat(speedInput.value)
  speedVal.textContent = `×${speed.toFixed(2)}`
})
iterInput.addEventListener('input', () => {
  iterMult = parseFloat(iterInput.value)
  iterVal.textContent = `×${iterMult.toFixed(1)}`
})

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
  concept.textContent = `🎯 ${lv.concept}`
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
  legend.innerHTML = LEGEND[lv.engineConfig.env.type]
  // 실행 전 0스텝 화면 (빈 상태 + 살랑이는 벌)
  cancelRender =
    lv.engineConfig.env.type === 'grid'
      ? renderGridInitial(canvas, lv)
      : renderBanditInitial(canvas, lv)
  refreshEmoji()
}

async function onRun() {
  const lv = levels[current]
  runBtn.disabled = true
  status.className = ''
  status.textContent = '⏳ 학습 중... (첫 실행은 Python 로딩에 몇 초 걸려요)'
  refreshEmoji()
  try {
    // 시행 횟수 슬라이더로 학습량(난이도) 조절
    const cfg = { ...lv.engineConfig }
    if (cfg.trainSteps) cfg.trainSteps = Math.round(cfg.trainSteps * iterMult)
    if (cfg.episodes) cfg.episodes = Math.round(cfg.episodes * iterMult)
    const result = await runTraining(editor.getValue(), cfg)
    if (!result.ok) {
      status.className = 'fail'
      status.textContent = '⚠️ ' + result.error
      return
    }
    cancelRender?.()
    cancelRender =
      lv.engineConfig.env.type === 'grid'
        ? renderGrid(canvas, lv, result, getSpeed)
        : renderBandit(canvas, lv, result, getSpeed)
    const pct = Math.round(result.successRate * 100)
    const threshPct = Math.round(lv.successThreshold * 100)
    if (isCleared(result, lv.successThreshold)) {
      status.className = 'pass'
      status.textContent = `✅ 클리어! 성공률 ${pct}% (기준 ${threshPct}%)`
      recapBox.textContent = lv.recap
      recapBox.className = 'show'
      if (current < levels.length - 1) {
        nextBtn.disabled = false
      } else {
        // 마지막 레벨 클리어 — 다음 챕터는 아직 없음
        nextBtn.disabled = true
        nextBtn.textContent = '🎉 다 깼어요!'
        status.textContent += ' — 🎉 마지막 레벨 완주! 다음 챕터는 준비 중이에요 🐝'
      }
    } else {
      status.className = 'fail'
      status.textContent = `❌ 아직이에요. 성공률 ${pct}% (기준 ${threshPct}%) — 보상을 다시 손봐요.`
    }
  } finally {
    runBtn.disabled = false
    refreshEmoji()
  }
}

function onHint() {
  const lv = levels[current]
  if (hintIndex < lv.hints.length) {
    hintBox.textContent += (hintBox.textContent ? '\n' : '') + '💡 ' + lv.hints[hintIndex]
    hintIndex++
  }
  if (hintIndex >= lv.hints.length) hintBtn.disabled = true
  refreshEmoji()
}

function onNext() {
  if (current < levels.length - 1) loadLevel(current + 1)
}

runBtn.addEventListener('click', onRun)
hintBtn.addEventListener('click', onHint)
nextBtn.addEventListener('click', onNext)

loadLevel(0)
preloadRuntime() // 백그라운드로 Pyodide 미리 로드
