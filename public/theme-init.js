const storageKey = 'theme-preference'
const root = document.documentElement
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

const getStoredPreference = () => {
  const preference = localStorage.getItem(storageKey)

  return preference === 'light' || preference === 'dark' || preference === 'system'
    ? preference
    : 'system'
}

const applyTheme = (preference) => {
  const theme =
    preference === 'system'
      ? mediaQuery.matches
        ? 'dark'
        : 'light'
      : preference

  root.dataset.theme = theme
  root.dataset.themePreference = preference
  root.style.colorScheme = theme
}

applyTheme(getStoredPreference())
