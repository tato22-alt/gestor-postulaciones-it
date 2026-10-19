// Minimal, explainable duplicate signal: two opportunities point to the same publication
// when their URLs match after lowercasing protocol and host, dropping the #fragment, and
// dropping a trailing slash. A match is only a warning; it never blocks or deletes.
export function normalizeUrlForComparison(value) {
  let url

  try {
    url = new URL(String(value).trim())
  } catch {
    return null
  }

  const path = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname

  return `${url.protocol}//${url.host}${path}${url.search}`
}

export function findOpportunityWithSameUrl(opportunities, url, excludedId = null) {
  const normalizedUrl = normalizeUrlForComparison(url)

  if (normalizedUrl === null) {
    return null
  }

  return (
    opportunities.find(
      (opportunity) =>
        opportunity.id !== excludedId && normalizeUrlForComparison(opportunity.url) === normalizedUrl,
    ) ?? null
  )
}
