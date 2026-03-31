import { useEffect, useRef, useState, type RefObject } from 'react'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import type { SceneNavSlide, SceneTone } from '../theme/sceneTheme'

gsap.registerPlugin(Observer)

export type { SceneNavSlide, SceneTone }

interface Options {
  slideCount: number
  sceneRef: RefObject<HTMLDivElement | null>
  viewportRef: RefObject<HTMLDivElement | null>
  trackRef: RefObject<HTMLDivElement | null>
}

export function useSceneViewportController({
  slideCount,
  sceneRef,
  viewportRef,
  trackRef
}: Options) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const moveToRef = useRef<(index: number) => void>(() => {})

  useEffect(() => {
    const scene = sceneRef.current
    const viewport = viewportRef.current
    const track = trackRef.current

    if (!scene || !track || !viewport) {
      return
    }

    const desktopMedia = window.matchMedia('(min-width: 768px)')
    let observer: Observer | null = null
    const resizeObserver = new ResizeObserver(() => {
      syncTrackPosition()
    })

    const getStride = () => {
      const rowGap = Number.parseFloat(getComputedStyle(track).rowGap || '0')
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
      if (!desktopMedia.matches || isAnimatingRef.current || nextIndex === activeIndexRef.current) {
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

    const handleMediaChange = () => {
      syncMode()
      syncTrackPosition()
    }

    syncMode()
    syncTrackPosition()
    resizeObserver.observe(viewport)
    desktopMedia.addEventListener('change', handleMediaChange)

    return () => {
      observer?.kill()
      moveToRef.current = () => {}
      resizeObserver.disconnect()
      desktopMedia.removeEventListener('change', handleMediaChange)
    }
  }, [sceneRef, slideCount, trackRef, viewportRef])

  return {
    activeIndex,
    goTo(index: number) {
      moveToRef.current(index)
    }
  }
}
