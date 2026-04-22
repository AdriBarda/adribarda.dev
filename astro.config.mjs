// @ts-check
import { defineConfig } from 'astro/config'

import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'

const deployTarget = process.env.DEPLOY_TARGET ?? 'github'
const githubPagesConfig = {
  site: 'https://adribarda.github.io',
  base: '/adribarda.dev'
}

// https://astro.build/config
export default defineConfig({
  ...(deployTarget === 'github' ? githubPagesConfig : {}),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
})
