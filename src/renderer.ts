import type { Level, EngineResult, BanditSnapshot, ArmConfig } from './types'

function drawBanditFrame(
  ctx: CanvasRenderingContext2D,
  arms: ArmConfig[],
  snap: BanditSnapshot,
  bestArm: number,
  timeMs: number,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const n = arms.length
  const pad = 40
  const slot = (ctx.canvas.width - pad * 2) / n
  const maxEst = Math.max(0.1, ...snap.estimates)
  const baseY = ctx.canvas.height - 70
  const maxH = ctx.canvas.height - 150

  for (let a = 0; a < n; a++) {
    const x = pad + a * slot
    const h = (snap.estimates[a] / maxEst) * maxH
    const isBest = a === bestArm
    // 최고 꽃밭은 살짝 반짝이게
    if (isBest) {
      const glow = 0.75 + 0.25 * Math.sin(timeMs / 220)
      ctx.fillStyle = `rgba(255, 207, 51, ${glow})`
    } else {
      ctx.fillStyle = '#7ec8e3'
    }
    ctx.fillRect(x + 12, baseY - h, slot - 24, h)

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const wiggle = isBest ? Math.sin(timeMs / 240) * 3 : 0
    ctx.font = '30px sans-serif'
    ctx.fillText(arms[a].emoji, x + slot / 2, baseY + 34 + wiggle)
    ctx.font = '13px sans-serif'
    ctx.fillText(arms[a].label, x + slot / 2, baseY + 54)
    ctx.fillText(`추정 ${snap.estimates[a].toFixed(2)}`, x + slot / 2, baseY - h - 18)
    ctx.fillText(`선택 ${snap.counts[a]}회`, x + slot / 2, baseY - h - 4)
  }

  ctx.fillStyle = '#bbbbbb'
  ctx.font = '13px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`step ${snap.step}`, 12, 20)
}

/** 실행 전 0스텝 화면: 추정 0인 꽃밭들. cancel 함수 반환(반짝임 유지). */
export function renderBanditInitial(canvas: HTMLCanvasElement, level: Level): () => void {
  const ctx = canvas.getContext('2d')!
  const env = level.engineConfig.env
  if (env.type !== 'bandit') return () => {}
  const arms = env.arms
  const snap: BanditSnapshot = {
    step: 0,
    estimates: new Array(arms.length).fill(0),
    counts: new Array(arms.length).fill(0),
  }
  let cancelled = false
  let raf = 0
  function loop() {
    if (cancelled) return
    drawBanditFrame(ctx, arms, snap, -1, performance.now())
    raf = requestAnimationFrame(loop)
  }
  loop()
  return () => { cancelled = true; cancelAnimationFrame(raf) }
}

/**
 * 밴딧 학습 결과를 애니메이션으로 그린다. 꽃밭별 추정 가치 막대 + 선택 횟수.
 * 최고 꽃밭은 노랗게 반짝. getSpeed()로 속도 실시간 반영. cancel 함수 반환.
 */
export function renderBandit(
  canvas: HTMLCanvasElement,
  level: Level,
  result: EngineResult,
  getSpeed: () => number,
): () => void {
  const ctx = canvas.getContext('2d')!
  const env = level.engineConfig.env
  if (env.type !== 'bandit') return () => {}
  const arms = env.arms
  const bestArm = result.bestArm ?? -1
  const frames = result.history as BanditSnapshot[]
  let i = 0
  let timer = 0
  let raf = 0
  let cancelled = false

  function step() {
    if (cancelled) return
    if (i >= frames.length) { shimmer(); return }
    drawBanditFrame(ctx, arms, frames[i], bestArm, performance.now())
    i++
    timer = window.setTimeout(step, 50 / getSpeed())
  }
  // 학습이 끝나면 마지막 프레임에서 최고 꽃밭이 계속 반짝이게
  function shimmer() {
    if (cancelled) return
    drawBanditFrame(ctx, arms, frames[frames.length - 1], bestArm, performance.now())
    raf = requestAnimationFrame(shimmer)
  }
  step()

  return () => { cancelled = true; clearTimeout(timer); cancelAnimationFrame(raf) }
}
