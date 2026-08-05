import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

export const motionOK = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Webfonts land after first measure and move every trigger line. */
export const refreshOnFonts = () => {
  document.fonts?.ready.then(() => ScrollTrigger.refresh())
}
