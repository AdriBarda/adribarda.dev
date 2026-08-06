import { gsap } from './motion'

export type PointerFieldOptions = {
  /** How far the cursor's influence reaches, in px. */
  radius?: number
  /** Peak displacement toward the cursor, in px. */
  pull?: number
  /** Share of the remaining distance a node closes per 60fps frame. */
  easing?: number
  /** Same, for the smoothing applied to the cursor itself. */
  pointerEasing?: number
  /** How far a node wanders on its own, in px. */
  drift?: number
  /** Seconds a node takes to settle back when the field is stopped. */
  settle?: number
}

export type PointerField = {
  start: () => void
  stop: () => void
  destroy: () => void
}

const DEFAULTS = {
  radius: 900,
  pull: 26,
  easing: 0.03,
  pointerEasing: 0.12,
  drift: 8,
  settle: 0.7
} satisfies Required<PointerFieldOptions>

/** Far enough outside any radius that no node is influenced. */
const AWAY = -99999

const FRAME_MS = 1000 / 60
/** Clamps a long frame so a backgrounded tab doesn't resume with one huge step. */
const MAX_FRAME_MS = 100

type Node = {
  setX: (value: number) => void
  setY: (value: number) => void
  /** Rest centre, in container coordinates. */
  restX: number
  restY: number
  /** Current offset from rest. */
  x: number
  y: number
  /** Wander, randomised per node so the field never pulses in unison. */
  phase: number
  amplitude: number
  rate: number
}

/**
 * A node's own slow wander, independent of the cursor.
 */
function wanderOf(node: Node, seconds: number) {
  return {
    x: Math.sin(seconds * node.rate + node.phase) * node.amplitude,
    y: Math.cos(seconds * node.rate * 0.8 + node.phase) * node.amplitude
  }
}

/**
 * Displacement toward the cursor. Falls off as `1 - (d/r)²` — close to full
 * strength across most of the field, reaching zero only at the rim, so distant
 * nodes still move. Capped at the distance itself so a node can never overshoot
 * the cursor and oscillate around it.
 */
function attractionOf(node: Node, pointerX: number, pointerY: number, radius: number, pull: number) {
  const dx = pointerX - node.restX
  const dy = pointerY - node.restY
  const distance = Math.hypot(dx, dy)

  if (distance >= radius || distance < 0.5) return { x: 0, y: 0 }

  const ratio = distance / radius
  const force = 1 - ratio * ratio
  const magnitude = Math.min(pull * force, distance)

  return { x: (dx / distance) * magnitude, y: (dy / distance) * magnitude }
}

/**
 * Converts a per-60fps-frame easing factor into one for the frame just elapsed,
 * so the feel holds on a 120Hz display and through dropped frames.
 */
function easingFor(factor: number, deltaMs: number) {
  return 1 - (1 - factor) ** (Math.min(deltaMs, MAX_FRAME_MS) / FRAME_MS)
}

/**
 * Makes `elements` drift gently and lean toward the cursor while it is over
 * `container`. Transform only — nothing here affects layout.
 *
 * The caller owns the on/off decision, including the reduced-motion check.
 */
export function createPointerField(
  container: HTMLElement,
  elements: HTMLElement[],
  options: PointerFieldOptions = {}
): PointerField {
  const { radius, pull, easing, pointerEasing, drift, settle } = { ...DEFAULTS, ...options }

  const nodes: Node[] = elements.map((el) => ({
    setX: gsap.quickSetter(el, 'x', 'px') as (value: number) => void,
    setY: gsap.quickSetter(el, 'y', 'px') as (value: number) => void,
    restX: 0,
    restY: 0,
    x: 0,
    y: 0,
    phase: Math.random() * Math.PI * 2,
    amplitude: drift * (0.4 + Math.random() * 0.6),
    rate: 0.12 + Math.random() * 0.12
  }))

  // Raw cursor, and the smoothed cursor the field actually reads.
  let pointerX = AWAY
  let pointerY = AWAY
  let easedX = AWAY
  let easedY = AWAY
  let running = false

  // Cached: reading a rect inside the loop while also writing transforms forces
  // a synchronous layout every frame, which is the usual source of stutter.
  let bounds = container.getBoundingClientRect()
  let boundsStale = false

  function markBoundsStale() {
    boundsStale = true
  }

  /** Re-records where each node sits when undisplaced. */
  function measure() {
    bounds = container.getBoundingClientRect()

    elements.forEach((el, index) => {
      const node = nodes[index]
      const rect = el.getBoundingClientRect()
      // The rect includes the live offset, so subtract it to recover rest.
      node.restX = rect.left + rect.width / 2 - bounds.left - node.x
      node.restY = rect.top + rect.height / 2 - bounds.top - node.y
    })
  }

  /** Advances the smoothed cursor and returns it in container coordinates. */
  function trackPointer(pointerEase: number) {
    if (pointerX === AWAY) {
      easedX = AWAY
      easedY = AWAY
    } else if (easedX === AWAY) {
      easedX = pointerX
      easedY = pointerY
    } else {
      easedX += (pointerX - easedX) * pointerEase
      easedY += (pointerY - easedY) * pointerEase
    }

    return easedX === AWAY
      ? { x: AWAY, y: AWAY }
      : { x: easedX - bounds.left, y: easedY - bounds.top }
  }

  function frame(seconds: number, deltaMs: number) {
    if (boundsStale) {
      bounds = container.getBoundingClientRect()
      boundsStale = false
    }

    const ease = easingFor(easing, deltaMs)
    const pointer = trackPointer(easingFor(pointerEasing, deltaMs))

    nodes.forEach((node) => {
      const wander = wanderOf(node, seconds)
      const attraction = attractionOf(node, pointer.x, pointer.y, radius, pull)

      node.x += (wander.x + attraction.x - node.x) * ease
      node.y += (wander.y + attraction.y - node.y) * ease
      // Rounded to 1/100px: identical on screen, but it keeps the setter from
      // writing a fresh string every frame once a node has settled.
      node.setX(Math.round(node.x * 100) / 100)
      node.setY(Math.round(node.y * 100) / 100)
    })
  }

  function onPointerMove(event: PointerEvent) {
    pointerX = event.clientX
    pointerY = event.clientY
  }

  function onPointerLeave() {
    pointerX = AWAY
    pointerY = AWAY
  }

  function onResize() {
    if (running) measure()
  }

  function start() {
    if (running) return

    gsap.killTweensOf(nodes)
    measure()
    easedX = AWAY
    easedY = AWAY
    running = true

    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerleave', onPointerLeave)
    // Scrolling only moves the container's offset; rest positions inside it
    // are unchanged, so refreshing the cached rect is enough.
    window.addEventListener('scroll', markBoundsStale, { passive: true })
    gsap.ticker.add(frame)
  }

  function stop() {
    if (!running) return

    running = false
    gsap.ticker.remove(frame)
    container.removeEventListener('pointermove', onPointerMove)
    container.removeEventListener('pointerleave', onPointerLeave)
    window.removeEventListener('scroll', markBoundsStale)

    // Settle back to rest rather than snapping.
    nodes.forEach((node) => {
      gsap.to(node, {
        x: 0,
        y: 0,
        duration: settle,
        ease: 'power3.out',
        onUpdate: () => {
          node.setX(node.x)
          node.setY(node.y)
        }
      })
    })
  }

  function destroy() {
    stop()
    gsap.killTweensOf(nodes)
    window.removeEventListener('resize', onResize)
  }

  // A resize moves the rest positions themselves, not just the offset.
  window.addEventListener('resize', onResize)

  return { start, stop, destroy }
}
