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
      gsap.set(timelineTrack, { y: 0 })

      const maxTimelineOffset = () => Math.max(0, timelineTrack.scrollHeight - timelineViewport.clientHeight)
      const timelineScrollDistance = () => {
        const perItemDistance = Math.max(180, viewport.clientHeight * 0.32) * (timelineItems.length - 1)

        return Math.max(maxTimelineOffset(), viewport.clientHeight * 0.9, perItemDistance)
      }

      const syncSectionHeight = () => {
        const stickyOffset = viewport.clientHeight * 0.12
        const requiredHeight = pinTarget.offsetHeight + stickyOffset + timelineScrollDistance()

        section.style.setProperty('--experience-scroll-height', `${Math.ceil(requiredHeight)}px`)
      }

      syncSectionHeight()

      const tween = gsap.to(timelineTrack, {
        y: () => -maxTimelineOffset(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          scroller: viewport,
          start: 'top 12%',
          end: () => `+=${timelineScrollDistance()}`,
          scrub: 0.28,
          invalidateOnRefresh: true,
          refreshPriority: 1,
          onRefreshInit: syncSectionHeight,
          onRefresh: syncSectionHeight
        }
      })

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        gsap.set(timelineTrack, { clearProps: 'transform' })
        section.style.removeProperty('--experience-scroll-height')
      }
    })

    return () => {
      mm.revert()
    }
  }, [])

  return null
}
