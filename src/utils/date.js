// Calendar dates are stored as 'YYYY-MM-DD' strings so they mean the same day in every
// time zone. These helpers convert between those strings and the user's local calendar.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidDateString(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    return false
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`)

  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value
}

export function toLocalDateString(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function addDaysToDateString(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`)

  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// Start of the given calendar day in the user's local time zone, as an ISO timestamp.
export function localDateStringToTimestamp(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)

  return new Date(year, month - 1, day).toISOString()
}

export function formatDateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)

  return new Intl.DateTimeFormat('es-AR').format(new Date(year, month - 1, day))
}
