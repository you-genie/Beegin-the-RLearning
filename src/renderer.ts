import type { Level, EngineResult, BanditSnapshot } from './types'

/**
 * 밴딧 결과를 캔버스에 애니메이션으로 그린다.
 * 꽃밭별 추정 가치 막대 + 선택 횟수. 최고 꽃밭은 노랗게 강조.
 * 이전 애니메이션을 멈출 수 있게 cancel 함수를 반환.
 */
export function renderBandit(
  canvas: HTMLCanvasElement,
  level: Level,
  result: EngineResult,
): () => void {
  const ctx = canvas.getContext('2d')!
  const env = level.engineConfig.env
  if (env.type !== 'bandit') return () => {}
  const arms = env.arms
  const bestArm = result.bestArm ?? -1
  const frames = result.history as BanditSnapshot[]
  let i = 0
  let timer = 0

  function drawFrame(snap: BanditSnapshot) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const n = arms.length
    const pad = 40
    const slot = (canvas.width - pad * 2) / n
    const maxEst = Math.max(0.1, ...snap.estimates)
    const baseY = canvas.height - 70
    const maxH = canvas.height - 150

    for (let a = 0; a < n; a++) {
      const x = pad + a * slot
      const h = (snap.estimates[a] / maxEst) * maxH
      const isBest = a === bestArm
      ctx.fillStyle = isBest ? '#ffcf33' : '#7ec8e3'
      ctx.fillRect(x + 12, baseY - h, slot - 24, h)

      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.font = '30px sans-serif'
      ctx.fillText(arms[a].emoji, x + slot / 2, baseY + 34)
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

  function step() {
    if (i >= frames.length) return
    drawFrame(frames[i])
    i++
    if (i < frames.length) {
      timer = window.setTimeout(step, 50)
    }
  }
  step()

  return () => window.clearTimeout(timer)
}
