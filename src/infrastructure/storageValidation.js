// Shape checks shared by the localStorage repositories. Persisted data is untrusted input,
// so every repository validates parsed JSON with these helpers before rehydrating entities.

export function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function hasExactFields(value, fields) {
  const keys = Object.keys(value)
  return keys.length === fields.length && fields.every((field) => Object.hasOwn(value, field))
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function isValidTimestamp(value) {
  if (typeof value !== 'string') {
    return false
  }

  const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  const parsedTimestamp = new Date(value)

  return (
    isoTimestampPattern.test(value) &&
    !Number.isNaN(parsedTimestamp.getTime()) &&
    parsedTimestamp.toISOString() === value
  )
}
