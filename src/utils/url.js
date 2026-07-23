export function isValidHttpUrl(value) {
  if (typeof value !== 'string') {
    return false
  }

  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeHttpUrl(value) {
  return new URL(value.trim()).toString()
}
