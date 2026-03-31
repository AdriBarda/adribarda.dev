import { sceneToneAccentClasses, type SceneNavSlide } from '../../theme/sceneTheme'
import { useSceneViewportController } from '../../hooks/useSceneViewportController'

interface Props {
  viewportId: string
  slides: SceneNavSlide[]
}

export function SceneViewportController({ viewportId, slides }: Props) {
  const { activeIndex, goTo } = useSceneViewportController({
    viewportId,
    slideCount: slides.length
  })

  return (
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
              'block size-2.5 rounded-full transition-[transform,background-color,opacity] duration-[1550ms,220ms,220ms] ease-[cubic-bezier(0.35,0,0.25,1),ease,ease] lg:size-3',
              active
                ? `scale-[2.15] opacity-100 ${sceneToneAccentClasses[slide.navTone]}`
                : 'scale-100 bg-app-text/20 opacity-75 hover:scale-[1.12] hover:bg-app-text/30 hover:opacity-95'
            ].join(' ')}
            onClick={() => goTo(index)}
          />
        )
      })}
    </div>
  )
}
