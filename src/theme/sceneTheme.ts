export type SceneTone = 'presentation' | 'experience' | 'stack' | 'about-me'

export interface SceneNavSlide {
  id: string
  navTone: SceneTone
}

export const sceneToneAccentClasses: Record<SceneTone, string> = {
  presentation: 'bg-[var(--scene-accent-presentation)]',
  experience: 'bg-[var(--scene-accent-experience)]',
  stack: 'bg-[var(--scene-accent-stack)]',
  'about-me': 'bg-[var(--scene-accent-about)]'
}

export const sceneToneAccentColors: Record<SceneTone, string> = {
  presentation: 'var(--scene-accent-presentation)',
  experience: 'var(--scene-accent-experience)',
  stack: 'var(--scene-accent-stack)',
  'about-me': 'var(--scene-accent-about)'
}
