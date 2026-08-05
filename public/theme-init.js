// Runs before first paint, so the page never flashes the wrong theme. The
// toggle in SiteNav only calls window.__setTheme.
const storageKey = 'theme-preference'
const root = document.documentElement
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

const read = () => {
  const preference = localStorage.getItem(storageKey)

  return preference === 'light' || preference === 'dark' ? preference : 'system'
}

const apply = (preference) => {
  const theme = preference === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : preference

  root.dataset.theme = theme
  root.dataset.themePreference = preference
  root.style.colorScheme = theme
}

window.__setTheme = (preference) => {
  localStorage.setItem(storageKey, preference)
  apply(preference)
}

apply(read())

mediaQuery.addEventListener('change', () => {
  if (read() === 'system') apply('system')
})
