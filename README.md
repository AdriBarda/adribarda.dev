# Adri Portfolio

Personal portfolio built with Astro, React islands, Tailwind CSS v4, and GSAP-driven scene interactions.

[![Astro](https://img.shields.io/badge/Astro-6.1.1-FF5D01?logo=astro&logoColor=white)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19.2.5-61DAFB?logo=react&logoColor=0A0A0A)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.3.2-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Node](https://img.shields.io/badge/Node-%3E%3D22.12.0-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org/)

## Overview

This repo contains a static one-page portfolio with a scene-based layout, animated transitions, content-driven sections, and a small React control layer for client-side interactions.

## Tech Stack

- Astro 6 for page structure and static output
- React 19 for interactive islands and controllers
- Tailwind CSS v4 for styling
- GSAP for motion and viewport behavior
- Zod-backed Astro content collections for section content
- TypeScript with strict Astro config
- pnpm for package management

## Features

- Scene-based portfolio layout
- Animated viewport and timeline interactions
- Theme toggle with persisted preference
- Content-driven sections powered by markdown entries
- Static build output suitable for GitHub Pages and other static hosts

## Getting Started

### Requirements

- Node `>=22.12.0`
- pnpm

### Install

```sh
pnpm install
```

### Run Locally

```sh
pnpm dev
```

### Production Build

```sh
pnpm build
```

### Preview The Build

```sh
pnpm preview
```

## Available Commands

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `pnpm install`         | Install dependencies                 |
| `pnpm dev`             | Start the Astro dev server           |
| `pnpm build`           | Create a production build in `dist/` |
| `pnpm preview`         | Preview the built site locally       |
| `pnpm astro -- --help` | Show Astro CLI help                  |

## Project Structure

```text
.
├── public/
├── src/
│   ├── assets/tech-stack/
│   ├── components/
│   │   ├── maze/
│   │   ├── scene/
│   │   ├── site/
│   │   ├── theme/
│   │   └── ui/
│   ├── content/
│   │   └── sections/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   └── theme/
├── astro.config.mjs
└── package.json
```

## Content Model

Portfolio copy is stored in `src/content/sections/` and validated through `src/content.config.ts`.

When changing content-driven UI, keep these in sync:

- `src/content.config.ts`
- the relevant markdown entry in `src/content/sections/`
- the consuming component(s)

## Verification

Use the production build as the main verification step:

```sh
pnpm build
```

## Author

[@AdriBarda](https://github.com/AdriBarda)
