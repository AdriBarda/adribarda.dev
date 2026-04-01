import { useCallback, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'

import { useSceneViewportController } from '../../hooks/useSceneViewportController'
import { sceneToneAccentColors, type SceneNavSlide } from '../../theme/sceneTheme'

interface Props {
  slides: SceneNavSlide[]
  children?: ReactNode
}

export function SceneViewportController({ slides, children }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const tickRefs = useRef<Array<HTMLSpanElement | null>>([])

  const handleSlideProgressChange = useCallback(
    (progresses: number[]) => {
      const rootStyles = getComputedStyle(document.documentElement)
      const mutedColor = resolveCssVarColor('var(--app-muted)', rootStyles)

      tickRefs.current.slice(0, slides.length).forEach((tick, index) => {
        if (!tick) {
          return
        }

        const progress = progresses[index] ?? 0
        const proximity = gsap.utils.clamp(0, 1, 1 - Math.abs(progress - 0.5) / 0.5)
        const eased = gsap.parseEase('power2.out')(proximity)
        const accentColor = resolveCssVarColor(sceneToneAccentColors[slides[index].navTone], rootStyles)

        gsap.set(tick, {
          width: gsap.utils.interpolate(10, 32, eased),
          opacity: gsap.utils.interpolate(0.58, 1, eased),
          scaleY: gsap.utils.interpolate(1, 1.35, eased),
          backgroundColor: gsap.utils.interpolate(mutedColor, accentColor, eased),
          transformOrigin: 'right center'
        })
      })
    },
    [slides]
  )

  const { activeIndex, goTo } = useSceneViewportController({
    viewportRef,
    trackRef,
    onSlideProgressChange: handleSlideProgressChange
  })

  return (
    <section className="relative z-10 w-full overflow-visible">
      <div
        ref={viewportRef}
        data-scene-viewport-scroll
        className="w-full overflow-visible md:h-dvh md:overflow-x-hidden md:overflow-y-auto md:scroll-smooth"
      >
        <div className="mx-auto w-full max-w-5xl overflow-visible">
          <div ref={trackRef} data-card-track className="flex flex-col gap-6 md:gap-8 lg:gap-10 md:pt-8 md:pb-14">
            {children}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-5xl -translate-x-1/2 md:block">
        <div className="absolute -right-6 top-1/2 hidden -translate-y-1/2 md:block min-[1390px]:-right-20">
          <div className="flex flex-col items-end gap-5 lg:gap-6">
            {slides.map((slide, index) => {
              const active = index === activeIndex

              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to ${slide.id.replace(/-/g, ' ')}`}
                  aria-current={active ? 'true' : 'false'}
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

function resolveCssVarColor(value: string, styles: CSSStyleDeclaration) {
  const match = value.match(/^var\((--[^)]+)\)$/)

  if (!match) {
    return value
  }

  return styles.getPropertyValue(match[1]).trim() || value
}
