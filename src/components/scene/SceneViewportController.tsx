import { useRef, type ReactNode } from 'react'

import { useSceneViewportController } from '../../hooks/useSceneViewportController'
import { sceneToneAccentClasses, type SceneNavSlide } from '../../theme/sceneTheme'

interface Props {
  slides: SceneNavSlide[]
  children?: ReactNode
}

export function SceneViewportController({ slides, children }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const { activeIndex, goTo } = useSceneViewportController({
    slideCount: slides.length,
    sceneRef,
    viewportRef,
    trackRef
  })

  return (
    <section ref={sceneRef} className="relative z-10 w-full overflow-visible">
      <div className="relative mx-auto w-full max-w-6xl overflow-visible">
        <div ref={viewportRef} className="overflow-visible md:h-[calc(100dvh-(var(--page-padding)*2))] md:overflow-hidden">
          <div ref={trackRef} data-card-track className="flex flex-col gap-6 md:gap-14 md:will-change-transform">
            {children}
          </div>
        </div>

        <div className="absolute -right-6 top-1/2 hidden -translate-y-1/2 md:block min-[1390px]:-right-20">
          <div className="flex flex-col gap-6 lg:gap-7">
            {slides.map((slide, index) => {
              const active = index === activeIndex

              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to ${slide.id.replace(/-/g, ' ')}`}
                  aria-current={active ? 'true' : 'false'}
                  title={slide.id.replace(/-/g, ' ')}
                  className={[
                    'block size-2.5 rounded-full transition-[transform,background-color,opacity] [transition-duration:1550ms,220ms,220ms] [transition-timing-function:cubic-bezier(0.35,0,0.25,1),ease,ease] lg:size-3',
                    active
                      ? `scale-[2.15] opacity-100 ${sceneToneAccentClasses[slide.navTone]}`
                      : 'scale-100 bg-app-text/20 opacity-75 hover:scale-[1.12] hover:bg-app-text/30 hover:opacity-95'
                  ].join(' ')}
                  onClick={() => goTo(index)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
