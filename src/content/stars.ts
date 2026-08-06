const cache = new Map<string, Promise<string | undefined>>()

const format = (count: number) =>
  count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)

export function starsFor(
  owner: string,
  repository: string,
  fallback?: string
): Promise<string | undefined> {
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
          typeof data.stargazers_count === 'number' ? format(data.stargazers_count) : fallback
        )
        .catch(() => fallback)
    )
  }

  return cache.get(slug)!
}
