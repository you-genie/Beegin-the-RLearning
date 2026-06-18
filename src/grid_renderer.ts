import type { Level, EngineResult, GridSnapshot } from './types'
import { drawIcon } from './icons'

interface Geom { cell: number; ox: number; oy: number; cols: number }

function computeGeom(canvas: HTMLCanvasElement, rows: number, cols: number): Geom {
  const pad = 24
  const cell = Math.min(
    (canvas.width - pad * 2) / cols,
    (canvas.height - pad * 2 - 16) / rows,
  )
  const ox = (canvas.width - cell * cols) / 2
  const oy = pad + 16
  return { cell, ox, oy, cols }
}

function cellCenter(g: Geom, idx: number) {
  const r = Math.floor(idx / g.cols)
  const c = idx % g.cols
  return { x: g.ox + c * g.cell + g.cell / 2, y: g.oy + r * g.cell + g.cell / 2 }
}

function heat(v: number, maxV: number): string {
  const t = maxV > 0 ? Math.max(0, Math.min(1, v / maxV)) : 0
  const r = Math.round(28 + t * 110)
  const gc = Math.round(36 + t * 170)
  const b = Math.round(58 + t * 40)
  return `rgb(${r},${gc},${b})`
}

function drawArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, cell: number, action: number) {
  const d = cell * 0.2
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]
  const [dx, dy] = dirs[action]
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - dx * d, cy - dy * d)
  ctx.lineTo(cx + dx * d, cy + dy * d)
  ctx.stroke()
  const hx = cx + dx * d
  const hy = cy + dy * d
  const px = -dy
  const py = dx
  ctx.beginPath()
  ctx.moveTo(hx, hy)
  ctx.lineTo(hx - dx * 5 + px * 4, hy - dy * 5 + py * 4)
  ctx.lineTo(hx - dx * 5 - px * 4, hy - dy * 5 - py * 4)
  ctx.closePath()
  ctx.fill()
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  g: Geom,
  layout: string[],
  snap: GridSnapshot,
  timeMs: number,
) {
  const rows = layout.length
  const cols = layout[0].length
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const maxV = Math.max(0.0001, ...snap.values)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = g.ox + c * g.cell
      const y = g.oy + r * g.cell
      const tile = layout[r][c]
      const v = snap.values[r * cols + c]
      ctx.fillStyle = tile === '#' ? '#0a0b10' : heat(v, maxV)
      ctx.fillRect(x, y, g.cell - 2, g.cell - 2)

      const cx = x + g.cell / 2 - 1
      const cy = y + g.cell / 2 - 1
      if (tile === 'H' || tile === 'F' || tile === 'W') {
        // 🌻꽃은 살짝 두근두근 (시각적 생기)
        const base = g.cell * 0.56
        const size = tile === 'F' ? base * (1 + 0.12 * Math.sin(timeMs / 280)) : base
        drawIcon(ctx, tile === 'H' ? '🍯' : tile === 'F' ? '🌻' : '🕸️', cx, cy, size)
      } else if (tile !== '#' && v > 0.01) {
        drawArrow(ctx, cx, cy, g.cell, snap.policy[r * cols + c])
      }
    }
  }
  ctx.fillStyle = '#bbbbbb'
  ctx.font = '13px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(`episode ${snap.step}`, 12, 14)
}

function drawBee(ctx: CanvasRenderingContext2D, g: Geom, x: number, y: number) {
  drawIcon(ctx, '🐝', x, y - 1, g.cell * 0.62)
}

function zeroSnap(n: number): GridSnapshot {
  return { step: 0, values: new Array(n).fill(0), policy: new Array(n).fill(0) }
}

/** 실행 전 0스텝 화면: 빈 격자 + 집에서 살랑이는 벌. cancel 함수 반환. */
export function renderGridInitial(canvas: HTMLCanvasElement, level: Level): () => void {
  const ctx = canvas.getContext('2d')!
  const env = level.engineConfig.env
  if (env.type !== 'grid') return () => {}
  const layout = env.layout
  const g = computeGeom(canvas, layout.length, layout[0].length)
  const snap = zeroSnap(layout.length * layout[0].length)
  let homeIdx = 0
  for (let i = 0; i < layout.length * layout[0].length; i++) {
    const r = Math.floor(i / layout[0].length)
    const c = i % layout[0].length
    if (layout[r][c] === 'H') homeIdx = i
  }
  let cancelled = false
  let raf = 0
  function loop() {
    if (cancelled) return
    const now = performance.now()
    drawGrid(ctx, g, layout, snap, now)
    const c = cellCenter(g, homeIdx)
    drawBee(ctx, g, c.x, c.y - Math.sin(now / 320) * g.cell * 0.05)
    raf = requestAnimationFrame(loop)
  }
  loop()
  return () => { cancelled = true; cancelAnimationFrame(raf) }
}

/**
 * 그리드 학습 결과를 애니메이션으로 그린다: Q값 히트맵 + 정책 화살표 + Q 숫자,
 * 그 뒤 벌이 탐욕 경로를 부드럽게(보간 + 꿀렁임) 따라간다.
 * getSpeed()로 속도를 실시간 반영. cancel 함수 반환.
 */
export function renderGrid(
  canvas: HTMLCanvasElement,
  level: Level,
  result: EngineResult,
  getSpeed: () => number,
): () => void {
  const ctx = canvas.getContext('2d')!
  const env = level.engineConfig.env
  if (env.type !== 'grid') return () => {}
  const layout = env.layout
  const g = computeGeom(canvas, layout.length, layout[0].length)
  const frames = result.history as GridSnapshot[]
  const rollout = result.rollout ?? []
  const lastSnap = frames[frames.length - 1]

  let cancelled = false
  let timer = 0
  let raf = 0
  let i = 0

  function historyStep() {
    if (cancelled) return
    if (i >= frames.length) { startRollout(); return }
    drawGrid(ctx, g, layout, frames[i], performance.now())
    i++
    timer = window.setTimeout(historyStep, 50 / getSpeed())
  }

  function startRollout() {
    if (rollout.length < 1) return
    if (rollout.length === 1) { idle(rollout[0]); return }
    segment(0)
  }

  function segment(k: number) {
    if (cancelled) return
    if (k >= rollout.length - 1) { idle(rollout[rollout.length - 1]); return }
    const from = cellCenter(g, rollout[k])
    const to = cellCenter(g, rollout[k + 1])
    const dur = 180 / getSpeed()
    const start = performance.now()
    function frame(now: number) {
      if (cancelled) return
      const t = Math.min(1, (now - start) / dur)
      drawGrid(ctx, g, layout, lastSnap, now)
      const x = from.x + (to.x - from.x) * t
      const y = from.y + (to.y - from.y) * t
      const bob = Math.sin(t * Math.PI * 2) * g.cell * 0.06
      drawBee(ctx, g, x, y - bob)
      if (t < 1) raf = requestAnimationFrame(frame)
      else segment(k + 1)
    }
    raf = requestAnimationFrame(frame)
  }

  function idle(idx: number) {
    if (cancelled) return
    const now = performance.now()
    drawGrid(ctx, g, layout, lastSnap, now)
    const c = cellCenter(g, idx)
    drawBee(ctx, g, c.x, c.y - Math.abs(Math.sin(now / 260)) * g.cell * 0.08)
    raf = requestAnimationFrame(() => idle(idx))
  }

  historyStep()
  return () => { cancelled = true; clearTimeout(timer); cancelAnimationFrame(raf) }
}
