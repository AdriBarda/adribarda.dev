import { useEffect, useState } from 'react'

const STORAGE_KEY = 'theme-preference'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'
const OPTIONS = ['light', 'dark', 'system'] as const

type ThemePreference = (typeof OPTIONS)[number]

function getStoredPreference(): ThemePreference {
  const preference = localStorage.getItem(STORAGE_KEY)

  return preference === 'light' || preference === 'dark' || preference === 'system'
    ? preference
    : 'system'
}

function resolveTheme(preference: ThemePreference) {
  if (preference !== 'system') {
    return preference
  }

  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

function applyTheme(preference: ThemePreference) {
  const theme = resolveTheme(preference)
  const root = document.documentElement

  root.dataset.theme = theme
  root.dataset.themePreference = preference
  root.style.colorScheme = theme
  localStorage.setItem(STORAGE_KEY, preference)
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>('system')

  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY)
    const storedPreference = getStoredPreference()

    setPreference(storedPreference)
    applyTheme(storedPreference)

    const syncSystemTheme = () => {
      if (getStoredPreference() !== 'system') {
        return
      }

      applyTheme('system')
    }

    mediaQuery.addEventListener('change', syncSystemTheme)

    return () => {
      mediaQuery.removeEventListener('change', syncSystemTheme)
    }
  }, [])

  return (
    <div className="pointer-events-auto fixed top-(--page-padding) right-(--page-padding) z-30 flex gap-1 rounded-full border border-app-border bg-app-surface p-1 text-sm text-app-text shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur max-sm:left-1/2 max-sm:right-auto max-sm:-translate-x-1/2">
      {OPTIONS.map((option) => {
        const active = option === preference

        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            className={[
              'cursor-pointer rounded-full px-4 py-2 capitalize transition-colors',
              active ? 'bg-app-text text-app-bg' : 'text-app-muted hover:text-app-accent'
            ].join(' ')}
            onClick={() => {
              applyTheme(option)
              setPreference(option)
            }}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
