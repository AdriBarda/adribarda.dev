import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatStars, starsFor } from './stars'

describe('formatStars', () => {
  it('abbreviates from 1000 up, with one decimal', () => {
    expect(formatStars(999)).toBe('999')
    expect(formatStars(1000)).toBe('1.0k')
    expect(formatStars(1234)).toBe('1.2k')
  })
})

// `starsFor` caches per slug for the whole module, so every test uses its own repo name.
describe('starsFor', () => {
  const respond = (body: unknown, init?: ResponseInit) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), init))

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the formatted count from the GitHub API', async () => {
    const fetchMock = respond({ stargazers_count: 1234 })
    vi.stubGlobal('fetch', fetchMock)

    await expect(starsFor('owner', 'ok')).resolves.toBe('1.2k')
    expect(fetchMock).toHaveBeenCalledWith('https://api.github.com/repos/owner/ok', expect.anything())
  })

  // Offline or timed-out builds must still render (with a skeleton), not crash.
  it('returns undefined when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    await expect(starsFor('owner', 'offline')).resolves.toBeUndefined()
  })

  // Without the type guard the page would print "undefined" as the star count.
  it('returns undefined when the payload has no star count', async () => {
    vi.stubGlobal('fetch', respond({ name: 'repo' }))

    await expect(starsFor('owner', 'no-stars')).resolves.toBeUndefined()
  })

  it('fetches each repository only once', async () => {
    const fetchMock = respond({ stargazers_count: 5 })
    vi.stubGlobal('fetch', fetchMock)

    const [first, second] = await Promise.all([starsFor('owner', 'cached'), starsFor('owner', 'cached')])

    expect(first).toBe('5')
    expect(second).toBe('5')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
