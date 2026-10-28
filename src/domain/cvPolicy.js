// Rules for the CV text stored in the CandidateProfile and for the copy sent to the AI.

export const CV_TEXT_MAX_LENGTH = 20000
// The AI receives at most this many characters, after contact data is removed.
export const CV_AI_MAX_LENGTH = 15000
export const CV_FILE_MAX_BYTES = 5 * 1024 * 1024

export const REDACTED_PLACEHOLDER = '[dato quitado]'

const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+/g
const URL = /\b(?:https?:\/\/|www\.)\S+|\b(?:linkedin|github|gitlab)\.com\/\S*/gi
const CUIL = /\b\d{2}-?\d{8}-?\d\b/g
// Argentine DNI: 7 or 8 digits, with or without dots (12.345.678).
const DNI = /\b\d{1,2}\.?\d{3}\.?\d{3}\b/g
// A dot only counts inside a number (11.2345.6789), so "2023-2024. 20 horas" is not a phone.
const PHONE_CANDIDATE = /\+?\(?\d(?:[\d\s()-]|\.(?=\d)){6,}\d/g
const YEAR = /^(?:19|20)\d{2}$/

// A phone has 8 to 15 digits. Year ranges such as "2019 - 2023" are kept.
function isPhone(match) {
  const digits = match.replace(/\D/g, '')
  const groups = match.match(/\d+/g) ?? []

  return digits.length >= 8 && digits.length <= 15 && !groups.every((group) => YEAR.test(group))
}

/**
 * Removes contact and identity data before the CV leaves the device: emails, links,
 * CUIL/CUIT, DNI, and phone numbers. Returns the cleaned text and how many values were
 * removed. It does not try to remove names, which cannot be detected reliably.
 */
export function redactContactData(text) {
  if (typeof text !== 'string') return { text: '', removedCount: 0 }

  let removedCount = 0
  const replace = (pattern, accept = () => true) => (current) =>
    current.replace(pattern, (match) => {
      if (!accept(match)) return match
      removedCount += 1
      return REDACTED_PLACEHOLDER
    })

  const steps = [replace(EMAIL), replace(URL), replace(CUIL), replace(PHONE_CANDIDATE, isPhone), replace(DNI)]
  const cleaned = steps.reduce((current, step) => step(current), text)

  return { text: cleaned, removedCount }
}

// Line breaks are kept (they help to read the CV), but runs of blank space are collapsed.
export function normalizeCvText(value) {
  if (typeof value !== 'string') return ''

  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function isValidCvText(value) {
  return typeof value === 'string' && value.length <= CV_TEXT_MAX_LENGTH && value === normalizeCvText(value)
}
