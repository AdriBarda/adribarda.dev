# adribarda.dev

Personal portfolio. A static single-page site built with Astro, styled with Tailwind CSS v4, and animated with GSAP.

[![Astro](https://img.shields.io/badge/Astro-6.1.1-FF5D01?logo=astro&logoColor=white)](https://astro.build/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![GSAP](https://img.shields.io/badge/GSAP-3.14.2-88CE02?logo=greensock&logoColor=0A0A0A)](https://gsap.com/)
[![Vite](https://img.shields.io/badge/Vite-7.3.2-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Node](https://img.shields.io/badge/Node-%3E%3D22.12.0-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org/)

The page is one Astro route composed of scene components. Copy lives in markdown
collections rather than in the components, and the only client-side JavaScript is a
handful of plain TypeScript modules for motion — there is no UI framework.

## Stack

| | |
| --- | --- |
| Astro 6 | Routing, components, static output |
| Tailwind CSS v4 | Styling, via the `@tailwindcss/vite` plugin |
| GSAP | Pointer field, confetti, scroll motion |
| Zod | Schema for the content collections |
| TypeScript | Strict, through `astro/tsconfigs/strict` |

Fonts are self-hosted from `@fontsource-variable`, and `@vercel/analytics` is loaded
from the layout.

## Getting started

Requires Node `>=22.12.0` and pnpm 10.

```sh
pnpm install
pnpm dev
```

The dev server prints its URL, which includes the `/adribarda.dev` base path.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build to `dist/` |
| `pnpm preview` | Serve the built output |
| `pnpm astro -- --help` | Astro CLI help |

There is no test or lint script; `pnpm build` is the check.

## Structure

```text
.
├── public/                        Copied verbatim into the build
├── src/
│   ├── assets/                    Images, plus tech-stack icons
│   ├── components/
│   │   ├── scene/                 One component per section of the page
│   │   └── site/                  Nav and footer
│   ├── content/
│   │   ├── sections/              Markdown copy, one file per section
│   │   ├── sections.ts            Loads and orders the entries
│   │   └── stars.ts               GitHub star count, read at build time
│   ├── content.config.ts          Zod schema for the section frontmatter
│   ├── layouts/Layout.astro       Document shell, theme script
│   ├── pages/index.astro          The only route
│   ├── scripts/                   Client-side motion modules
│   └── styles/global.css          Design tokens and all component styles
├── astro.config.mjs
└── tsconfig.json
```

## Content

Section copy is markdown in `src/content/sections/`, validated by the Zod schema in
`src/content.config.ts`. Frontmatter drives the order, scene number, and card size;
the body is the prose.

Changing a content-driven section means touching three places: the schema, the
markdown entry, and the component that reads it.

## Author

[@AdriBarda](https://github.com/AdriBarda)
