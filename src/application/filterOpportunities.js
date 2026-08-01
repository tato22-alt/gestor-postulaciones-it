import { OPPORTUNITY_STATUSES } from '../constants/domainOptions.js'

const VALID_OPPORTUNITY_STATUSES = new Set(
  Object.values(OPPORTUNITY_STATUSES).map((status) => status.value),
)

const COMBINING_DIACRITICAL_MARKS = /[̀-ͯ]/g

function normalizeSearchText(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(COMBINING_DIACRITICAL_MARKS, '')
}

export default function filterOpportunities(
  opportunities,
  { searchQuery = '', status = null } = {},
) {
  if (!Array.isArray(opportunities)) {
    return []
  }

  if (status !== null && !VALID_OPPORTUNITY_STATUSES.has(status)) {
    return []
  }

  const normalizedQuery = normalizeSearchText(searchQuery)

  return opportunities.filter((opportunity) => {
    const matchesStatus = status === null || opportunity?.status === status

    if (!matchesStatus) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    const company = normalizeSearchText(opportunity?.company)
    const title = normalizeSearchText(opportunity?.title)

    return company.includes(normalizedQuery) || title.includes(normalizedQuery)
  })
}
