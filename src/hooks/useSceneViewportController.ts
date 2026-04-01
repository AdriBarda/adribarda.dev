import { useEffect, useRef, useState, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SceneNavSlide, SceneTone } from '../theme/sceneTheme'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

const DEFAULT_CARD_SCROLL_TRIGGER = {
  start: 'top 92%',
  end: 'bottom 8%',
  scrub: 0.85
} as const

const DEFAULT_CARD_MOTION = {
  enterY: 42,
  enterScale: 0.965,
  enterOpacity: 0.78,
  enterDuration: 0.54,
  exitY: -20,
  exitScale: 0.988,
  exitOpacity: 0.94,
  exitDuration: 0.46
} as const

const STACKED_BENTO_MOTION = {
  start: 'top 82%',
  end: 'center 62%',
  scrub: 0.55,
  leftY: 84,
  rightY: 132,
  leftStart: 0,
  leftDuration: 0.9,
  rightStart: 0.68,
  rightDuration: 0.32,
  leftEase: 'none',
  rightEase: 'none'
} as const

const EXPERIENCE_BENTO_MOTION = {
  start: 'top 84%',
  end: 'top 26%',
  scrub: 0.48,
  leftY: 88,
  rightY: 136,
  leftStart: 0.08,
  leftDuration: 0.82,
  rightStart: 0.52,
  rightDuration: 0.26,
  leftEase: 'none',
  rightEase: 'none'
} as const

const HERO_BENTO_MOTION = {
  heroY: 56,
  leftY: 88,
  rightY: 152,
  heroStart: 0.04,
  leftStart: 0.08,
  rightStart: 0.34,
  heroDuration: 0.2,
  leftDuration: 0.18,
  rightDuration: 0.18,
  settleDuration: 0.62
} as const

export type { SceneNavSlide, SceneTone }

type BentoRole = 'hero' | 'left' | 'right'

interface Options {
  viewportRef: RefObject<HTMLDivElement | null>
  trackRef: RefObject<HTMLDivElement | null>
  onSlideProgressChange?: (progresses: number[]) => void
}

export function useSceneViewportController({
  viewportRef,
  trackRef,
  onSlideProgressChange
}: Options) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  const goToRef = useRef<(index: number) => void>(() => {})

  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current

    if (!track || !viewport) {
      return
    }

    const getSlides = () => Array.from(track.querySelectorAll<HTMLElement>('[data-scene-slide]'))

    const setCurrentIndex = (nextIndex: number) => {
      if (nextIndex === activeIndexRef.current) {
        return
      }

      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)
    }

    activeIndexRef.current = 0
    setActiveIndex(0)

    const mm = gsap.matchMedia()

    mm.add('(min-width: 768px)', () => {
      const slideTargets = getSlides().map((slide) => ({
        slide,
        target: slide.firstElementChild instanceof HTMLElement ? slide.firstElementChild : slide
      }))
      const slideProgresses = new Array(slideTargets.length).fill(0)

      if (!slideTargets.length) {
        return
      }

      let scrollTween: gsap.core.Tween | null = null

      const notifySlideProgressChange = () => {
        onSlideProgressChange?.([...slideProgresses])
      }

      slideTargets.forEach(({ slide, target }, index) => {
        const cardTargets = getAnimatedCards(target)
        const timelineItems = Array.from(target.querySelectorAll<HTMLElement>('[data-experience-timeline-item]'))

        const animatedCards = cardTargets.length ? cardTargets : [target]
        const bentoCards = animatedCards.flatMap((card) => {
          const role = getBentoRole(card)

          return role ? [{ card, role }] : []
        })
        const isBento = bentoCards.length > 0
        const hasExperienceTimeline = target.hasAttribute('data-experience-section') && timelineItems.length > 1
        const slideProgressHandlers = createSlideProgressHandlers(index, slideProgresses, notifySlideProgressChange, setCurrentIndex)

        if (hasExperienceTimeline) {
          ScrollTrigger.create({
            trigger: slide,
            scroller: viewport,
            start: DEFAULT_CARD_SCROLL_TRIGGER.start,
            end: DEFAULT_CARD_SCROLL_TRIGGER.end,
            scrub: DEFAULT_CARD_SCROLL_TRIGGER.scrub,
            invalidateOnRefresh: true,
            ...slideProgressHandlers
          })
        }

        if (isBento) {
          const heroCards = bentoCards.filter(({ role }) => role === 'hero').map(({ card }) => card)
          const leftCards = bentoCards.filter(({ role }) => role === 'left').map(({ card }) => card)
          const rightCards = bentoCards.filter(({ role }) => role === 'right').map(({ card }) => card)

          if (!heroCards.length) {
            const stackedMotion = hasExperienceTimeline ? EXPERIENCE_BENTO_MOTION : STACKED_BENTO_MOTION

            gsap.set(leftCards, { clearProps: 'transform' })

            const bentoTimeline = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: slide,
                scroller: viewport,
                start: stackedMotion.start,
                end: stackedMotion.end,
                scrub: stackedMotion.scrub,
                invalidateOnRefresh: true
              }
            })

            leftCards.forEach((card, leftIndex) => {
              bentoTimeline.fromTo(
                card,
                {
                  y: stackedMotion.leftY + leftIndex * 8,
                  force3D: true
                },
                {
                  y: 0,
                  duration: stackedMotion.leftDuration,
                  ease: stackedMotion.leftEase
                },
                stackedMotion.leftStart
              )
            })

            rightCards.forEach((card, rightIndex) => {
              bentoTimeline.fromTo(
                card,
                {
                  y: stackedMotion.rightY + (hasExperienceTimeline ? 0 : rightIndex * 16),
                  force3D: true
                },
                {
                  y: 0,
                  duration: stackedMotion.rightDuration,
                  ease: stackedMotion.rightEase
                },
                stackedMotion.rightStart
              )
            })

            return
          }

          const timeline = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: slide,
              scroller: viewport,
              start: DEFAULT_CARD_SCROLL_TRIGGER.start,
              end: DEFAULT_CARD_SCROLL_TRIGGER.end,
              scrub: DEFAULT_CARD_SCROLL_TRIGGER.scrub,
              invalidateOnRefresh: true,
              ...slideProgressHandlers
            }
          })

          heroCards.forEach((card) => {
            timeline.set(card, { y: HERO_BENTO_MOTION.heroY, force3D: true }, 0)
            timeline.to(card, { y: 0, duration: HERO_BENTO_MOTION.heroDuration }, HERO_BENTO_MOTION.heroStart)
          })

          leftCards.forEach((card) => {
            timeline.set(card, { y: HERO_BENTO_MOTION.leftY, force3D: true }, 0)
            timeline.to(card, { y: 0, duration: HERO_BENTO_MOTION.leftDuration }, HERO_BENTO_MOTION.leftStart)
          })

          rightCards.forEach((card) => {
            timeline.set(card, { y: HERO_BENTO_MOTION.rightY, force3D: true }, 0)
            timeline.to(card, { y: 0, duration: HERO_BENTO_MOTION.rightDuration }, HERO_BENTO_MOTION.rightStart)
          })

          timeline.to({}, { duration: HERO_BENTO_MOTION.settleDuration })
          return
        }

        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: slide,
            scroller: viewport,
            start: DEFAULT_CARD_SCROLL_TRIGGER.start,
            end: DEFAULT_CARD_SCROLL_TRIGGER.end,
            scrub: DEFAULT_CARD_SCROLL_TRIGGER.scrub,
            invalidateOnRefresh: true,
            ...slideProgressHandlers
          }
        })

        animatedCards.forEach((card, cardIndex) => {
          const offset = card === target ? 0 : cardIndex * 0.04

          timeline
            .fromTo(
              card,
              {
                y: DEFAULT_CARD_MOTION.enterY,
                scale: DEFAULT_CARD_MOTION.enterScale,
                opacity: DEFAULT_CARD_MOTION.enterOpacity,
                transformOrigin: 'center center',
                force3D: true
              },
              {
                y: 0,
                scale: 1,
                opacity: 1,
                duration: DEFAULT_CARD_MOTION.enterDuration
              },
              offset
            )
            .to(
              card,
              {
                y: DEFAULT_CARD_MOTION.exitY,
                scale: DEFAULT_CARD_MOTION.exitScale,
                opacity: DEFAULT_CARD_MOTION.exitOpacity,
                duration: DEFAULT_CARD_MOTION.exitDuration
              },
              DEFAULT_CARD_MOTION.enterDuration + offset
            )
        })
      })

      goToRef.current = (nextIndex: number) => {
        const slide = slideTargets[nextIndex]?.slide

        if (!slide) {
          return
        }

        setCurrentIndex(nextIndex)
        scrollTween?.kill()
        scrollTween = gsap.to(viewport, {
          scrollTo: { y: slide.offsetTop, autoKill: false },
          duration: 0.9,
          ease: 'power2.out',
          overwrite: 'auto'
        })
      }

      ScrollTrigger.refresh()
      notifySlideProgressChange()

      return () => {
        scrollTween?.kill()
        goToRef.current = () => {}
      }
    })

    return () => {
      goToRef.current = () => {}
      mm.revert()
    }
  }, [onSlideProgressChange, trackRef, viewportRef])

  return {
    activeIndex,
    goTo(index: number) {
      goToRef.current(index)
    }
  }
}

function getBentoRole(card: HTMLElement): BentoRole | null {
  const role = card.dataset.bentoRole

  if (role === 'hero' || role === 'left' || role === 'right') {
    return role
  }

  return null
}

function getAnimatedCards(target: HTMLElement) {
  const directCardTargets = target.matches('[data-glass-card]')
    ? [target]
    : Array.from(target.querySelectorAll<HTMLElement>(':scope > [data-glass-card]'))

  if (directCardTargets.length > 0) {
    return directCardTargets
  }

  return Array.from(target.querySelectorAll<HTMLElement>(':scope > [data-experience-pin] > [data-glass-card]'))
}

function createSlideProgressHandlers(
  index: number,
  slideProgresses: number[],
  notifySlideProgressChange: () => void,
  setCurrentIndex: (nextIndex: number) => void
) {
  return {
    onUpdate: (self: ScrollTrigger) => {
      slideProgresses[index] = self.progress
      notifySlideProgressChange()
    },
    onEnter: () => setCurrentIndex(index),
    onEnterBack: () => setCurrentIndex(index)
  }
}
