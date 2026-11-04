const cache = new Map<string, Promise<string | undefined>>()

/** Shared with the client refresh so build-time and live counts read the same. */
export const formatStars = (count: number) =>
  count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)

/** Live count at build time; undefined when GitHub can't be reached (the page shows a skeleton). */
export function starsFor(owner: string, repository: string): Promise<string | undefined> {
  const slug = `${owner}/${repository}`

  if (!cache.has(slug)) {
    cache.set(
      slug,
      fetch(`https://api.github.com/repos/${slug}`, {
        headers: { accept: 'application/vnd.github+json', 'user-agent': 'adribarda.dev' },
        signal: AbortSignal.timeout(5000)
      })
        .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
        .then((data) =>
          typeof data.stargazers_count === 'number' ? formatStars(data.stargazers_count) : undefined
        )
        .catch(() => undefined)
    )
  }

  return cache.get(slug)!
}
