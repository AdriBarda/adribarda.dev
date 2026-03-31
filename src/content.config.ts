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
    eyebrow: z.string().optional(),
    meta: z.array(z.string()).default([]),
    role: z.string().optional(),
    title: z.string(),
    summary: z.string(),
    highlights: z.array(z.string()).default([]),
    profileLabel: z.string().optional(),
    details: z
      .array(
        z.object({
          label: z.string(),
          value: z.string()
        })
      )
      .default([]),
    socials: z
      .object({
        github: z
          .object({
            label: z.string(),
            url: z.string()
          })
          .optional(),
        linkedin: z
          .object({
            label: z.string(),
            url: z.string()
          })
          .optional()
      })
      .optional()
  })
})

export const collections = {
  sections
}
