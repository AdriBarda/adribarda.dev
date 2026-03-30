import { glob } from 'astro/loaders'
import { defineCollection } from 'astro:content'
import z from 'zod'

const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sections' }),
  schema: z.object({
    order: z.number().int().positive(),
    scene: z.number().int().min(1).max(4),
    cardSize: z.enum(['hero', 'large', 'small']),
    section: z.enum(['presentation', 'impact', 'experience', 'stack', 'skills', 'about-me']),
    eyebrow: z.string(),
    title: z.string(),
    summary: z.string(),
    highlights: z.array(z.string()).default([])
  })
})

export const collections = {
  sections
}
