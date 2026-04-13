import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import {
  SCENE_VIEWPORT_READY_EVENT,
  type SceneViewportReadyDetail
} from '../scene/sceneViewportEvents'
import { useMazeCanvas } from '../../hooks/useMazeCanvas'

gsap.registerPlugin(ScrollTrigger)

export function MazeCanvas() {
  const canvasRef = useMazeCanvas()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      return
    }

    const canvas = canvasRef.current
    const overlay = overlayRef.current

    if (!canvas || !overlay) {
      return
    }

    let mazeDimTrigger: ScrollTrigger | null = null
    let currentScroller: HTMLElement | Window | null = null

    const MAZE_DIM_DISTANCE = 320

    const getMazeDimTargets = () =>
      document.documentElement.dataset.theme === 'dark'
        ? {
            overlayOpacity: 0.12
          }
        : {
            overlayOpacity: 0.16
          }

    const applyMazeIntensity = (progress: number) => {
      const targets = getMazeDimTargets()
      const nextOverlayOpacity = gsap.utils.interpolate(0, targets.overlayOpacity, progress)

      gsap.set(overlay, {
        opacity: nextOverlayOpacity
      })
    }

    const setupMazeDimTrigger = (viewport?: HTMLElement | null) => {
      const resolvedViewport =
        viewport ?? document.querySelector<HTMLElement>('[data-scene-viewport-scroll]')
      const nextScroller = resolvedViewport ?? window

      if (nextScroller === currentScroller) {
        return
      }

      mazeDimTrigger?.kill()
      currentScroller = nextScroller
      applyMazeIntensity(0)

      mazeDimTrigger = ScrollTrigger.create({
        trigger: resolvedViewport ?? document.body,
        scroller: resolvedViewport ?? undefined,
        start: 'top top',
        end: `+=${MAZE_DIM_DISTANCE}`,
        scrub: 1.2,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyMazeIntensity(self.progress)
        },
        onRefresh: (self) => {
          applyMazeIntensity(self.progress)
        }
      })

      ScrollTrigger.refresh()
    }

    const handleViewportReady = (event: Event) => {
      const { detail } = event as CustomEvent<SceneViewportReadyDetail>
      setupMazeDimTrigger(detail.viewport)
    }

    const themeObserver = new MutationObserver(() => {
      applyMazeIntensity(mazeDimTrigger?.progress ?? 0)
    })

    setupMazeDimTrigger()

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    window.addEventListener(SCENE_VIEWPORT_READY_EVENT, handleViewportReady as EventListener)

    return () => {
      themeObserver.disconnect()
      window.removeEventListener(SCENE_VIEWPORT_READY_EVENT, handleViewportReady as EventListener)
      mazeDimTrigger?.kill()
    }
  }, [canvasRef])

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 hidden size-full pointer-events-none md:block"
      />
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="absolute inset-0 hidden pointer-events-none bg-app-bg opacity-0 md:block"
      />
    </>
  )
}
