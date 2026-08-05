// @ts-check
import { defineConfig } from 'astro/config'

import tailwindcss from '@tailwindcss/vite'

const deployTarget = process.env.DEPLOY_TARGET ?? 'github'
const githubPagesConfig = {
  site: 'https://adribarda.github.io',
  base: '/adribarda.dev'
}

export default defineConfig({
  ...(deployTarget === 'github' ? githubPagesConfig : {}),

  vite: {
    plugins: [tailwindcss()]
  }
})
