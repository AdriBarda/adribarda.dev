import type { CollectionEntry } from 'astro:content'

export type SectionEntry = CollectionEntry<'sections'>

export type SectionGroup = {
  scene: number
  entries: SectionEntry[]
}

export function groupSectionsByScene(sections: SectionEntry[]): SectionGroup[] {
  const groups = new Map<number, SectionEntry[]>()

  sections.forEach((entry) => {
    const existing = groups.get(entry.data.scene)

    if (existing) {
      existing.push(entry)
      return
    }

    groups.set(entry.data.scene, [entry])
  })

  return [...groups.entries()]
    .sort(([sceneA], [sceneB]) => sceneA - sceneB)
    .map(([scene, entries]) => ({
      scene,
      entries: entries.sort((entryA, entryB) => entryA.data.order - entryB.data.order)
    }))
}
