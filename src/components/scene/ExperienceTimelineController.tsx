import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function ExperienceTimelineController() {
  useEffect(() => {
    const viewport = document.querySelector<HTMLElement>('[data-scene-viewport-scroll]')
    const section = document.querySelector<HTMLElement>('[data-experience-section]')
    const pinTarget = document.querySelector<HTMLElement>('[data-experience-pin]')
    const timelineViewport = document.querySelector<HTMLElement>('[data-experience-timeline-viewport]')
    const timelineTrack = document.querySelector<HTMLElement>('[data-experience-timeline-track]')
    const timelineItems = Array.from(document.querySelectorAll<HTMLElement>('[data-experience-timeline-item]'))

    if (!viewport || !section || !pinTarget || !timelineViewport || !timelineTrack || timelineItems.length <= 1) {
      return
    }

    const mm = gsap.matchMedia()

    mm.add('(min-width: 768px)', () => {
      gsap.set(timelineTrack, { x: 0 })

      const syncTimelineLayout = () => {
        timelineTrack.style.setProperty('--experience-timeline-step-width', `${Math.ceil(timelineViewport.clientWidth)}px`)
      }

      const maxTimelineOffset = () => Math.max(0, timelineTrack.scrollWidth - timelineViewport.clientWidth)
      const timelineScrollDistance = () => {
        const perItemDistance = Math.max(timelineViewport.clientWidth * 0.92, 520) * (timelineItems.length - 1)

        return Math.max(maxTimelineOffset(), viewport.clientHeight * 0.9, perItemDistance)
      }

      const syncSectionHeight = () => {
        syncTimelineLayout()

        const stickyOffset = viewport.clientHeight * 0.12
        const requiredHeight = pinTarget.offsetHeight + stickyOffset + timelineScrollDistance()

        section.style.setProperty('--experience-scroll-height', `${Math.ceil(requiredHeight)}px`)
      }

      syncSectionHeight()

      const tween = gsap.to(timelineTrack, {
        x: () => -maxTimelineOffset(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          scroller: viewport,
          start: 'top 6%',
          end: () => `+=${timelineScrollDistance()}`,
          scrub: 0.28,
          invalidateOnRefresh: true,
          refreshPriority: 1,
          onRefreshInit: syncSectionHeight,
          onRefresh: syncSectionHeight
        }
      })

      const refreshId = requestAnimationFrame(() => {
        ScrollTrigger.refresh()
      })

      return () => {
        cancelAnimationFrame(refreshId)
        tween.scrollTrigger?.kill()
        tween.kill()
        gsap.set(timelineTrack, { clearProps: 'transform' })
        timelineTrack.style.removeProperty('--experience-timeline-step-width')
        section.style.removeProperty('--experience-scroll-height')
      }
    })

    return () => {
      mm.revert()
    }
  }, [])

  return null
}
