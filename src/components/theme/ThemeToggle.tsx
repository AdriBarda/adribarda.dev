import { useEffect, useState } from 'react'

const STORAGE_KEY = 'theme-preference'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'
const OPTIONS = ['light', 'dark', 'system'] as const

type ThemePreference = (typeof OPTIONS)[number]

function ThemeIcon({ option }: { option: ThemePreference }) {
  if (option === 'light') {
    return (
      <svg
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    )
  }

  if (option === 'dark') {
    return (
      <svg
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
      </svg>
    )
  }

  return (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </svg>
  )
}

function getStoredPreference(): ThemePreference {
  const preference = localStorage.getItem(STORAGE_KEY)

  return preference === 'light' || preference === 'dark' || preference === 'system'
    ? preference
    : 'system'
}

function getInitialPreference(): ThemePreference {
  if (typeof document === 'undefined') {
    return 'system'
  }

  const documentPreference = document.documentElement.dataset.themePreference

  if (
    documentPreference === 'light' ||
    documentPreference === 'dark' ||
    documentPreference === 'system'
  ) {
    return documentPreference
  }

  return getStoredPreference()
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
  const [preference, setPreference] = useState<ThemePreference>(getInitialPreference)

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
    <div className="pointer-events-auto flex gap-0.5 rounded-full border border-app-border/80 bg-app-surface/88 p-0.5 text-sm text-app-text shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl supports-backdrop-filter:bg-app-surface/72 dark:border-white/10 dark:shadow-[0_12px_32px_rgba(0,0,0,0.3)] sm:gap-1 sm:p-1">
      {OPTIONS.map((option) => {
        const active = option === preference
        const label = option[0].toUpperCase() + option.slice(1)

        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={[
              'flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors sm:size-10',
              active ? 'bg-app-text text-app-bg' : 'text-app-muted hover:text-app-text'
            ].join(' ')}
            onClick={() => {
              applyTheme(option)
              setPreference(option)
            }}
          >
            <ThemeIcon option={option} />
          </button>
        )
      })}
    </div>
  )
}
