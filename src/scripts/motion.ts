import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

export const motionOK = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Webfonts land after first measure and move every trigger line. */
export const refreshOnFonts = () => {
  document.fonts?.ready.then(() => ScrollTrigger.refresh())
}

// ponytail: no registry, no teardown — one page, one load. If View Transitions
// land, wrap each caller in gsap.context() and revert on astro:before-swap.
