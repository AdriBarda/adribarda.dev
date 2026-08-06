import { gsap } from './motion'

export type ConfettiOptions = {
  /** Pieces launched per burst, split evenly between the two cannons. */
  pieces?: number
  /** Hard ceiling on live pieces; the oldest are dropped past it. */
  maxPieces?: number
  /** Cone centre in degrees, 90 = straight up. Mirrored for the right cannon. */
  angle?: number
  /** Cone width in degrees. */
  spread?: number
  /** Minimum gap between bursts, in ms. */
  cooldown?: number
}

export type Confetti = {
  fire: () => void
  destroy: () => void
}

const DEFAULTS = {
  pieces: 24,
  maxPieces: 120,
  angle: 62,
  spread: 50,
  cooldown: 380
} satisfies Required<ConfettiOptions>

/** Rasterise size. Above the largest piece, so nothing is ever upscaled. */
const SPRITE_PX = 96
/** Longest frame the integrator will accept, so a stall can't teleport pieces. */
const MAX_STEP = 0.033
/** How long a settled piece takes to fade out. */
const FADE_MS = 700

type Sprite = {
  sheet: HTMLCanvasElement
  aspect: number
  ready: boolean
}

type Icon = {
  light: Sprite
  dark: Sprite
}

type Piece = {
  icon: Icon
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotate: number
  spin: number
  gravity: number
  bounces: number
  /** Settles on the floor and piles up instead of dropping through. */
  stays: boolean
  /** Bounces a non-stayer gets before the floor stops catching it. */
  bounceBudget: number
  createdAt: number
  settledAt?: number
  removeAfter: number
}

/**
 * Draws an SVG once into a canvas, and hands back that canvas to blit from.
 *
 * Two things are going on. The icons ship a viewBox and nothing else, and an
 * `<img>` whose SVG has no intrinsic size renders at the UA default or not at
 * all — hence the stamped width/height, and the aspect kept so the draw doesn't
 * square them off. Then the raster: drawing an SVG-backed `<img>` re-rasterises
 * whenever the destination size changes, and every piece draws at its own random
 * size, so it would miss that cache on nearly every draw. A canvas source is a
 * plain bitmap.
 */
function rasterise(source: string): Sprite {
  const svg = new DOMParser().parseFromString(source, 'image/svg+xml')
    .documentElement as unknown as SVGElement
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  // Some icons use <use xlink:href>, invalid standalone without this.
  svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

  const [, , width = 24, height = 24] = (svg.getAttribute('viewBox') ?? '0 0 24 24')
    .split(/[\s,]+/)
    .map(Number)

  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))

  const aspect = width / height
  const sheet = document.createElement('canvas')
  sheet.width = SPRITE_PX
  sheet.height = Math.round(SPRITE_PX / aspect)

  const sprite: Sprite = { sheet, aspect, ready: false }
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`
  image
    .decode()
    .then(() => {
      sheet.getContext('2d')?.drawImage(image, 0, 0, sheet.width, sheet.height)
      sprite.ready = true
    })
    .catch(() => {})

  return sprite
}

function buildIcon({ light, dark }: { light: string; dark: string }): Icon {
  const sprite = rasterise(light)

  return { light: sprite, dark: dark === light ? sprite : rasterise(dark) }
}

/** One piece, launched from off-screen on `side` (-1 left, 1 right). */
function spawn(icon: Icon, side: -1 | 1, now: number, angle: number, spread: number): Piece {
  const size = Math.random() < 0.3 ? gsap.utils.random(48, 68) : gsap.utils.random(28, 44)
  const power = gsap.utils.random(820, 1850)
  // Both cannons aim across the screen: 90 is straight up, 0 is right.
  const aim = side < 0 ? angle : 180 - angle
  const rad = ((aim + gsap.utils.random(-spread / 2, spread / 2)) * Math.PI) / 180

  return {
    icon,
    x: side < 0 ? -size : window.innerWidth + size,
    y: (window.innerHeight * 5) / 7 + gsap.utils.random(-44, 44),
    vx: Math.cos(rad) * power,
    vy: -Math.sin(rad) * power,
    size,
    rotate: gsap.utils.random(-22, 22),
    spin: gsap.utils.random(-520, 520),
    gravity: gsap.utils.random(1350, 1750),
    bounces: 0,
    stays: Math.random() < 0.45,
    bounceBudget: gsap.utils.random(1, 3, 1),
    createdAt: now,
    removeAfter: gsap.utils.random(3000, 5000)
  }
}

/** Integrates one piece. Returns false once it has left the bottom of the view. */
function advance(piece: Piece, dt: number, now: number): boolean {
  const floor = window.innerHeight - piece.size / 2
  const minX = piece.size / 2
  const maxX = window.innerWidth - piece.size / 2
  const drag = Math.max(0, 1 - 0.42 * dt)

  piece.vx *= drag
  piece.spin *= drag
  piece.vy += piece.gravity * dt
  piece.x += piece.vx * dt
  piece.y += piece.vy * dt
  piece.rotate += piece.spin * dt

  // Only bounce off a wall the piece is actually moving into. Pieces spawn
  // off-screen, so an unguarded check fires on frame one and throws them back
  // at the edge they came from.
  const intoWall = (piece.x < minX && piece.vx < 0) || (piece.x > maxX && piece.vx > 0)

  if (intoWall) {
    piece.x = gsap.utils.clamp(minX, maxX, piece.x)
    piece.vx *= -0.38
    piece.spin *= 0.72
  }

  if (piece.y - piece.size > window.innerHeight) return false

  // Everything bounces at least once; non-stayers run out of budget and the
  // floor stops catching them, so they drop through mid-scene.
  if (piece.y > floor && (piece.stays || piece.bounces < piece.bounceBudget)) {
    piece.y = floor
    piece.vy *= -0.34
    piece.vx *= 0.62
    piece.spin *= 0.58
    piece.bounces += 1

    if (piece.stays && (Math.abs(piece.vy) < 90 || piece.bounces > 5)) {
      piece.vy = 0
      piece.vx *= 0.48
      piece.spin *= 0.48
    }
  }

  if (
    !piece.settledAt &&
    piece.stays &&
    piece.y === floor &&
    Math.abs(piece.vx) < 10 &&
    Math.abs(piece.vy) < 1 &&
    Math.abs(piece.spin) < 12 &&
    now - piece.createdAt > 650
  ) {
    piece.settledAt = now
  }

  return true
}

/** 1 until the piece's time is nearly up, then a ramp to 0. */
function fadeOf(piece: Piece, now: number): number {
  if (!piece.settledAt) return 1

  const removeAt = piece.settledAt + piece.removeAfter
  if (now <= removeAt - FADE_MS) return 1

  return Math.max(0, (removeAt - now) / FADE_MS)
}

function drawPiece(
  context: CanvasRenderingContext2D,
  piece: Piece,
  opacity: number,
  dark: boolean
) {
  const { sheet, aspect, ready } = dark ? piece.icon.dark : piece.icon.light
  const width = piece.size
  const height = piece.size / aspect

  context.save()
  context.globalAlpha = opacity
  context.translate(piece.x, piece.y)
  context.rotate((piece.rotate * Math.PI) / 180)

  if (ready) {
    context.drawImage(sheet, -width / 2, -height / 2, width, height)
  } else {
    context.fillStyle = 'oklch(74% 0.15 75)'
    context.fillRect(-width / 2, -height / 2, width, height)
  }

  context.restore()
}

/**
 * A two-cannon confetti burst on a full-viewport canvas, using `icons` (SVG
 * source per theme) as the pieces.
 *
 * The canvas is only in the document while pieces exist, and the loop only runs
 * then too. No canvas shadows anywhere: `shadowBlur` forces an offscreen pass
 * per draw call, and at this piece count it is the one thing that would cost
 * frames.
 *
 * The caller owns the decision to run at all, including the reduced-motion
 * check.
 */
export function createConfetti(
  canvas: HTMLCanvasElement,
  icons: Array<{ light: string; dark: string }>,
  options: ConfettiOptions = {}
): Confetti {
  const { pieces, maxPieces, angle, spread, cooldown } = { ...DEFAULTS, ...options }
  const context = canvas.getContext('2d')
  const built = icons.map(buildIcon)
  const live: Piece[] = []

  let lastFrame = window.performance.now()
  let lastFire = 0
  let running = false
  let destroyed = false

  function resize() {
    // Capped at 2: a 3x phone would rasterise 9x the pixels for confetti.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.ceil(window.innerWidth * dpr)
    canvas.height = Math.ceil(window.innerHeight * dpr)
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    context?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function stop() {
    running = false
    gsap.ticker.remove(frame)
    canvas.remove()
  }

  function frame() {
    if (!context) return

    const now = window.performance.now()
    const dt = Math.min((now - lastFrame) / 1000, MAX_STEP)
    lastFrame = now

    context.clearRect(0, 0, window.innerWidth, window.innerHeight)

    const dark = document.documentElement.dataset.theme === 'dark'

    for (let index = live.length - 1; index >= 0; index -= 1) {
      const piece = live[index]
      const opacity = fadeOf(piece, now)

      if (opacity <= 0 || !advance(piece, dt, now)) {
        live.splice(index, 1)
        continue
      }

      drawPiece(context, piece, opacity, dark)
    }

    if (live.length === 0) stop()
  }

  function start() {
    if (running) return

    if (!canvas.isConnected) {
      resize()
      document.body.append(canvas)
    }

    lastFrame = window.performance.now()
    running = true
    gsap.ticker.add(frame)
  }

  function onResize() {
    if (canvas.isConnected) resize()
  }

  function fire() {
    if (destroyed) return

    const now = window.performance.now()

    // One burst per cooldown. Held clicks otherwise stack bursts until
    // maxPieces discards the oldest — paying to simulate pieces that are then
    // thrown away.
    if (now - lastFire < cooldown) return
    lastFire = now

    // Fresh order each burst, so the same icons don't lead every time.
    const deck = [...built].sort(() => Math.random() - 0.5)

    for (let index = 0; index < pieces; index += 1) {
      const side = index % 2 === 0 ? -1 : 1
      live.push(spawn(deck[index % deck.length], side, now, angle, spread))
    }

    while (live.length > maxPieces) live.shift()
    start()
  }

  /** Terminal. A destroyed instance ignores `fire` rather than half-reviving. */
  function destroy() {
    destroyed = true
    stop()
    live.length = 0
    window.removeEventListener('resize', onResize)
  }

  canvas.remove()
  window.addEventListener('resize', onResize)

  return { fire, destroy }
}
