/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config'

// Reuses Astro's Vite config so tests resolve the same imports as the site
// (`astro:content`, `?raw`, ...).
export default getViteConfig({
  test: {
    environment: 'node'
  }
})
