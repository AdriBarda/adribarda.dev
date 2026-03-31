import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import type { SceneNavSlide, SceneTone } from '../theme/sceneTheme'

gsap.registerPlugin(Observer)

export type { SceneNavSlide, SceneTone }

interface Options {
  viewportId: string
  slideCount: number
}

export function useSceneViewportController({ viewportId, slideCount }: Options) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const moveToRef = useRef<(index: number) => void>(() => {})

  useEffect(() => {
    const scene = document.querySelector<HTMLElement>(`[data-card-scene="${viewportId}"]`)
    const track = scene?.querySelector<HTMLElement>('[data-card-track]')
    const viewport = track?.parentElement
    const desktopMedia = window.matchMedia('(min-width: 768px)')

    if (!scene || !track || !viewport) {
      return
    }

    let observer: Observer | null = null

    const getStride = () => {
      const rowGap = Number.parseFloat(window.getComputedStyle(track).rowGap || '0')
      return viewport.clientHeight + rowGap
    }

    const syncTrackPosition = () => {
      if (!desktopMedia.matches) {
        gsap.set(track, { clearProps: 'transform,willChange' })
        return
      }

      gsap.set(track, { y: -getStride() * activeIndexRef.current })
    }

    const moveTo = (nextIndex: number) => {
      if (isAnimatingRef.current || nextIndex === activeIndexRef.current) {
        return
      }

      isAnimatingRef.current = true
      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)

      gsap.to(track, {
        y: -getStride() * nextIndex,
        duration: 0.9,
        ease: 'power3.inOut',
        onComplete: () => {
          isAnimatingRef.current = false
        }
      })
    }

    moveToRef.current = moveTo

    const enableDesktopCarousel = () => {
      if (observer || !desktopMedia.matches) {
        return
      }

      observer = Observer.create({
        target: scene,
        type: 'wheel,touch',
        tolerance: 18,
        preventDefault: true,
        onDown: () => moveTo(Math.min(activeIndexRef.current + 1, slideCount - 1)),
        onUp: () => moveTo(Math.max(activeIndexRef.current - 1, 0))
      })

      gsap.set(track, { clearProps: 'all' })
      syncTrackPosition()
    }

    const disableDesktopCarousel = () => {
      observer?.kill()
      observer = null
      gsap.set(track, { clearProps: 'transform,willChange' })
    }

    const syncMode = () => {
      if (desktopMedia.matches) {
        enableDesktopCarousel()
        return
      }

      disableDesktopCarousel()
    }

    const handleResize = () => {
      syncMode()

      if (!desktopMedia.matches) {
        return
      }

      syncTrackPosition()
    }

    syncMode()
    syncTrackPosition()
    window.addEventListener('resize', handleResize)

    return () => {
      observer?.kill()
      moveToRef.current = () => {}
      window.removeEventListener('resize', handleResize)
    }
  }, [slideCount, viewportId])

  return {
    activeIndex,
    goTo(index: number) {
      moveToRef.current(index)
    }
  }
}
