import type { Level, EngineResult, GridSnapshot } from './types'

/**
 * 그리드 결과를 캔버스에 그린다.
 * 칸별 maxQ를 색(히트맵)으로, 최적 행동을 화살표로 보여주고,
 * 학습이 진행되는 과정을 애니메이션으로 재생한 뒤 벌이 탐욕 경로를 따라가는 걸 보여준다.
 * 멈출 수 있게 cancel 함수를 반환.
 */
export function renderGrid(
  canvas: HTMLCanvasElement,
  level: Level,
  result: EngineResult,
): () => void {
  const ctx = canvas.getContext('2d')!
  const env = level.engineConfig.env
  if (env.type !== 'grid') return () => {}
  const layout = env.layout
  const rows = layout.length
  const cols = layout[0].length
  const frames = result.history as GridSnapshot[]
  const rollout = result.rollout ?? []

  const pad = 24
  const cell = Math.min(
    (canvas.width - pad * 2) / cols,
    (canvas.height - pad * 2 - 16) / rows,
  )
  const ox = (canvas.width - cell * cols) / 2
  const oy = pad + 16

  const cellOf = (idx: number) => ({ r: Math.floor(idx / cols), c: idx % cols })
  const ch = (r: number, c: number) => layout[r][c]

  function heat(v: number, maxV: number): string {
    const t = maxV > 0 ? Math.max(0, Math.min(1, v / maxV)) : 0
    const r = Math.round(30 + t * 120)
    const g = Math.round(40 + t * 160)
    const b = Math.round(60 + t * 30)
    return `rgb(${r},${g},${b})`
  }

  function arrow(cx: number, cy: number, action: number) {
    const d = cell * 0.22
    const dirs = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]
    const [dx, dy] = dirs[action]
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx - dx * d, cy - dy * d)
    ctx.lineTo(cx + dx * d, cy + dy * d)
    ctx.stroke()
    ctx.beginPath()
    const hx = cx + dx * d
    const hy = cy + dy * d
    const px = -dy
    const py = dx
    ctx.moveTo(hx, hy)
    ctx.lineTo(hx - dx * 5 + px * 4, hy - dy * 5 + py * 4)
    ctx.lineTo(hx - dx * 5 - px * 4, hy - dy * 5 - py * 4)
    ctx.closePath()
    ctx.fill()
  }

  function drawGrid(snap: GridSnapshot) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const maxV = Math.max(0.0001, ...snap.values)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * cell
        const y = oy + r * cell
        const tile = ch(r, c)
        if (tile === '#') {
          ctx.fillStyle = '#0a0b10'
        } else {
          ctx.fillStyle = heat(snap.values[r * cols + c], maxV)
        }
        ctx.fillRect(x, y, cell - 2, cell - 2)

        const cx = x + cell / 2 - 1
        const cy = y + cell / 2 - 1
        if (tile === 'H' || tile === 'F' || tile === 'W') {
          ctx.font = `${Math.floor(cell * 0.5)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            tile === 'H' ? '🏠' : tile === 'F' ? '🌸' : '🕸️',
            cx,
            cy,
          )
        } else if (tile !== '#') {
          arrow(cx, cy, snap.policy[r * cols + c])
        }
      }
    }
    ctx.fillStyle = '#bbbbbb'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(`episode ${snap.step}`, 12, 14)
  }

  function drawBee(idx: number) {
    const { r, c } = cellOf(idx)
    const cx = ox + c * cell + cell / 2 - 1
    const cy = oy + r * cell + cell / 2 - 1
    ctx.font = `${Math.floor(cell * 0.55)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🐝', cx, cy)
  }

  let i = 0
  let timer = 0
  let cancelled = false
  const lastSnap = frames[frames.length - 1]

  function playRollout(k: number) {
    if (cancelled || k >= rollout.length) return
    drawGrid(lastSnap)
    drawBee(rollout[k])
    timer = window.setTimeout(() => playRollout(k + 1), 180)
  }

  function step() {
    if (cancelled) return
    if (i >= frames.length) {
      playRollout(0)
      return
    }
    drawGrid(frames[i])
    i++
    timer = window.setTimeout(step, 50)
  }
  step()

  return () => {
    cancelled = true
    window.clearTimeout(timer)
  }
}
