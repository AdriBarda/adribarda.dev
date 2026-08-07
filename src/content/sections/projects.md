---
order: 5
scene: 4
cardSize: hero
section: projects
eyebrow: Projects
title: Things I build in my own time.
summary: Products I design, build, and ship end to end, plus a few smaller things I keep in the open.
projects:
  - name: Archie
    tagline: A Steam price tracker that sends you a Discord DM the moment a game you want drops in price.
    stack:
      - TypeScript
      - Vue
      - Express
      - Prisma
      - PostgreSQL
      - Astro
    build: A pnpm TypeScript monorepo spanning an Express/Prisma/PostgreSQL API, a Vue/Vite dashboard, an Astro landing page, and a Chrome MV3 extension.
    highlights:
      - Chrome MV3 extension integrated directly with the Steam store.
      - Discord DM alerts driven by tracked price thresholds.
    source: private

  - name: JobInbox
    tagline: A personal CRM that reads your Gmail and keeps every job application moving through a Kanban pipeline on its own.
    stack:
      - TypeScript
      - Vue 3
      - Express
      - Prisma
      - PostgreSQL
      - OpenAI
    build: A pnpm TypeScript monorepo with a Vue 3/Vite/Tailwind frontend and an Express/Prisma/PostgreSQL API, with graphile-worker running background jobs.
    highlights:
      - Gmail OAuth ingestion with OpenAI-powered email classification.
      - Applications tracked and advanced automatically, no manual entry.
    source: private

  - name: MultiTrack
    tagline: Turns phones into synchronized speakers for whatever is playing on the TV.
    stack:
      - TypeScript
      - Next.js
      - Express
      - Socket.IO
    build: A pnpm monorepo pairing a Next.js 16 web app with an Express/Socket.IO server that keeps TV video and mobile companion audio in sync.
    highlights:
      - QR-based session pairing between TV and mobile devices.
      - Real-time playback synchronization over WebSockets.
    source: private

  - name: url-shortener
    tagline: A full-stack URL shortener with a Vue 3 dashboard, Express BFF, and Redis-backed redirect caching.
    year: '2026'
    stack:
      - TypeScript
      - Vue 3
      - Express
      - Redis
      - Supabase
    highlights:
      - GitHub OAuth via Supabase with Redis-powered sessions.
    repositoryUrl: https://github.com/AdriBarda/url-shortener
    source: public

  - name: tailwind-skills
    tagline: A set of agent skills for Tailwind CSS that fixes non-canonical class warnings using the live language server.
    year: '2026'
    stack:
      - JavaScript
      - Tailwind CSS
    repositoryUrl: https://github.com/AdriBarda/tailwind-skills
    source: public

  - name: my-jscamp-journey
    tagline: Everything I built and learned working through JsCamp, kept in the open.
    year: '2026'
    stack:
      - JavaScript
    repositoryUrl: https://github.com/AdriBarda/my-jscamp-journey
    source: public
---
