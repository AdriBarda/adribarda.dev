import { glob } from 'astro/loaders'
import { defineCollection } from 'astro:content'
import z from 'zod'

const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sections' }),
  schema: z.object({
    order: z.number().int().positive(),
    scene: z.number().int().min(1).max(5),
    cardSize: z.enum(['hero', 'large', 'small']),
    section: z.enum(['presentation', 'impact', 'experience', 'stack', 'open-source', 'about-me']),
    eyebrow: z.string().optional(),
    meta: z.array(z.string()).default([]),
    role: z.string().optional(),
    title: z.string(),
    summary: z.string(),
    highlights: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
    education: z
      .object({
        institution: z.string(),
        program: z.string(),
        period: z.string()
      })
      .optional(),
    profileLabel: z.string().optional(),
    details: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          url: z.string().optional()
        })
      )
      .default([]),
    links: z
      .array(
        z.object({
          repository: z.string(),
          owner: z.string(),
          repositoryUrl: z.string(),
          project: z.string(),
          stars: z.string().optional(),
          language: z.string().optional(),
          license: z.string().optional(),
          contribution: z.string(),
          reason: z.string().optional(),
          pullRequestUrl: z.string(),
          meta: z.array(z.string()).default([])
        })
      )
      .default([]),
    items: z
      .array(
        z.object({
          company: z.string(),
          location: z.string().optional(),
          role: z.string(),
          period: z.string(),
          description: z.string(),
          highlights: z.array(z.string()).default([]),
          highlight: z.boolean().optional()
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
