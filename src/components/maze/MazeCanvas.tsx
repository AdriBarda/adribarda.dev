import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { SCENE_VIEWPORT_READY_EVENT, type SceneViewportReadyDetail } from '../scene/sceneViewportEvents'
import { useMazeCanvas } from '../../hooks/useMazeCanvas'

gsap.registerPlugin(ScrollTrigger)

export function MazeCanvas() {
  const canvasRef = useMazeCanvas()

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    let mazeDimTrigger: ScrollTrigger | null = null
    let currentScroller: HTMLElement | Window | null = null

    const MAZE_DIM_DISTANCE = 320

    const getMazeDimTargets = () =>
      document.documentElement.dataset.theme === 'dark'
        ? {
            opacity: 0.76,
            brightness: 0.84,
            saturation: 0.94
          }
        : {
            opacity: 0.68,
            brightness: 0.8,
            saturation: 0.86
          }

    const applyMazeIntensity = (progress: number) => {
      const targets = getMazeDimTargets()
      const nextOpacity = gsap.utils.interpolate(1, targets.opacity, progress)
      const nextBrightness = gsap.utils.interpolate(1, targets.brightness, progress)
      const nextSaturation = gsap.utils.interpolate(1, targets.saturation, progress)

      gsap.set(canvas, {
        '--maze-opacity': nextOpacity,
        '--maze-brightness': nextBrightness,
        '--maze-saturation': nextSaturation
      })
    }

    const setupMazeDimTrigger = (viewport?: HTMLElement | null) => {
      const resolvedViewport = viewport ?? document.querySelector<HTMLElement>('[data-scene-viewport-scroll]')
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
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 block size-full pointer-events-none [filter:brightness(var(--maze-brightness,1))_saturate(var(--maze-saturation,1))] [opacity:var(--maze-opacity,1)]"
    />
  )
}
