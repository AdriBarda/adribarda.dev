import { describe, expect, it } from 'vitest'
import { groupSectionsByScene } from './sections'
import type { SectionEntry } from './sections'

// Only `scene` and `order` matter to the grouping, so the rest of the entry is left out.
const entry = (id: string, scene: number, order: number) =>
  ({ id, collection: 'sections', data: { scene, order } }) as unknown as SectionEntry

const ids = (entries: SectionEntry[]) => entries.map(({ id }) => id)

describe('groupSectionsByScene', () => {
  it('groups entries by scene, in scene order', () => {
    const groups = groupSectionsByScene([
      entry('stack', 3, 1),
      entry('presentation', 1, 1),
      entry('experience', 2, 1)
    ])

    expect(groups.map(({ scene }) => scene)).toEqual([1, 2, 3])
  })

  it('sorts the entries inside a scene by order', () => {
    const [group] = groupSectionsByScene([
      entry('impact', 1, 3),
      entry('presentation', 1, 1),
      entry('details', 1, 2)
    ])

    expect(ids(group.entries)).toEqual(['presentation', 'details', 'impact'])
  })
})
