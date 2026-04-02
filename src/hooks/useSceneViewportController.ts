import { useEffect, useRef, type RefObject } from 'react'
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
  enterDuration: 0.54,
  exitY: -20,
  exitScale: 0.988,
  exitDuration: 0.46
} as const

const SPLIT_BENTO_MOTION = {
  start: 'top 84%',
  end: 'top 26%',
  scrub: 0.52,
  leftY: 112,
  rightY: 164,
  leftStart: 0,
  leftDuration: 0.68,
  rightStart: 0.22,
  rightDuration: 0.9,
  leftEase: 'none',
  rightEase: 'none'
} as const

const ENTRY_SPLIT_MOTION = {
  start: 'top 102%',
  end: '+=260',
  scrub: 0.52
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

const EXPERIENCE_BENTO_TRIGGER = {
  start: 'top 88%',
  end: 'top 24%',
  scrub: 0.55
} as const

const NAV_DIRECTIONAL_OFFSET = 0.04

export type { SceneNavSlide, SceneTone }

type BentoRole = 'hero' | 'left' | 'right'

interface Options {
  viewportRef: RefObject<HTMLDivElement | null>
  trackRef: RefObject<HTMLDivElement | null>
  onSlideProgressChange?: (progresses: number[]) => void
  onActiveIndexChange?: (index: number) => void
}

export function useSceneViewportController({
  viewportRef,
  trackRef,
  onSlideProgressChange,
  onActiveIndexChange
}: Options) {
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
      onActiveIndexChange?.(nextIndex)
    }

    activeIndexRef.current = 0
    onActiveIndexChange?.(0)

    const mm = gsap.matchMedia()

    mm.add('(min-width: 768px)', () => {
      const slideTargets = getSlides().map((slide) => ({
        slide,
        target: slide.firstElementChild instanceof HTMLElement ? slide.firstElementChild : slide
      }))
      const navFocusTargets = slideTargets.map(({ target }) => getNavFocusTarget(target))

      if (!slideTargets.length) {
        return
      }

      let scrollTween: gsap.core.Tween | null = null
      let navStateTrigger: ScrollTrigger | null = null
      let navDirection: 1 | -1 = 1
      let lastViewportCenter = viewport.scrollTop + viewport.clientHeight / 2
      let navPeakAnchors = navFocusTargets.map((target) => getNavAnchorPosition(target, track))
      let navReleaseAnchors = slideTargets.map(({ target }, index) => getNavReleaseAnchor(target, navFocusTargets[index], track, viewport))
      let navScrollEndAnchor = Math.max(viewport.scrollHeight - viewport.clientHeight / 2, 0)

      const syncNavMetrics = () => {
        navPeakAnchors = navFocusTargets.map((target) => getNavAnchorPosition(target, track))
        navReleaseAnchors = slideTargets.map(({ target }, index) => getNavReleaseAnchor(target, navFocusTargets[index], track, viewport))
        navScrollEndAnchor = Math.max(viewport.scrollHeight - viewport.clientHeight / 2, 0)
      }

      const syncNavState = () => {
        const viewportCenter = viewport.scrollTop + viewport.clientHeight / 2

        if (viewportCenter !== lastViewportCenter) {
          navDirection = viewportCenter > lastViewportCenter ? 1 : -1
          lastViewportCenter = viewportCenter
        }

        const strengths = getNavStrengths(viewportCenter, navPeakAnchors, navReleaseAnchors, navScrollEndAnchor, navDirection)

        onSlideProgressChange?.(strengths)

        const mostProminentIndex = getMostProminentIndex(strengths)

        if (mostProminentIndex !== null) {
          setCurrentIndex(mostProminentIndex)
        }
      }

      navStateTrigger = ScrollTrigger.create({
        trigger: track,
        scroller: viewport,
        start: 'top top',
        end: () => `+=${Math.max(viewport.scrollHeight - viewport.clientHeight, 1)}`,
        invalidateOnRefresh: true,
        onRefreshInit: syncNavMetrics,
        onUpdate: syncNavState,
        onRefresh: () => {
          syncNavMetrics()
          syncNavState()
        }
      })

      slideTargets.forEach(({ slide, target }) => {
        if (target.hasAttribute('data-about-static')) {
          return
        }

        const cardTargets = getAnimatedCards(target)
        const animatedCards = cardTargets.length ? cardTargets : [target]
        const bentoCards = animatedCards.flatMap((card) => {
          const role = getBentoRole(card)

          return role ? [{ card, role }] : []
        })
        const isBento = bentoCards.length > 0
        const hasExperienceTimeline = target.hasAttribute('data-experience-section')
        const hasStaticStackCard = target.hasAttribute('data-stack-section')

        if (isBento) {
          const heroCards = bentoCards.filter(({ role }) => role === 'hero').map(({ card }) => card)
          const leftCards = bentoCards.filter(({ role }) => role === 'left').map(({ card }) => card)
          const rightCards = bentoCards.filter(({ role }) => role === 'right').map(({ card }) => card)

          if (!heroCards.length) {
            const splitCards = [...leftCards, ...rightCards]
            const usesEntrySplitTrigger = hasExperienceTimeline || hasStaticStackCard
            const splitTrigger = usesEntrySplitTrigger ? leftCards[0] ?? slide : slide
            const splitMotion = usesEntrySplitTrigger ? ENTRY_SPLIT_MOTION : SPLIT_BENTO_MOTION
            const shouldClearSplitTransforms = hasExperienceTimeline

            gsap.set(splitCards, { clearProps: 'transform' })

            const bentoTimeline = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: splitTrigger,
                scroller: viewport,
                start: splitMotion.start,
                end: splitMotion.end,
                scrub: splitMotion.scrub,
                invalidateOnRefresh: true,
                onLeave: () => {
                  if (shouldClearSplitTransforms) {
                    gsap.set(splitCards, { clearProps: 'transform' })
                  }
                }
              }
            })

            leftCards.forEach((card) => {
              bentoTimeline.fromTo(
                card,
                {
                  y: SPLIT_BENTO_MOTION.leftY
                },
                {
                  y: 0,
                  duration: SPLIT_BENTO_MOTION.leftDuration,
                  ease: SPLIT_BENTO_MOTION.leftEase
                },
                SPLIT_BENTO_MOTION.leftStart
              )
            })

            rightCards.forEach((card) => {
              bentoTimeline.fromTo(
                card,
                {
                  y: SPLIT_BENTO_MOTION.rightY
                },
                {
                  y: 0,
                  duration: SPLIT_BENTO_MOTION.rightDuration,
                  ease: SPLIT_BENTO_MOTION.rightEase
                },
                SPLIT_BENTO_MOTION.rightStart
              )
            })

            return
          }

          const timeline = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: slide,
              scroller: viewport,
              start: hasExperienceTimeline ? EXPERIENCE_BENTO_TRIGGER.start : DEFAULT_CARD_SCROLL_TRIGGER.start,
              end: hasExperienceTimeline ? EXPERIENCE_BENTO_TRIGGER.end : DEFAULT_CARD_SCROLL_TRIGGER.end,
              scrub: hasExperienceTimeline ? EXPERIENCE_BENTO_TRIGGER.scrub : DEFAULT_CARD_SCROLL_TRIGGER.scrub,
              invalidateOnRefresh: true
            }
          })

          heroCards.forEach((card) => {
            timeline.set(card, { y: HERO_BENTO_MOTION.heroY }, 0)
            timeline.to(card, { y: 0, duration: HERO_BENTO_MOTION.heroDuration }, HERO_BENTO_MOTION.heroStart)
          })

          leftCards.forEach((card) => {
            timeline.set(card, { y: HERO_BENTO_MOTION.leftY }, 0)
            timeline.to(card, { y: 0, duration: HERO_BENTO_MOTION.leftDuration }, HERO_BENTO_MOTION.leftStart)
          })

          rightCards.forEach((card) => {
            timeline.set(card, { y: HERO_BENTO_MOTION.rightY }, 0)
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
            invalidateOnRefresh: true
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
                transformOrigin: 'center center'
              },
              {
                y: 0,
                scale: 1,
                duration: DEFAULT_CARD_MOTION.enterDuration
              },
              offset
            )
            .to(
              card,
              {
                y: DEFAULT_CARD_MOTION.exitY,
                scale: DEFAULT_CARD_MOTION.exitScale,
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
      syncNavState()

      return () => {
        navStateTrigger?.kill()
        scrollTween?.kill()
        goToRef.current = () => {}
      }
    })

    return () => {
      goToRef.current = () => {}
      mm.revert()
    }
  }, [onActiveIndexChange, onSlideProgressChange, trackRef, viewportRef])

  return {
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
  const staticStackCard = target.querySelector<HTMLElement>(':scope > [data-stack-static]')

  if (staticStackCard) {
    return Array.from(target.querySelectorAll<HTMLElement>(':scope > [data-glass-card][data-bento-role]'))
  }

  const directCardTargets = target.matches('[data-glass-card]')
    ? [target]
    : Array.from(target.querySelectorAll<HTMLElement>(':scope > [data-glass-card]'))

  if (directCardTargets.length > 0) {
    return directCardTargets
  }

  return Array.from(target.querySelectorAll<HTMLElement>(':scope > [data-experience-pin] > [data-glass-card]'))
}

function getNavFocusTarget(target: HTMLElement) {
  return target.querySelector<HTMLElement>(':scope > [data-experience-pin]') ?? target
}

function getNavAnchorPosition(target: HTMLElement, track: HTMLElement) {
  return getOffsetTop(target) - getOffsetTop(track) + target.offsetHeight / 2
}

function getNavReleaseAnchor(target: HTMLElement, focusTarget: HTMLElement, track: HTMLElement, viewport: HTMLElement) {
  if (!target.hasAttribute('data-experience-section')) {
    return getNavAnchorPosition(focusTarget, track)
  }

  return getOffsetTop(target) - getOffsetTop(track) + target.offsetHeight - viewport.clientHeight / 2
}

function getOffsetTop(element: HTMLElement) {
  let top = 0
  let current: HTMLElement | null = element

  while (current) {
    top += current.offsetTop
    current = current.offsetParent as HTMLElement | null
  }

  return top
}

function getNavStrengths(
  viewportCenter: number,
  peakAnchors: number[],
  releaseAnchors: number[],
  scrollEndAnchor: number,
  direction: 1 | -1
) {
  const strengths = new Array(peakAnchors.length).fill(0)

  if (peakAnchors.length === 0) {
    return strengths
  }

  if (viewportCenter <= peakAnchors[0]) {
    strengths[0] = 1
    return strengths
  }

  const lastIndex = peakAnchors.length - 1
  const lastPeakAnchor = peakAnchors[lastIndex]
  const lastReleaseAnchor = Math.max(releaseAnchors[lastIndex] ?? lastPeakAnchor, lastPeakAnchor)

  // Each section peaks when its anchor reaches the viewport center. Experience holds
  // its nav state until the pinned timeline section actually finishes releasing.
  if (viewportCenter <= lastReleaseAnchor) {
    for (let index = 0; index < lastIndex; index += 1) {
      const currentPeakAnchor = peakAnchors[index]
      const currentReleaseAnchor = Math.max(releaseAnchors[index] ?? currentPeakAnchor, currentPeakAnchor)
      const nextPeakAnchor = peakAnchors[index + 1]

      if (viewportCenter >= currentPeakAnchor && viewportCenter <= currentReleaseAnchor) {
        strengths[index] = 1
        return strengths
      }

      if (viewportCenter > currentReleaseAnchor && viewportCenter < nextPeakAnchor) {
        const distance = Math.max(nextPeakAnchor - currentReleaseAnchor, 1)
        const progress = gsap.utils.clamp(0, 1, (viewportCenter - currentReleaseAnchor) / distance)
        const directionalOffset = direction === 1 ? NAV_DIRECTIONAL_OFFSET : -NAV_DIRECTIONAL_OFFSET
        const biasedProgress = gsap.utils.clamp(0, 1, progress + directionalOffset)
        const easedProgress = gsap.parseEase('sine.inOut')(biasedProgress)

        strengths[index] = 1 - easedProgress
        strengths[index + 1] = easedProgress
        return strengths
      }
    }

    strengths[lastIndex] = 1
    return strengths
  }

  if (viewportCenter >= lastReleaseAnchor) {
    const fadeDistance = Math.max(scrollEndAnchor - lastReleaseAnchor, 1)
    const fadeProgress = gsap.utils.clamp(0, 1, (viewportCenter - lastReleaseAnchor) / fadeDistance)

    strengths[lastIndex] = 1 - fadeProgress
    return strengths
  }

  strengths[lastIndex] = 1
  return strengths
}

function getMostProminentIndex(strengths: number[]) {
  let nextIndex: number | null = null
  let highestProximity = 0

  strengths.forEach((strength, index) => {
    const proximity = gsap.utils.clamp(0, 1, strength)

    if (proximity > highestProximity) {
      highestProximity = proximity
      nextIndex = index
    }
  })

  return nextIndex
}
