// Rules shared by lists of short free-text values, such as skills or target roles. Two
// values that differ only in case, accents, or spacing are the same value.

const COMBINING_DIACRITICAL_MARKS = /[̀-ͯ]/g

// Trims and collapses inner whitespace, keeping the text the user wrote.
export function normalizeListText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

// Comparison key: "Gestión de Proyectos" and "gestion  de proyectos" are the same value.
export function getListTextKey(value) {
  return normalizeListText(value)
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(COMBINING_DIACRITICAL_MARKS, '')
}

export function hasListText(values, value) {
  const key = getListTextKey(value)
  return values.some((current) => getListTextKey(current) === key)
}

export function isValidTextList(values, { maxLength, maxCount }) {
  return (
    Array.isArray(values) &&
    values.length <= maxCount &&
    values.every(
      (value) =>
        typeof value === 'string' &&
        value === normalizeListText(value) &&
        value.length > 0 &&
        value.length <= maxLength,
    ) &&
    new Set(values.map(getListTextKey)).size === values.length
  )
}

// Returns an error code, or null when the value can be added to the current list.
export function validateListTextInput(value, currentValues, { maxLength, maxCount }) {
  const text = normalizeListText(value)

  if (!text) return 'required'
  if (text.length > maxLength) return 'too_long'
  if (hasListText(currentValues, text)) return 'duplicate'
  if (currentValues.length >= maxCount) return 'too_many'

  return null
}
