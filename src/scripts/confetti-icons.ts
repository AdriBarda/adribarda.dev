import astro from '../assets/tech-stack/astro.svg?raw'
import claudeCode from '../assets/tech-stack/claude-code.svg?raw'
import codex from '../assets/tech-stack/codex.svg?raw'
import copilot from '../assets/tech-stack/copilot.svg?raw'
import eslint from '../assets/tech-stack/eslint.svg?raw'
import express from '../assets/tech-stack/express.svg?raw'
import git from '../assets/tech-stack/git.svg?raw'
import github from '../assets/tech-stack/github.svg?raw'
import java from '../assets/tech-stack/java.svg?raw'
import javascript from '../assets/tech-stack/javascript.svg?raw'
import mysql from '../assets/tech-stack/mysql.svg?raw'
import node from '../assets/tech-stack/node.svg?raw'
import opencode from '../assets/tech-stack/opencode.svg?raw'
import pinia from '../assets/tech-stack/pinia.svg?raw'
import playwright from '../assets/tech-stack/playwright.svg?raw'
import postgresql from '../assets/tech-stack/postgresql.svg?raw'
import react from '../assets/tech-stack/react.svg?raw'
import typescript from '../assets/tech-stack/typescript.svg?raw'
import vite from '../assets/tech-stack/vite.svg?raw'
import vitest from '../assets/tech-stack/vitest.svg?raw'
import vue from '../assets/tech-stack/vue.svg?raw'

const WHITE = '#f4f4f6'

const whiteRoot = (source: string) => source.replace('<svg', `<svg fill="${WHITE}"`)

/**
 * Every tech icon, as SVG source, with the dark-theme variant beside it.
 *
 * This module exists to be `import()`ed, not imported. Inlining these into the
 * page cost ~47KB of markup on every visit, including the phones where the
 * easter egg never initialises. As one lazy chunk they are fetched once, when
 * someone is about to need them.
 *
 * Only the four icons that paint themselves black differ between themes. Every
 * other logo keeps its brand colours in both.
 */
export const confettiIcons: Array<{ light: string; dark: string }> = [
  { light: astro, dark: astro.replace(/#17191E/gi, WHITE) },
  { light: codex, dark: codex.replace('#111', WHITE) },
  { light: copilot, dark: whiteRoot(copilot) },
  { light: express, dark: whiteRoot(express) },
  ...[
    claudeCode,
    eslint,
    git,
    github,
    java,
    javascript,
    mysql,
    node,
    opencode,
    pinia,
    playwright,
    postgresql,
    react,
    typescript,
    vite,
    vitest,
    vue
  ].map((source) => ({ light: source, dark: source }))
]
