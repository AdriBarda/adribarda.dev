import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { useSceneViewportController } from '../../hooks/useSceneViewportController'
import { SCENE_VIEWPORT_READY_EVENT, type SceneViewportReadyDetail } from './sceneViewportEvents'
import { sceneToneAccentColors, type SceneNavSlide } from './sceneTheme'
import { DESKTOP_SCENE_MEDIA_QUERY } from '../../config/mediaQueries'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  slides: SceneNavSlide[]
  children?: ReactNode
}

export function SceneViewport({ slides, children }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const footerTriggerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const tickRefs = useRef<Array<HTMLSpanElement | null>>([])
  const tickColorCacheRef = useRef<{ muted: string; accents: string[] }>({ muted: '', accents: [] })
  const tickProgressesRef = useRef<number[]>(slides.map(() => 0))

  const handleSlideProgressChange = useCallback(
    (progresses: number[]) => {
      tickProgressesRef.current = progresses

      applyTickStyles(tickRefs.current, slides.length, progresses, tickColorCacheRef.current)
    },
    [slides]
  )

  useEffect(() => {
    const updateTickColors = () => {
      const rootStyles = getComputedStyle(document.documentElement)

      tickColorCacheRef.current = {
        muted: resolveCssVarColor('var(--app-muted)', rootStyles),
        accents: slides.map((slide) =>
          resolveCssVarColor(sceneToneAccentColors[slide.navTone], rootStyles)
        )
      }

      handleSlideProgressChange(tickProgressesRef.current)
    }

    updateTickColors()

    const themeObserver = new MutationObserver(updateTickColors)

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    return () => {
      themeObserver.disconnect()
    }
  }, [handleSlideProgressChange, slides])

  const handleActiveIndexChange = useCallback(
    (activeIndex: number) => {
      buttonRefs.current.slice(0, slides.length).forEach((button, index) => {
        button?.setAttribute('aria-current', index === activeIndex ? 'true' : 'false')
      })
    },
    [slides.length]
  )

  const { goTo } = useSceneViewportController({
    viewportRef,
    trackRef,
    onSlideProgressChange: handleSlideProgressChange,
    onActiveIndexChange: handleActiveIndexChange
  })

  useEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    window.dispatchEvent(
      new CustomEvent<SceneViewportReadyDetail>(SCENE_VIEWPORT_READY_EVENT, {
        detail: { viewport }
      })
    )
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    const trigger = footerTriggerRef.current
    const footer = document.querySelector<HTMLElement>('[data-site-footer]')

    if (!viewport || !trigger || !footer) {
      return
    }

    const mm = gsap.matchMedia()

    mm.add(DESKTOP_SCENE_MEDIA_QUERY, () => {
      gsap.set(footer, { yPercent: 100, autoAlpha: 1 })

      const tween = gsap.to(footer, {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger,
          scroller: viewport,
          start: 'top bottom',
          end: 'top 35%',
          scrub: 0.2,
          invalidateOnRefresh: true
        }
      })

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        gsap.set(footer, { clearProps: 'transform,opacity,visibility' })
      }
    })

    return () => {
      mm.revert()
    }
  }, [])

  return (
    <section className="relative z-10 w-full overflow-visible">
      <div
        ref={viewportRef}
        data-scene-viewport-scroll
        data-scene-viewport
        className="w-full overflow-visible desktop:h-[calc(100dvh-(var(--page-padding)*2))] desktop:overflow-x-hidden desktop:overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-5xl overflow-visible">
          <div
            ref={trackRef}
            data-card-track
            className="flex flex-col gap-6 md:gap-8 lg:gap-10 md:pt-8 md:pb-14"
          >
            {children}
          </div>
        </div>

        <div
          ref={footerTriggerRef}
          data-scene-footer-trigger
          aria-hidden="true"
          className="hidden desktop:block desktop:h-[calc(100dvh-(var(--page-padding)*2))]"
        />
      </div>

      <div
        data-scene-nav
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-5xl -translate-x-1/2 desktop:block"
      >
        <div className="absolute -right-6 top-1/2 hidden -translate-y-1/2 md:block min-[1390px]:-right-20">
          <div className="flex flex-col items-end gap-5 lg:gap-6">
            {slides.map((slide, index) => {
              return (
                <button
                  key={slide.id}
                  type="button"
                  ref={(element) => {
                    buttonRefs.current[index] = element
                  }}
                  aria-label={`Go to ${slide.id.replace(/-/g, ' ')}`}
                  aria-current={index === 0 ? 'true' : 'false'}
                  title={slide.id.replace(/-/g, ' ')}
                  className="pointer-events-auto flex h-3 w-8 items-center justify-end lg:h-4 lg:w-9"
                  onClick={() => goTo(index)}
                >
                  <span
                    ref={(element) => {
                      tickRefs.current[index] = element
                    }}
                    className="block h-0.5 w-2.5 origin-right rounded-full lg:h-[3px]"
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function applyTickStyles(
  tickRefs: Array<HTMLSpanElement | null>,
  slideCount: number,
  progresses: number[],
  colors: { muted: string; accents: string[] }
) {
  const { muted, accents } = colors

  tickRefs.slice(0, slideCount).forEach((tick, index) => {
    if (!tick) {
      return
    }

    const strength = gsap.utils.clamp(0, 1, progresses[index] ?? 0)
    const eased = gsap.parseEase('power2.out')(strength)
    const accentColor = accents[index] ?? muted

    gsap.set(tick, {
      width: gsap.utils.interpolate(10, 32, eased),
      opacity: gsap.utils.interpolate(0.58, 1, eased),
      scaleY: gsap.utils.interpolate(1, 1.35, eased),
      backgroundColor: gsap.utils.interpolate(muted, accentColor, eased),
      transformOrigin: 'right center'
    })
  })
}

function resolveCssVarColor(value: string, styles: CSSStyleDeclaration) {
  const match = value.match(/^var\((--[^)]+)\)$/)

  if (!match) {
    return value
  }

  return styles.getPropertyValue(match[1]).trim() || value
}
