/** Set by public/theme-init.js, which runs before first paint. */
declare interface Window {
  __setTheme: (preference: 'light' | 'dark' | 'system') => void
}
