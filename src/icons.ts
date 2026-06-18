// OS 기본 이모지가 투박해서, Twemoji(오픈소스, CC-BY 4.0) SVG를 CDN에서 받아
// 캔버스에 그린다. 로드 실패 시에는 기본 이모지 텍스트로 자연스럽게 폴백.

const TWEMOJI: Record<string, string> = {
  '🐝': '1f41d',
  '🍯': '1f36f',
  '🌻': '1f33b',
  '🌼': '1f33c',
  '🌷': '1f337',
  '🕸️': '1f578',
}

const BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/'

interface Entry { img: HTMLImageElement; ok: boolean }
const cache: Record<string, Entry> = {}

function get(emoji: string): Entry {
  let e = cache[emoji]
  if (e) return e
  e = { img: new Image(), ok: false }
  const code = TWEMOJI[emoji]
  if (code) {
    e.img.onload = () => { e!.ok = true }
    e.img.onerror = () => { e!.ok = false }
    e.img.src = BASE + code + '.svg'
  }
  cache[emoji] = e
  return e
}

/** 사용할 아이콘들을 미리 받아둔다. */
export function preloadIcons(emojis: string[]) {
  emojis.forEach(get)
}

/** (cx, cy)를 중심으로 size 픽셀 아이콘을 그린다. 아직 못 받았으면 기본 이모지로 폴백. */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  cx: number,
  cy: number,
  size: number,
) {
  const e = get(emoji)
  if (e.ok && e.img.complete) {
    ctx.drawImage(e.img, cx - size / 2, cy - size / 2, size, size)
  } else {
    ctx.font = `${Math.floor(size)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, cx, cy)
  }
}
